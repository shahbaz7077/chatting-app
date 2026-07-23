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

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

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
   // Add alongside your existing socket.on("sendMessage", ...) etc.

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

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});