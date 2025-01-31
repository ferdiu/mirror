import {
    handlePeerOffer,
    handlePeerCandidate,
    handlePeerAnswer,
    handlePeerConnected,
    handlePeerDisconnected,
    handleReadySocketConnection,
    handleBroadcastingStarted,
    handleBroadcastingStopped,
    handleBroadcastAccepted,
    handleBroadcastRejected,
    stopBroadcastingVideo } from './peer.connection.handler.js';
import { handleStatusUpdate } from './ui.update.handler.js';
import { io } from "./generated/socket.io.js";


// Initialize the socket.io client
export const socket = io();

/**
 * Sets up the event handlers for various signaling events received from the socket.io server.
 * This includes handling broadcasting signals, WebRTC signals, peer connection signals, and status updates.
 * It also sends an 'im-ready' signal to the server to indicate that the client is ready to receive events.
 */
export const setupSignalingHandlers = () => {
    // Broadcasting signals
    socket.on('broadcast-accepted', handleBroadcastAccepted);
    socket.on('broadcast-rejected', handleBroadcastRejected);
    socket.on('broadcasting-started', handleBroadcastingStarted);
    socket.on('broadcasting-stopped', handleBroadcastingStopped);
    // WebRTC signals
    socket.on('candidate', handlePeerCandidate);
    socket.on('offer', handlePeerOffer);
    socket.on('answer', handlePeerAnswer);
    // Peer signals
    socket.on('peer-connected', handlePeerConnected);
    socket.on('peer-disconnected', handlePeerDisconnected);
    // Status signals
    socket.on('status', handleStatusUpdate);
    // Send ready signal now!
    socket.on('ok-you-are-ready', handleReadySocketConnection);
    socket.emit('im-ready');
    requestStatusUpdate();
};

/**
 * Sends a broadcast request to the signaling server.
 */
export const startStreaming = () => {
    socket.emit('broadcast-request');
};

/**
 * Stops the current broadcast by sending a stop broadcast signal to the signaling server and updating the UI.
 */
export const stopStreaming = () => {
    stopBroadcastingVideo();
    socket.emit('stop-broadcast');
};

/**
 * Sends a request to the signaling server to retrieve the current status update.
 */
export const requestStatusUpdate = () => {
    socket.emit('status-request');
};