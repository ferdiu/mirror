import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static("public"));

interface Peers {
  [key: string]: Socket;
}

const peers: Peers = {};
let broadcasterId: string | null = null;

io.on("connection", (socket: Socket) => {
  console.log("A user connected");
  const peerId = uuidv4();
  peers[peerId] = socket;

  socket.on("broadcast", () => {
    if (broadcasterId) {
      socket.emit("broadcast-rejected");
    } else {
      broadcasterId = peerId;
      socket.emit("broadcast-accepted");
      socket.broadcast.emit("broadcasting");
    }
  });

  socket.on("stop-broadcast", () => {
    if (broadcasterId === peerId) {
      broadcasterId = null;
    }
  });

  socket.on("offer", (data) => {
    socket.broadcast.emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.broadcast.emit("answer", data);
  });

  socket.on("candidate", (candidate) => {
    socket.broadcast.emit("candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    if (broadcasterId === peerId) {
      broadcasterId = null;
      socket.broadcast.emit("broadcasting-stopped");
    }
    socket.broadcast.emit("peer-disconnected", peerId);
    delete peers[peerId];
  });

  socket.on("im-ready", () => {
    socket.broadcast.emit("peer-connected", peerId);
    if (broadcasterId) {
      socket.emit("broadcasting");
      socket.broadcast.emit("new-viewer");
    }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
