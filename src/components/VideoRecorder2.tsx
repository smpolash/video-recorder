import React, { useRef, useState } from 'react';

const VideoRecorder = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Start the webcam
  const handleStartWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  };

  // Start recording
  const handleStartRecord = () => {
    if (stream) {
      const options = { mimeType: 'video/mp4; codecs=avc1' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]); // Reset previous recordings

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.start();
    } else {
      console.log('No webcam stream available');
    }
  };

  // Stop recording and save the video
  const handleStopRecord = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'recorded-video.mp4';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
      };
    }
  };

  // Upload the video to the server
  const handleUpload = async () => {
    const blob = new Blob(recordedChunks, { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('video', blob, 'recorded-video.mp4');

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Video uploaded successfully');
      } else {
        console.error('Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay muted style={{ width: '600px', height: 'auto' }}></video>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      <div style={{ marginTop: '10px' }}>
        <button onClick={handleStartWebcam}>Start Webcam</button>
        <button onClick={handleStartRecord}>Start Record</button>
        <button onClick={handleStopRecord}>Stop Record</button>
        <button onClick={handleUpload}>Upload Video</button>
      </div>
    </div>
  );
};

export default VideoRecorder;
