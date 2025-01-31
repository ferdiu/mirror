
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
    const video = document.getElementById('video');


    startButton.style.display = status === 'idle' ? 'block' : 'none';
    stopButton.style.display = status === 'broadcasting' ? 'block' : 'none';
    video.style.display = status === 'idle' ? 'none' : 'block';
};
