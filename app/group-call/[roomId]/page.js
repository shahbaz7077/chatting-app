"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";

// TODO: replace this with your ACTUAL deployed Render URL, e.g.
// "https://stranger-chat-backend.onrender.com"
const SOCKET_SERVER_URL = "https://chattingapp-xzjx.onrender.com";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // add a TURN server here later if calls fail on strict networks
    // { urls: "turn:your-turn-server", username: "user", credential: "pass" },
  ],
};

export default function GroupCallRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const [participants, setParticipants] = useState({}); // { socketId: name }

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef({}); // { socketId: RTCPeerConnection }

  useEffect(() => {
    return () => {
      // cleanup on unmount
      leaveCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPeerConnection = (socketId, remoteName) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add our local tracks to this connection
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    // When we get the remote stream back
    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [socketId]: event.streams[0],
      }));
    };

    // Send ICE candidates as they're discovered
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("group-ice-candidate", {
          to: socketId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "disconnected" ||
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        removePeer(socketId);
      }
    };

    peerConnectionsRef.current[socketId] = pc;
    setParticipants((prev) => ({ ...prev, [socketId]: remoteName }));

    return pc;
  };

  const removePeer = (socketId) => {
    const pc = peerConnectionsRef.current[socketId];
    if (pc) {
      pc.close();
      delete peerConnectionsRef.current[socketId];
    }
    setRemoteStreams((prev) => {
      const copy = { ...prev };
      delete copy[socketId];
      return copy;
    });
    setParticipants((prev) => {
      const copy = { ...prev };
      delete copy[socketId];
      return copy;
    });
  };

  const joinCall = async () => {
    if (!name.trim() || joining) return;
    setJoining(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const socket = io(SOCKET_SERVER_URL);
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-group-room", { roomId, name });
      });

      // Existing users already in the room -> we create offers to them
      socket.on("existing-users", async (users) => {
        for (const user of users) {
          const pc = createPeerConnection(user.socketId, user.name);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("group-offer", { to: user.socketId, offer, name });
        }
      });

      // Someone new joined -> just wait, they will send us an offer
      socket.on("user-joined", ({ socketId, name: newName }) => {
        setParticipants((prev) => ({ ...prev, [socketId]: newName }));
      });

      // We received an offer -> answer it
      socket.on("group-offer", async ({ from, offer, name: fromName }) => {
        const pc = createPeerConnection(from, fromName);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("group-answer", { to: from, answer });
      });

      // We received an answer to our offer
      socket.on("group-answer", async ({ from, answer }) => {
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });

      // Remote ICE candidate arrived
      socket.on("group-ice-candidate", async ({ from, candidate }) => {
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error("Error adding ICE candidate", err);
          }
        }
      });

      socket.on("user-left", ({ socketId }) => {
        removePeer(socketId);
      });

      setJoined(true);
    } catch (err) {
      console.error("getUserMedia failed:", err.name, err.message);
      alert(`Media error: ${err.name} — ${err.message}`);
    } finally {
      setJoining(false);
    }
  };

  const leaveCall = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave-group-room");
      socketRef.current.disconnect();
    }
    Object.keys(peerConnectionsRef.current).forEach((id) => removePeer(id));
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setJoined(false);
  };

  const handleLeaveClick = () => {
    leaveCall();
    router.push("/group-call");
  };

  if (!joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col gap-4 w-80">
          <h1 className="text-xl font-semibold">Join Room: {roomId}</h1>
          <input
            className="px-4 py-2 rounded bg-neutral-800 border border-neutral-700"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinCall()}
          />
          <button
            className="px-4 py-2 rounded bg-lime-500 text-black font-medium disabled:opacity-50"
            onClick={joinCall}
            disabled={joining}
          >
            {joining ? "Joining..." : "Join Call"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="relative">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-lg bg-neutral-900"
          />
          <span className="absolute bottom-2 left-2 text-sm bg-black/60 px-2 py-1 rounded">
            You
          </span>
        </div>

        {Object.entries(remoteStreams).map(([socketId, stream]) => (
          <RemoteVideo
            key={socketId}
            stream={stream}
            name={participants[socketId] || "Guest"}
          />
        ))}
      </div>

      <button
        className="mt-6 px-4 py-2 rounded bg-red-500 font-medium"
        onClick={handleLeaveClick}
      >
        Leave Call
      </button>
    </div>
  );
}

function RemoteVideo({ stream, name }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg bg-neutral-900"
      />
      <span className="absolute bottom-2 left-2 text-sm bg-black/60 px-2 py-1 rounded">
        {name}
      </span>
    </div>
  );
}