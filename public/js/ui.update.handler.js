
/**
 * Handles the status update received from the signaling server.
 * Logs the updated status and updates the UI accordingly.
 *
 * @param {Object} status - The updated status object.
 */
export const handleStatusUpdate = (status) => {
    console.log('Status updated:', status);

    const startButton = document.getElementById('start-stream');
    const stopButton = document.getElementById('stop-stream');
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');

    startButton.style.display = status === 'idle' ? 'block' : 'none';
    stopButton.style.display = status === 'broadcasting' ? 'block' : 'none';
    localVideo.style.display = status === 'broadcasting' ? 'block' : 'none';
    remoteVideo.style.display = status === 'viewing' ? 'block' : 'none';
};
