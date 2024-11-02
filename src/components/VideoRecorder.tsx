// src/components/VideoRecorder.tsx
import React, { useRef, useState } from 'react';

const VideoRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  };

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) setRecordedChunks((prev) => [...prev, event.data]);
      };
      recorder.onstop = saveRecording;
      recorder.start();
      setMediaRecorder(recorder);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  };

  const saveRecording = () => {
    const blob = new Blob(recordedChunks, { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'recording.mp4';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    setRecordedChunks([]); // Clear recorded chunks after saving
  };

  const uploadRecording = async () => {
    const blob = new Blob(recordedChunks, { type: 'video/mp4' });
    const formData = new FormData();
    formData.append('video', blob, 'recording.mp4');

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to upload video');
      alert('Video uploaded successfully');
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  return (
    <div>
      <video ref={videoRef} width="640" height="480" autoPlay muted></video>
      <div>
        <button onClick={startWebcam}>Start Webcam</button>
        <button onClick={startRecording} disabled={!videoRef.current?.srcObject}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!mediaRecorder}>
          Stop Recording
        </button>
        <button onClick={uploadRecording} disabled={recordedChunks.length === 0}>
          Upload Video
        </button>
      </div>
    </div>
  );
};

export default VideoRecorder;
