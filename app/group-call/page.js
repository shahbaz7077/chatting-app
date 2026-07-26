"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GroupCallEntry() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    router.push(`/group-call/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/group-call/${roomId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="flex flex-col gap-4 w-80">
        <button
          className="px-4 py-2 rounded bg-lime-500 text-black font-medium"
          onClick={createRoom}
        >
          Create New Room
        </button>

        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-2 rounded bg-neutral-800 border border-neutral-700"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded bg-neutral-700"
            onClick={joinRoom}
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
}