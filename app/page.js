"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");

  const startChat = () => {
    if (!name.trim()) return;
    router.push(`/chat?name=${encodeURIComponent(name.trim())}`);
  };

  const voiceHandle = () => {
    if (!name.trim()) return;
    router.push(`/Room1?name=${encodeURIComponent(name.trim())}`);
  };

  return (
    <main className="w-screen h-dvh flex flex-col items-center justify-center bg-gray-50 text-gray-900">
      {/* Centered Content Card */}
      <div className="text-center p-6 max-w-sm w-full">
        <div>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg border border-pink-300 bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Buttons in same line */}
        <div className="flex gap-3 mt-3">
          <button
            onClick={startChat}
            className="flex-1 bg-blue-500 text-white rounded text-lg md:text-2xl font-bold p-3"
          >
            Find Someone
          </button>

          <button
            onClick={voiceHandle}
            className="flex-1 bg-blue-500 text-white rounded text-lg md:text-2xl font-bold p-3"
          >
            GC Call
          </button>
        </div>
      </div>
    </main>
  );
}