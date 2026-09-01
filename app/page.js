"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 2500);
    return () => clearTimeout(timer);
  }, [error]);

  const validate = () => {
    if (!name.trim()) {
      setError("Please enter your name to continue");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return false;
    }
    return true;
  };
  

  const startChat = () => {
    if (!validate()) return;
    router.push(`/chat?name=${encodeURIComponent(name.trim())}`);
  };

  const voiceHandle = () => {
    if (!validate()) return;
    const roomId = Math.random().toString(36).substring(2, 8);
    router.push(`/group-call/${roomId}?name=${encodeURIComponent(name.trim())}`);
  };

  
  const aiChatHandle = () => {
    router.push("/chat-ai");
  };
   

  return (
    <main className="w-screen h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-500 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse" />

      {/* Toast notification */}
      {error && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium animate-bounce">
          ⚠️ {error}
        </div>
      )}

      {/* Card */}
      <div className="relative z-10 text-center p-8 max-w-sm w-full mx-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
        <h1 className="text-4xl font-extrabold mb-1 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
          NextChat
        </h1>
        <p className="text-white/60 text-sm mb-6">Talk to strangers, instantly.</p>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError("");
          }}
          className={`w-full p-3 rounded-xl border bg-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500 transition ${
            shake ? "border-red-500 animate-shake" : "border-white/20"
          }`}
        />

        {/* FIX: single flex-col wrapper with consistent gap instead of
            separate divs with mismatched margins (mt-4 / my-4) that were
            stacking up and pushing content taller than the viewport */}
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex gap-3">
            <button
              onClick={startChat}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl text-base md:text-lg font-bold p-3 transition transform hover:scale-105 shadow-lg"
            >
              Find Someone
            </button>

            <button
              onClick={voiceHandle}
              className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-xl text-base md:text-lg font-bold p-3 transition transform hover:scale-105 shadow-lg"
            >
              GC Call
            </button>
          </div>

          <button
            onClick={aiChatHandle}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-base md:text-lg font-bold p-3 transition transform hover:scale-105 shadow-lg"
          >
            Chat with AI
          </button>
        </div>
      </div>
    </main>
  );
}