// components/ChatWidget.tsx — AstroCool interactive chat UI
"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";

/* ── Types ───────────────────────────────────────── */

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

/* ── Constants ───────────────────────────────────── */

const STARTER_CHIPS = [
  "What is AstroCool?",
  "How does cooling work in space?",
  "How to contact AstroCool?",
  "Who is the team?",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "ai",
  text: "Welcome aboard! 🚀 I'm AstroCool AI — ask me anything about our mission to move AI data centers to Low Earth Orbit. Try one of the suggestions below, or type your own question.",
};

/* ── Component ───────────────────────────────────── */

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
        });

        let answer: string;

        if (res.ok) {
          const data = await res.json();
          answer = data.answer;
        } else if (res.status === 429) {
          answer =
            "⏳ You're asking too fast! Please wait a moment before your next question.";
        } else if (res.status === 400) {
          const data = await res.json();
          answer = data.error || "Please rephrase your question.";
        } else {
          answer =
            "AstroCool's orbital systems are temporarily offline. Please try again shortly — our ground team is on it 🛰️";
        }

        const aiMsg: Message = {
          id: `a-${Date.now()}`,
          role: "ai",
          text: answer,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "ai",
            text: "Connection lost. Please check your network and try again.",
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleChipClick = (chip: string) => {
    sendMessage(chip);
  };

  return (
    <div className="relative z-10 flex h-full w-full flex-col">
      {/* ── Top bar ──────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <img
            src="/favicon.ico"
            alt="AstroCool logo"
            className="h-10 w-10 rounded-full"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              AstroCool
            </h1>
            <p className="text-[11px] tracking-wide text-slate-500 font-semibold uppercase">
              AI Runs Hot We Make It Cool
            </p>
          </div>
        </div>
        <span className="rounded-full border border-astro-amber/30 bg-amber-50 px-3 py-1 text-xs font-medium text-astro-amber">
          Prototype Demo — RT-MSSU
        </span>
      </header>

      {/* ── Chat messages ────────────────────────── */}
      <div
        ref={scrollRef}
        className="chat-scroll flex flex-1 flex-col gap-4 overflow-y-auto bg-surface-alt px-4 py-6 sm:px-6"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`animate-fade-slide-up flex ${msg.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            {msg.role === "ai" && (
              <div className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-astro-teal/10 ring-1 ring-astro-teal/20">
                <img src="/favicon.ico" alt="AstroCool" className="h-7 w-7" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${msg.role === "user"
                  ? "rounded-br-md bg-astro-teal text-white font-medium"
                  : "rounded-bl-md border border-border-light bg-white text-slate-900 shadow-sm"
                }`}
            >
              {msg.role === "ai" && msg.id !== "welcome" && (
                <span className="mb-1 block text-[11px] font-bold tracking-wide text-astro-teal">
                  AstroCool AI
                </span>
              )}
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="animate-fade-in flex items-start justify-start">
            <div className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-astro-teal/10 ring-1 ring-astro-teal/20">
              <img src="/favicon.ico" alt="AstroCool" className="h-7 w-7" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border-light bg-white px-5 py-4 shadow-sm">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom: chips + input ────────────────── */}
      <div className="shrink-0 border-t border-border bg-white px-4 pb-4 pt-3 sm:px-6">
        {/* Starter chips */}
        {messages.length <= 1 && !isLoading && (
          <div className="mb-3 flex flex-wrap gap-2">
            {STARTER_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:border-astro-teal/50 hover:bg-astro-teal/5 hover:text-astro-teal"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about our mission, tech, or vision..."
            maxLength={300}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-border bg-surface-alt px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-astro-teal/60 focus:ring-1 focus:ring-astro-teal/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-astro-teal text-white transition-all hover:bg-astro-teal/80 disabled:opacity-40 disabled:hover:bg-astro-teal"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
