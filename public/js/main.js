import { setupSignalingHandlers, startStreaming, stopStreaming } from './signaling.handler.js';

// DOM Elements
const startButton = document.getElementById('start-stream');
const stopButton = document.getElementById('stop-stream');

// Assign event listeners to the buttons
startButton.addEventListener('click', startStreaming);
stopButton.addEventListener('click', stopStreaming);

// Initialize the UI and signaling handlers
window.onload = () => setupSignalingHandlers();
