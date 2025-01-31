import express from "express";
import http from "http";
import { Server } from "socket.io";
import { registerSocketEvents } from "./controllers/socket.controller";

// Create an Express app, an HTTP server and a Socket.IO server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static("public"));

// Register all socket events
registerSocketEvents(io);

// Use the port 3000 by default, or the one specified in the PORT environment variable
const port = process.env.PORT ?? 3000;

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
