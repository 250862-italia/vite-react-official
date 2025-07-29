import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const VideoPlayer = ({ task, onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  // Carica i dati video dal backend
  useEffect(() => {
    const loadVideoData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:3000/api/tasks/${task.id}/video`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          setVideoData(response.data.data);
        } else {
          setError('Errore nel caricamento del video');
        }
      } catch (err) {
        console.error('Errore caricamento video:', err);
        setError('Errore nel caricamento del video');
      } finally {
        setLoading(false);
      }
    };

    if (task && task.id) {
      loadVideoData();
    }
  }, [task]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnd = async () => {
    setIsPlaying(false);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:3000/api/tasks/${task.id}/video/complete`, {
        watchedDuration: currentTime,
        totalDuration: duration
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const { completed, rewards } = response.data.data;
        
        if (completed) {
          setIsCompleted(true);
          onComplete({
            ...task,
            rewards
          });
        }
      }
    } catch (err) {
      console.error('Errore completamento video:', err);
      setError('Errore durante il completamento del video');
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (loading) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Caricamento video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Errore
          </h2>
          <p className="text-neutral-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">
            Video non disponibile
          </h2>
          <p className="text-neutral-600">
            Questo task non contiene un video. Contatta l'amministratore per assistenza.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">
          {videoData.title}
        </h2>
        <p className="text-neutral-600">
          {videoData.description}
        </p>
      </div>

      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {videoData.videoUrl ? (
          <video
            ref={videoRef}
            className="w-full h-auto"
            controls
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
              }
            }}
          >
            <source src={videoData.videoUrl} type="video/mp4" />
            Il tuo browser non supporta il tag video.
          </video>
        ) : (
          <div className="aspect-video bg-neutral-100 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎥</div>
              <p className="text-neutral-600">Video non disponibile</p>
              <p className="text-sm text-neutral-500 mt-2">
                Questo task non contiene un video. Contatta l'amministratore per assistenza.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-neutral-600 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Completion Status */}
      {isCompleted && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-600 text-xl mr-2">✅</span>
            <span className="text-green-800 font-medium">
              Video completato! Puoi procedere al prossimo task.
            </span>
          </div>
        </div>
      )}

      {/* Fallback per video non disponibile */}
      {!videoData.videoUrl && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            💡 <strong>Nota:</strong> Questo task non contiene un video. 
            In produzione, qui verrebbe caricato il video reale per il task "{videoData.title}".
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 