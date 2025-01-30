const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const uuid = require('uuid').v4;

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Peers
const peers = {};

// Save id of broadcaster
let broadcasterId = null;

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');
  const peerId = uuid();
  peers[peerId] = socket;

  // Handle broadcast request
  socket.on('broadcast', () => {
    if (broadcasterId) {
        // If there's already a broadcaster, reject the request
        socket.emit('broadcast-rejected');
    } else {
        // If no broadcaster, set this peer as the broadcaster
        broadcasterId = peerId;
        socket.emit('broadcast-accepted');
        socket.broadcast.emit('broadcasting');
    }
  });

  // Handle stop broadcast request
  socket.on('stop-broadcast', () => {
    if (broadcasterId === peerId) {
      broadcasterId = null;
    }
  });

  // Relay SDP offer to all connected clients except the sender
  socket.on('offer', (data) => {
    socket.broadcast.emit('offer', data);
  });

  // Relay SDP answer to all connected clients except the sender
  socket.on('answer', (data) => {
    socket.broadcast.emit('answer', data);
  });

  // Relay ICE candidates to all connected clients except the sender
  socket.on('candidate', (candidate) => {
    socket.broadcast.emit('candidate', candidate);
  });

  // Log when a user disconnects
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    if (broadcasterId === peerId) {
      broadcasterId = null;
      socket.broadcast.emit('broadcasting-stopped');
    }
    delete peers[peerId];
  });

  // If there is a broadcaster let the client know
  socket.on('im-ready', () => {
      if (broadcasterId) {
        socket.emit('broadcasting');
        socket.broadcast.emit('new-viewer');
      }
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});