import { socket, requestStatusUpdate } from './signaling.handler.js';


/*******************************************************************
 *                   WebRTC constants
 *******************************************************************/

let localPeerId = null;
const localConnection = new RTCPeerConnection();
const peerConnections = {};


/*******************************************************************
 *                   WebRTC handlers
 *******************************************************************/

/**
 * Handles the reception of an ICE candidate from the signaling server.
 * Adds the candidate to the peer connection and emits it to the signaling server.
 * @param {RTCIceCandidate} candidate - The ICE candidate received from the signaling server.
 * @param {string} otherPeerId - The ID of the other peer in the peer connection.
 */
const onIceCandidate = (event, otherPeerId) => {
    if (event.candidate) {
        socket.emit('candidate', event.candidate, otherPeerId);
    }
};

/**
 * Initializes the WebRTC peer connection and sets up event handlers for handling ICE candidates and incoming tracks.
 * The `peerConnection` object is exported for use in other parts of the application.
 */
export const handlePeerOffer = (offer, senderPeerId) => {
    console.log('Received offer from peer:', senderPeerId);
    // Create a new RTCPeerConnection object
    peerConnections[senderPeerId] = new RTCPeerConnection();

    // Set up event handlers for handling ICE candidates
    peerConnections[senderPeerId].onicecandidate = e => onIceCandidate(e, senderPeerId);

    // Set up event handler for handling incoming tracks
    peerConnections[senderPeerId].ontrack = handleBroadcastingStarted;

    // Set the remote description of the peer connection to the received offer
    peerConnections[senderPeerId].setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
            peerConnections[senderPeerId].createAnswer()
                .then(answer => {
                    peerConnections[senderPeerId].setLocalDescription(answer);
                    socket.emit('answer', answer, senderPeerId);
                });
        });
};

/**
 * Handles the receipt of an answer from the signaling server.
 * Sets the remote description of the peer connection to the received answer.
 * @param {RTCSessionDescriptionInit} answer - The answer received from the signaling server.
 * @param {string} peerId - The ID of the peer that sent the answer.
 */
export const handlePeerAnswer = (answer, peerId) => {
    console.log('Received answer from peer:', peerId);
    if (peerConnections[peerId])
    peerConnections[peerId].setRemoteDescription(new RTCSessionDescription(answer));
};

/**
 * Handles the receipt of an ICE candidate from the signaling server.
 * Adds the received ICE candidate to the peer connection.
 * @param {RTCIceCandidate} candidate - The ICE candidate received from the signaling server.
 * @param {string} peerId - The ID of the peer that sent the ICE candidate.
 */
export const handlePeerCandidate = (candidate, peerId) => {
    peerConnections[peerId].addIceCandidate(new RTCIceCandidate(candidate));
};


/*******************************************************************
 *                   Peer connection handlers
 *******************************************************************/

/**
 * Initializes the WebRTC peer connection by setting up an event handler for handling ICE candidates.
 * This function is exported for use in other parts of the application.
 */
export const handleReadySocketConnection = (newLocalPeerId) => {
    localPeerId = newLocalPeerId;
    console.log('Client peer id:', newLocalPeerId);
    localConnection.onicecandidate = (e) => onIceCandidate(e, newLocalPeerId);
};

/**
 * Handles the connection of a new peer by creating a new peer connection.
 * @param {string} peerId - The ID of the connected peer.
 */
export const handlePeerConnected = (peerId) => {
    console.log('Peer connected:', peerId);
    // Send an offer to the new peer
    localConnection.createOffer()
        .then(offer => {
            localConnection.setLocalDescription(offer);
            socket.emit('offer', offer, peerId);
        });
};

/**
 * Handles the disconnection of a peer by deleting the corresponding peer connection.
 * @param {string} peerId - The ID of the disconnected peer.
 */
export const handlePeerDisconnected = (peerId) => {
    console.log('Peer disconnected:', peerId);
    if (peerConnections[peerId]) {
        // Close the peer connection and remove it from the peerConnections object
        peerConnections[peerId].close();
        delete peerConnections[peerId];
    }
};


/*******************************************************************
 *                   Broadcasting
 *******************************************************************/

/**
 * Starts broadcasting the video stream by setting the video element's source object and updating the UI.
 * @param {Event} event - The event object containing the video stream.
 */
export const handleBroadcastingStarted = (event) => {
    if (event) {
        console.log('Broadcasting started', event);
        // Attach the stream to the video element
        const video = document.getElementById('video');
        video.srcObject = event.streams[0];
        // Update the UI
        requestStatusUpdate();
    }
};

/**
 * Stops the active video stream and broadcasting.
 */
export const handleBroadcastingStopped = () => {
    // Detach the stream from the video element
    const video = document.getElementById('video');
    video.srcObject?.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
    // Remove tracks for all peer connections
    Object.values(peerConnections).forEach(peerConnection => {
        peerConnection.getSenders().forEach(sender => sender.track.stop());
    });
    // Update the UI
    requestStatusUpdate();
};

/**
 * Handles the acceptance of a broadcast request.
 * Requests the user's display media and adds the tracks to the peer connection,
 * then updates the UI to reflect the broadcasting state.
 */
export const handleBroadcastAccepted = () => {
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      .then(stream => {
            // Add the tracks to the all peer connections
            let i = 0;
            Object.values(peerConnections).forEach(peerConnection => {
                console.log('Adding tracks to peer connection', peerConnections[i++]);
                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

                const video = document.getElementById('video');
                video.srcObject = stream;

                stream.oninactivate = () => {
                    socket.emit('stop-broadcasting');
                };
                // Update the UI
                requestStatusUpdate();
            });
        });
};

/**
 * Handles the rejection of a broadcast request.
 * Logs an error message to the console indicating that someone is already broadcasting.
 */
export const handleBroadcastRejected = () => {
    alert('Someone is already broadcasting!');
    console.error('Someone is already boradcasting!');
};


