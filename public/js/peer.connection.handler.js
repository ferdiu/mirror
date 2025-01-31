import { socket, requestStatusUpdate } from './signaling.handler.js';


/*******************************************************************
 *                   WebRTC constants
 *******************************************************************/

let localPeerId = null;
const peerConnections = {};


/*******************************************************************
 *                   WebRTC handlers
 *******************************************************************/

/**
 * Initializes the WebRTC peer connection and sets up event handlers for handling ICE candidates and incoming tracks.
 * The `peerConnection` object is exported for use in other parts of the application.
 */
export const handlePeerOffer = (offer, senderPeerId) => {
    console.log('Received offer from peer:', senderPeerId);

    // Create a new RTCPeerConnection object
    peerConnections[senderPeerId] = new RTCPeerConnection();

    // Set the remote description of the peer connection to the received offer
    peerConnections[senderPeerId].setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => {
            peerConnections[senderPeerId].createAnswer()
                .then(answer => {
                    console.log('Answer created for peer:', senderPeerId);
                    peerConnections[senderPeerId].setLocalDescription(answer);
                    socket.emit('answer', answer, senderPeerId);
                });
        });

    // Setup connection
    _setupConnection(senderPeerId);
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
 * @param {string} senderPeerId - The ID of the peer that sent the ICE candidate.
 */
export const handlePeerCandidate = (candidate, senderPeerId) => {
    console.log('ICE candidate received from:', senderPeerId);
    peerConnections[senderPeerId].addIceCandidate(new RTCIceCandidate(candidate));
};


/*******************************************************************
 *                   Peer connection handlers
 *******************************************************************/

/**
 * Log the peer Id assigned to this client.
 */
export const handleReadySocketConnection = (newLocalPeerId) => {
    // Set the local peer ID
    localPeerId = newLocalPeerId;
    console.log('Client peer id:', newLocalPeerId);
};

/**
 * Handles the connection of a new peer by creating a new peer connection.
 * @param {string} peerId - The ID of the connected peer.
 */
export const handlePeerConnected = (peerId, broadcasterId) => {
    console.log('Peer connected:', peerId);
    // Create a new RTCPeerConnection object
    peerConnections[peerId] = new RTCPeerConnection();

    // Send an offer to the new peer
    _createOffer(peerId);

    // Setup connection
    _setupConnection(peerId);

    // If this is the broadcaster, start broadcasting
    if (broadcasterId === localPeerId) {
        _startBroadcasting();
    }
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
        const video = document.getElementById('remoteVideo');
        video.srcObject = event.streams[0];
        // Update the UI
        requestStatusUpdate();
    }
};

/**
 * Stops the active video stream and broadcasting.
 */
export const handleBroadcastingStopped = () => {
    // Viewer stop watching
    console.log('Viewer: broadcasting stopped');
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo.srcObject) {
        // Detach the stream from the video element
        remoteVideo.exitFullscreen();
        remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
        remoteVideo.srcObject = null;
        // Update the UI
        requestStatusUpdate();
    }
};

/**
 * Handles the acceptance of a broadcast request.
 * Requests the user's display media and adds the tracks to the peer connection,
 * then updates the UI to reflect the broadcasting state.
 */
export const handleBroadcastAccepted = () => {
    // If this is the broadcaster, start broadcasting to the new peer
    _startBroadcasting();
};

/**
 * Stops the active video broadcast by removing the tracks from the peer connection,
 * detaching the stream from the local video element, and emitting a 'stop-broadcasting'
 * message to the server. This function also updates the UI to reflect the broadcasting state.
 */
export const stopBroadcastingVideo = () => {
    console.log('Stop broadcasting video');

    // Remove tracks from all the peer connections
    Object.entries(peerConnections).forEach(([peerId, peerConnection]) => {
        peerConnection.getSenders().forEach(sender => {
            sender.track.stop();
            peerConnection.removeTrack(sender);
        });
    });

    // Detach the stream from the video element
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject?.getTracks().forEach((track) => track.stop());
    localVideo.srcObject = null;
    // Stop broadcasting message
    socket.emit('stop-broadcasting');
    // Update the UI
    requestStatusUpdate();
};

/**
 * Handles the rejection of a broadcast request.
 * Logs an error message to the console indicating that someone is already broadcasting.
 */
export const handleBroadcastRejected = () => {
    alert('Someone is already broadcasting!');
    console.error('Someone is already boradcasting!');
};


/*******************************************************************
 *                   Helper functions
 *******************************************************************/

const _createOffer = (peerId) => {
    // Create an offer for the peer connection
    peerConnections[peerId].createOffer()
        .then(offer => {
            console.log('Offer created for peer:', peerId);
            peerConnections[peerId].setLocalDescription(offer);
            socket.emit('offer', offer, peerId);
        });
};

const _setupConnection = (peerId) => {
    // Set up event handlers for handling ICE candidates
    peerConnections[peerId].onicecandidate = event => {
        console.log('Received ICE candidate from :', peerId);
        if (event.candidate) {
            socket.emit('candidate', event.candidate, peerId);
        }
    };

    // Log ICE connection state changes
    peerConnections[peerId].oniceconnectionstatechange = () => {
        console.log('ICE Connection State Change:', peerConnections[peerId].iceConnectionState);
        if (peerConnections[peerId].iceConnectionState === 'failed') {
            console.error('ICE Connection Failed:', peerId);
            peerConnections[peerId].restartIce();
        } else if (peerConnections[peerId].iceConnectionState === 'disconnected') {
            console.error('ICE Connection Disconnected:', peerId);
            peerConnections[peerId].restartIce();
        }
    };

    // Log signaling state changes
    peerConnections[peerId].onsignalingstatechange = () => {
        console.log('Signaling State Change:', peerConnections[peerId].signalingState);
    };

    // Log connection state changes
    peerConnections[peerId].onconnectionstatechange = () => {
        console.log('Connection State Change:', peerConnections[peerId].connectionState);
    };

    // Set up event handler for handling incoming tracks
    peerConnections[peerId].ontrack = handleBroadcastingStarted;

    // Set up event handler for handling negotiation needed
    peerConnections[peerId].onnegotiationneeded = () => _createOffer(peerId);
};

const _startBroadcasting = async () => {
    // If a stream is already being broadcasted use it
    const localVideo = document.getElementById('localVideo');
    // TODO: change this to screen share
    const stream = localVideo.srcObject ?? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });

    stream.getTracks().forEach(track => {
        // If the track ended, stop broadcasting
        track.onended = () => stopBroadcastingVideo();

        // Remove and re-add all tracks to all peer connections
        Object.entries(peerConnections).forEach(([peerId, peerConnection]) => {
            console.log('Adding tracks to peer connection', peerId);
            peerConnection.addTrack(track, stream);
        });
    });

    // Set the stream to the local video element
    if (!document.getElementById('localVideo').srcObject) {
        document.getElementById('localVideo').srcObject = stream;
    }

    // Update the UI
    requestStatusUpdate();
};
