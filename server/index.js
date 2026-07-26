const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let waitingUser = null;
let onlineCount = 0;

// ===== ADDED: storage for group call rooms =====
const groupCallRooms = {}; // { roomId: [ { socketId, name }, ... ] }

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  onlineCount++;
  io.emit("onlineCount", onlineCount);

  socket.on("join", (name) => {
    socket.userName = name;

    if (waitingUser && waitingUser.id !== socket.id) {
      const roomId = `room-${waitingUser.id}-${socket.id}`;

      waitingUser.join(roomId);
      socket.join(roomId);

      io.to(roomId).emit("matched", {
        roomId,
        users: [waitingUser.userName, socket.userName],
      });

      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit("waiting");
    }
  });

  // --- Skip / end chat ---
  socket.on("skip", ({ roomId }) => {
    socket.to(roomId).emit("partner-left");
    socket.leave(roomId);
  });

  socket.on("call-offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("call-offer", { offer, callerId: socket.id });
  });

  socket.on("call-answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("call-answer", { answer });
  });

  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  socket.on("call-end", ({ roomId }) => {
    socket.to(roomId).emit("call-end");
  });

  socket.on("sendMessage", ({ roomId, message, senderId }) => {
    socket.to(roomId).emit("receiveMessage", {
      message,
      senderId,
    });
  });

  // ===== ADDED: group call handlers (renamed to avoid clashing with the 1-on-1 handlers above) =====

  socket.on("join-group-room", ({ roomId, name }) => {
    socket.join(roomId);
    socket.data.groupRoomId = roomId;
    socket.data.groupName = name;

    if (!groupCallRooms[roomId]) {
      groupCallRooms[roomId] = [];
    }

    const existingUsers = groupCallRooms[roomId];
    socket.emit("existing-users", existingUsers);

    groupCallRooms[roomId].push({ socketId: socket.id, name });
    socket.to(roomId).emit("user-joined", { socketId: socket.id, name });
  });

  socket.on("group-offer", ({ to, offer, name }) => {
    io.to(to).emit("group-offer", { from: socket.id, offer, name });
  });

  socket.on("group-answer", ({ to, answer }) => {
    io.to(to).emit("group-answer", { from: socket.id, answer });
  });

  socket.on("group-ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("group-ice-candidate", { from: socket.id, candidate });
  });

  socket.on("leave-group-room", () => {
    handleGroupLeave(socket);
  });

  // ===== END ADDED SECTION =====

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }

    // ===== ADDED: clean up group call room on disconnect =====
    handleGroupLeave(socket);

    onlineCount--;
    io.emit("onlineCount", onlineCount);
  });
});

// ===== ADDED: helper function, outside io.on =====
function handleGroupLeave(socket) {
  const roomId = socket.data.groupRoomId;
  if (!roomId || !groupCallRooms[roomId]) return;

  groupCallRooms[roomId] = groupCallRooms[roomId].filter(
    (user) => user.socketId !== socket.id
  );

  socket.to(roomId).emit("user-left", { socketId: socket.id });

  if (groupCallRooms[roomId].length === 0) {
    delete groupCallRooms[roomId];
  }
}

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});