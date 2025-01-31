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
    socket.on("broadcast-request", () => {
      // Only one peer can broadcast at a time
      if (peerService.isSomeoneBroadcasting()) {
        // Someone is already broadcasting -> reject
        socket.emit("broadcast-rejected");
      } else {
        // Start broadcasting
        peerService.setBroadcasterId(peerId);
        // Grant peer broadcasting rights
        socket.emit("broadcast-accepted");
        socket.emit("status", "broadcasting");
        // Tell other peers broadcasting has started
        socket.broadcast.emit("broadcasting-started");
        socket.broadcast.emit("status", "viewing");
      }
    });

    // Handle broadcasting stop
    socket.on("stop-broadcast", () => {
      // Only broadcaster can stop broadcasting
      if (peerService.getBroadcasterId() === peerId) {
        // Stop broadcasting
        peerService.setBroadcasterId(null);
        // Tell other peers broadcasting has stopped
        socket.broadcast.emit("broadcasting-stopped");
        socket.broadcast.emit("status", "idle");
        socket.emit("status", "idle");
      }
    });

    /**
     * WebRTC events
     */

    socket.on("offer", (offer, receiverId) =>
      peerService.getPeerSocket(receiverId).emit("offer", offer, peerId)
    );
    socket.on("answer", (answer, senderId) =>
      peerService.getPeerSocket(senderId).emit("answer", answer, peerId)
    );
    socket.on("candidate", (candidate, otherPeerId) =>
      peerService
        .getPeerSocket(otherPeerId)
        .emit("candidate", candidate, peerId)
    );

    /**
     * Peer events
     */

    // Handle "I'm ready" event (borwser page loaded)
    socket.on("im-ready", () => {
      // Tell other peers a new peer has joined
      socket.broadcast.emit(
        "peer-connected",
        peerId,
        peerService.getBroadcasterId()
      );
      socket.emit("ok-you-are-ready", peerId);

      // If somene is broadcasting...
      if (peerService.isSomeoneBroadcasting()) {
        // ... tell the new peer that broadcasting is happening
        socket.emit("broadcasting-started");
      }
      socket.emit("status-changed");
    });

    // Handle status requests
    socket.on("status-request", () => {
      if (!peerService.isSomeoneBroadcasting()) {
        // If no one is broadcasting...
        socket.emit("status", "idle");
      } else if (peerService.isBroadcasting(peerId)) {
        // If the peer is the broadcaster...
        socket.emit("status", "broadcasting");
      } else {
        // If broadcasting is on but is not the peer...
        socket.emit("status", "viewing");
      }
    });

    // Handle socket disconnections
    socket.on("disconnect", () => {
      // If the disconnected peer was the broadcaster...
      if (peerService.isBroadcasting(peerId)) {
        // ... stop broadcasting and tell the other peers
        peerService.setBroadcasterId(null);
        socket.broadcast.emit("broadcasting-stopped");
        socket.broadcast.emit("status", "idle");
      }

      // Tell other peers a peer has left
      socket.broadcast.emit("peer-disconnected", peerId);
      peerService.removePeer(peerId);
    });
  });
};
