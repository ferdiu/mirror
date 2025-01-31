import { Server, Socket } from "socket.io";
import { PeerService } from "../services/peer.service";
import { v4 as uuidv4 } from "uuid";

const peerService = new PeerService();

/**
 * Registers the socket event handlers for the application.
 * This function sets up the event listeners for various socket events, such as connection, broadcasting, WebRTC, and peer events.
 * It handles the lifecycle of peer connections, broadcasting, and other real-time communication features.
 *
 * @param io - The Socket.IO server instance.
 */
export const registerSocketEvents = (io: Server) => {
  // Handle socket connections
  io.on("connection", (socket: Socket) => {
    // Init
    const peerId = uuidv4();
    peerService.addPeer(peerId, socket);

    /**
     * Broadcasting events
     */

    // Handle broadcasting request
    socket.on("broadcast", () => {
      // Only one client can broadcast at a time
      if (peerService.isSomeoneBroadcasting()) {
        // Someone is already broadcasting -> reject
        socket.emit("broadcast-rejected");
      } else {
        // Start broadcasting
        peerService.setBroadcasterId(peerId);
        // Grant client broadcasting rights
        socket.emit("broadcast-accepted");
        // Tell other clients broadcasting has started
        socket.broadcast.emit("broadcasting");
      }
    });

    // Handle broadcasting stop
    socket.on("stop-broadcast", () => {
      // Only broadcaster can stop broadcasting
      if (peerService.getBroadcasterId() === peerId) {
        // Stop broadcasting
        peerService.setBroadcasterId(null);
        // Tell other clients broadcasting has stopped
        socket.broadcast.emit("broadcasting-stopped");
      }
    });

    /**
     * WebRTC events
     */

    socket.on("offer", (data) => socket.broadcast.emit("offer", data));
    socket.on("answer", (data) => socket.broadcast.emit("answer", data));
    socket.on("candidate", (candidate) =>
      socket.broadcast.emit("candidate", candidate)
    );

    /**
     * Peer events
     */

    // Handle "I'm ready" event (borwser page loaded)
    socket.on("im-ready", () => {
      // Tell other clients a new peer has joined
      socket.broadcast.emit("peer-connected", peerId);

      // If somene is broadcasting...
      if (peerService.isSomeoneBroadcasting()) {
        // ... tell the new client that broadcasting is happening and ...
        socket.emit("broadcasting");
        // ... tell the broadcaster a new viewer has joined
        socket.broadcast.emit("new-viewer");
      }
    });

    // Handle socket disconnections
    socket.on("disconnect", () => {
      // If the disconnected client was the broadcaster...
      if (peerService.isBroadcasting(peerId)) {
        // ... stop broadcasting and tell the other clients
        peerService.setBroadcasterId(null);
        socket.broadcast.emit("broadcasting-stopped");
      }

      // Tell other clients a peer has left
      socket.broadcast.emit("peer-disconnected", peerId);
      peerService.removePeer(peerId);
    });
  });
};
