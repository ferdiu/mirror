import express from "express";
import fs from "fs";
import http from "http";
import https from "https";
import { Server } from "socket.io";
import { registerSocketEvents } from "./controllers/socket.controller";

// Load SSL/TLS certificates
const privateKey = fs.readFileSync("key.pem", "utf8");
const certificate = fs.readFileSync("cert.pem", "utf8");
const credentials = { key: privateKey, cert: certificate };

// Create an Express app
const app = express();

// Serve static files from the "public" directory
app.use(express.static("public"));

// Create an HTTP and an HTTPs server
const serverHttp = http.createServer(app);
const serverHttps = https.createServer(credentials, app);

// Attach a Socket.IO server
const ioHttp = new Server(serverHttp);
const ioHttps = new Server(serverHttps);

// Register all socket events
registerSocketEvents(ioHttp);
registerSocketEvents(ioHttps);

// Use the port 3000 by default, or the one specified in the PORT environment variable
const portHttp = process.env.HTTP_PORT ?? 3000;
const portHttps = process.env.HTTPS_PORT ?? 3443;

// Start the HTTP server
serverHttp.listen(portHttp, () => {
  console.log(`Server is running on http://localhost:${portHttp}`);
});

// Start the HTTPs server
serverHttps.listen(portHttps, () => {
  console.log(`Server is running on https://localhost:${portHttps}`);
});
