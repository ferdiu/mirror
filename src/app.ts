import express from "express";
import http from "http";
import { Server } from "socket.io";
import { registerSocketEvents } from "./controllers/socket.controller";

// Use the port 3000 by default, or the one specified in the PORT environment variable
const portHttp = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT) : 3000;

// Create an Express app
const app = express();

// Serve static files from the "public" directory
app.use(express.static("public"));

// Create an HTTP and an HTTPs server
const serverHttp = http.createServer(app);

// Attach a Socket.IO server
const ioHttps = new Server(serverHttp);

// Register all socket events
registerSocketEvents(ioHttps);

// Start the HTTP server
serverHttp.listen(portHttp, () => {
  console.info(`Server is running on http://localhost:${portHttp}`);
});
