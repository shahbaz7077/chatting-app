"use client";

import { Suspense } from "react";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSearchParams } from "next/navigation";

function ChatContent() {
  const params = useSearchParams();
  const name = params.get("name");

  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [status, setStatus] = useState("Connecting...");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (!name) return;

    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // try websocket first, fallback to polling
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);
      newSocket.emit("join", name);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err.message);
      setStatus("Connection failed. Retrying...");
    });

    newSocket.on("waiting", () => {
      setStatus("Waiting for partner...");
    });

    newSocket.on("matched", (data) => {
      setRoomId(data.roomId);
      setStatus("Connected!");
    });

    newSocket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim() || !socket || !roomId) return;

    const msg = {
      roomId,
      message: message.trim(),
      senderId: socket.id,
    };

    socket.emit("sendMessage", msg);
    setMessages((prev) => [...prev, msg]);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleSkip = () => {
    if (!socket) return;
    setRoomId(null);
    setMessages([]);
    setStatus("Waiting for partner...");
    socket.emit("join", name);
  };

  if (!name) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 px-4 text-center text-slate-400">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <p className="font-semibold text-red-400">Access Denied</p>
          <p className="mt-1 text-sm text-slate-500">
            No name parameter provided in the URL.
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (status === "Connected!")
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (status === "Waiting for partner...")
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-slate-500/10 text-slate-400 border-slate-800";
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-0 sm:p-4 text-slate-100 antialiased overscroll-none selection:bg-indigo-500/30">
      <div className="flex h-full w-full max-w-md flex-col border-0 border-slate-800 bg-slate-900 shadow-2xl sm:h-[85vh] sm:rounded-2xl sm:border overflow-hidden">

        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Anonymous Room
            </h1>
            <p className="truncate text-[10px] font-mono text-slate-500">
              {roomId ? `ID: ${roomId}` : `User: ${name}`}
            </p>
          </div>

          {roomId && (
            <button
              onClick={handleSkip}
              className="ml-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-red-950 hover:text-red-400 hover:border-red-900 active:scale-95 touch-manipulation"
            >
              Skip ✕
            </button>
          )}
        </div>

        <div className={`border-b px-4 py-1.5 text-center text-xs font-medium tracking-wide transition-all duration-300 ${getStatusColor()}`}>
          {status}
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 space-y-3 scrollbar-none">
          {!roomId ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="rounded-full bg-indigo-500/10 p-4 text-indigo-400 animate-pulse">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">{status}</h3>
                <p className="text-xs text-slate-500 max-w-[220px] mt-1 mx-auto">
                  Searching the server match pool. Please keep this screen open.
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isMe = msg.senderId === socket?.id;
                return (
                  <div key={index} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`relative max-w-[78%] rounded-2xl px-4 py-2 text-sm shadow-md transition-all break-words
                      ${isMe
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {roomId && (
          <div className="border-t border-slate-800 bg-slate-900/80 p-3 flex items-center space-x-2 pb-safe-bottom">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="flex h-10 px-4 items-center justify-center rounded-xl bg-indigo-600 text-xs font-semibold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:active:scale-100 touch-manipulation"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400">
          Loading...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}