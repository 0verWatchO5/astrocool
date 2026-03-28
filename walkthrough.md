# AstroCool — Build Walkthrough

## What Was Built

A polished, competition-ready space-themed chat interface for the AstroCool AI assistant demo, with a hardened API route that proxies queries to a Raspberry Pi Flask backend.

### Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| [globals.css](file:///m:/Websites/astrocool/app/globals.css) | Modified | Space theme, CSS star field, Tailwind v4 tokens, animations |
| [layout.tsx](file:///m:/Websites/astrocool/app/layout.tsx) | Modified | AstroCool metadata, forced dark mode |
| [page.tsx](file:///m:/Websites/astrocool/app/page.tsx) | Modified | Minimal server component shell |
| [ChatWidget.tsx](file:///m:/Websites/astrocool/components/ChatWidget.tsx) | New | Full interactive chat UI (bubbles, typing dots, chips) |
| [route.ts](file:///m:/Websites/astrocool/app/api/ask/route.ts) | New | POST proxy with sanitisation, rate limiting, timeout |

## Key Features

**Frontend**
- Deep space dark background (`#050914`) with CSS-only star field (`box-shadow`)
- Sticky header: 🚀 AstroCool AI + amber "Prototype Demo — Competition Build" badge
- Chat bubbles: user (right, blue pill) / AI (left, glass background with 🛰️ avatar)
- Three-dot pulsing typing indicator while awaiting response
- Four clickable starter chips on first load
- Fixed bottom input bar with send button

**API Route**
- Input sanitisation: trim, strip non-printable chars, 300 char max → 400
- In-memory rate limiting: 10 req/IP/min with periodic cleanup → 429
- 8s timeout via `AbortSignal.timeout(8000)` → 502 with friendly fallback
- `PI_API_URL` server-only (never exposed to client)

## Verification Results

### Dev Server
Compiled successfully with Turbopack in 363ms, zero errors.

### Browser Testing

````carousel
![Initial load — space background, welcome message, starter chips, input bar](file:///C:/Users/mayur/.gemini/antigravity/brain/b305f758-405f-4707-992e-0ff2f4ef07a2/astrocool_homepage_1774722991175.png)
<!-- slide -->
![After clicking "What is AstroCool?" — user bubble right, AI response left with fallback (Pi not connected)](file:///C:/Users/mayur/.gemini/antigravity/brain/b305f758-405f-4707-992e-0ff2f4ef07a2/astrocool_response_1_1774723005876.png)
<!-- slide -->
![Full conversation with "Hello world" — all chat bubbles rendering correctly](file:///C:/Users/mayur/.gemini/antigravity/brain/b305f758-405f-4707-992e-0ff2f4ef07a2/astrocool_final_convo_2_1774723060440.png)
````

### API Error Handling
- **502 (Pi unreachable)** ✅ — Correct fallback message shown since `PI_API_URL` is set to a placeholder
- Once the Pi Flask API is live at the URL in `.env.local`, real answers will be returned

![Browser recording of the full test session](file:///C:/Users/mayur/.gemini/antigravity/brain/b305f758-405f-4707-992e-0ff2f4ef07a2/astrocool_visual_check_1774722966719.webp)
