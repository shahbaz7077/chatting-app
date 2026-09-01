"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function ChatWithAI() {
  const [messages, setMessages] = useState([]); // { role: "user" | "model", text: "..." }
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", text: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages, // send prior turns for context
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages((prev) => [...prev, { role: "model", text: data.reply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-dvh w-screen flex-col items-center justify-center bg-slate-950 p-0 sm:p-4 text-slate-100">
      <div className="flex h-full w-full max-w-md flex-col border-0 border-slate-800 bg-slate-900 shadow-2xl sm:h-[85vh] sm:rounded-2xl sm:border overflow-hidden">

        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3.5">
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
              Chat with AI
            </h1>
            <p className="text-[10px] text-slate-500">Powered by Gemini</p>
          </div>
          <Link href="/">
            <button className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700">
              Home
            </button>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-2">
              <div className="rounded-full bg-lime-500/10 p-4 text-lime-400">
                🤖
              </div>
              <h3 className="text-sm font-semibold text-slate-200">
                Start a conversation
              </h3>
              <p className="text-xs text-slate-500 max-w-[220px]">
                Ask anything — this chat is powered by Google's Gemini model.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-md break-words whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-lime-600 text-black rounded-tr-none"
                      : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none px-4 py-2 text-sm border border-slate-700/50">
                Thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-800 bg-slate-900/80 p-3 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex h-10 px-4 items-center justify-center rounded-xl bg-lime-500 text-xs font-semibold text-black transition-all hover:bg-lime-400 active:scale-95 disabled:opacity-30"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}