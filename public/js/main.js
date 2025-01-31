import { setupSignalingHandlers, startStreaming, stopStreaming } from './signaling.handler.js';

// Initialize the UI and signaling handlers
window.onload = () => {
    setupSignalingHandlers();

    // DOM Elements
    const startButton = document.getElementById('start-stream');
    const stopButton = document.getElementById('stop-stream');

    // Assign event listeners to the buttons
    startButton.addEventListener('click', startStreaming);
    stopButton.addEventListener('click', (_) => window.location.reload());

    document.addEventListener("keydown", (e) => {
        console.log(e.key);
        if (e.key === "f") {
            if (!document.fullscreenElement) {
                // If someone is broadcasting, enter fullscreen
                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo.srcObject) {
                    remoteVideo.requestFullscreen();
                }
            } else if (document.exitFullscreen) {
                // If the video is already in fullscreen, exit fullscreen
                document.exitFullscreen();
            }
        }
    });
};
