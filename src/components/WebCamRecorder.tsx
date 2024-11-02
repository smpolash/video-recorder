import React, { useState, useRef, useEffect } from 'react';

const WebCamRecorder = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: false,
        video: {
          width: { min: 720, ideal: 1280, max: 1920 }, // Width 1280 for 16:9 aspect ratio
          height: { min: 480, ideal: 720, max: 1080 },  // Height 720 for 16:9 aspect ratio
          aspectRatio: 16 / 9,
          facingMode: {
            ideal: 'user'
          },
          frameRate: {
            ideal: 50,
            min: 30,
          },
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // log device capabilities;
        stream.getTracks().forEach(function(track) {
          console.log(track.getSettings());
        });
      }
      setStream(stream);
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  const startRecording = () => {
    const chunks: BlobPart[] = [];

    if (stream) {
      const options = { 
        mimeType: 'video/mp4; codecs=avc1', 
        // mimeType: 'video/webm;codecs=vp9', 
        videoBitsPerSecond: 2000000 
      };      
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });

        // Download the recorded video
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recorded_video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Upload the video to the server
        const formData = new FormData();
        formData.append('video', blob);
        fetch('/upload', {
          method: 'POST',
          body: formData,
        })
        .then(response => {
          console.log('Video uploaded successfully:', response);
        })
        .catch(error => {
          console.error('Error uploading video:', error);
        });
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className='d-flex flex-column gap-4 col-12 col-md-4 mx-auto'>
      <video className='ratio ratio-16x9 bg-light rounded shadow border-1 border-dark' width="720" height="auto" ref={videoRef} autoPlay muted />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className='d-flex flex-row gap-2 justify-content-center'>
        <button className='btn btn-sm btn-primary' onClick={startCamera}>Start Webcam</button>
        <button className={`btn btn-sm ${isRecording ? 'btn-info':'btn-danger'}`} onClick={isRecording ? stopRecording : startRecording}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
    </div>
  );
};

export default WebCamRecorder;