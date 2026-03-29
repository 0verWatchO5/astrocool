// app/api/ask/route.ts  AstroCool API proxy to Raspberry Pi Flask backend

import { NextRequest, NextResponse } from "next/server";

/* ── Rate-limiter store (in-memory, no Redis) ──────────────── */

interface RateBucket {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateBucket>();
const RATE_LIMIT = 10; // max requests
const RATE_WINDOW_MS = 60_000; // per 60 seconds

// Periodic cleanup every 5 minutes to prevent unbounded growth
if (typeof globalThis !== "undefined") {
  const CLEANUP_KEY = "__astrocool_cleanup";
  if (!(globalThis as Record<string, unknown>)[CLEANUP_KEY]) {
    (globalThis as Record<string, unknown>)[CLEANUP_KEY] = true;
    setInterval(() => {
      const now = Date.now();
      for (const [ip, bucket] of rateLimitMap) {
        if (now > bucket.resetTime) {
          rateLimitMap.delete(ip);
        }
      }
    }, 5 * 60_000);
  }
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimitMap.get(ip);

  if (!bucket || now > bucket.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

/* ── Sanitise input ────────────────────────────────────────── */

function sanitise(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  // Strip non-printable / control characters, keep basic ASCII + extended
  const cleaned = raw.replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, "").trim();
  if (cleaned.length === 0 || cleaned.length > 300) return null;
  return cleaned;
}

/* ── POST handler ──────────────────────────────────────────── */

const FALLBACK_MESSAGE =
  "AstroCool's orbital systems are temporarily offline. Please try again shortly  our ground team is on it 🛰️";

export async function POST(request: NextRequest) {
  // 1. Read client IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  // 2. Rate limit check
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before asking again." },
      { status: 429 }
    );
  }

  // 3. Parse & sanitise body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const query = sanitise(body.query);
  if (!query) {
    return NextResponse.json(
      {
        error:
          "Please enter a valid question (1–300 characters, no special control characters).",
      },
      { status: 400 }
    );
  }

  // 4. Forward to Pi Flask API
  const piUrl = process.env.PI_API_URL;
  if (!piUrl) {
    console.error("[AstroCool] PI_API_URL is not configured.");
    return NextResponse.json({ answer: FALLBACK_MESSAGE }, { status: 502 });
  }

  try {
    const piRes = await fetch(`${piUrl}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(8000),
    });

    if (!piRes.ok) {
      console.error(`[AstroCool] Pi returned status ${piRes.status}`);
      return NextResponse.json({ answer: FALLBACK_MESSAGE }, { status: 502 });
    }

    const data = (await piRes.json()) as { answer?: string };
    return NextResponse.json({
      answer: data.answer || FALLBACK_MESSAGE,
    });
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    console.error(
      `[AstroCool] Pi fetch failed: ${isTimeout ? "timeout (8s)" : String(err)}`
    );
    return NextResponse.json({ answer: FALLBACK_MESSAGE }, { status: 502 });
  }
}
