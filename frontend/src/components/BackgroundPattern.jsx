import React, { useContext, useState, useEffect, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const BackgroundPattern = ({ alwaysOn = false }) => {
  const { theme } = useContext(ThemeContext);
  const [showVideo, setShowVideo] = useState(alwaysOn);
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (alwaysOn) {
      if (videoRef.current) {
        videoRef.current.play().catch(e => console.log('Auto-play prevented'));
      }
      return;
    }

    let timeout;
    const handleTaskCompleted = () => {
      setShowVideo(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.log('Auto-play prevented'));
      }
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowVideo(false), 3500);
    };
    
    window.addEventListener('taskCompleted', handleTaskCompleted);
    return () => {
      window.removeEventListener('taskCompleted', handleTaskCompleted);
      clearTimeout(timeout);
    };
  }, [alwaysOn]);

  const handleTimeUpdate = (e) => {
    if (e.target.currentTime >= 8) {
      e.target.currentTime = 0;
    }
  };

  return (
    <div 
      className="jp-matrix-wrapper" 
      style={{ 
        opacity: showVideo ? (alwaysOn ? 0.7 : 1) : 0,
        transition: 'opacity 0.8s ease-in-out',
        pointerEvents: 'none',
        zIndex: alwaysOn ? -1 : 9999
      }}
    >
      <video 
        ref={videoRef}
        loop 
        muted 
        playsInline
        onTimeUpdate={handleTimeUpdate}
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          objectPosition: window.innerWidth < 768 ? 'right' : 'center',
          filter: 'brightness(1.2)',
          ...(alwaysOn ? {} : {
            WebkitMaskImage: window.innerWidth < 768 
              ? 'linear-gradient(to right, transparent 0%, black 100%)'
              : 'linear-gradient(to right, transparent 0%, transparent 30%, black 80%, black 100%)',
            maskImage: window.innerWidth < 768 
              ? 'linear-gradient(to right, transparent 0%, black 100%)'
              : 'linear-gradient(to right, transparent 0%, transparent 30%, black 80%, black 100%)'
          })
        }}
      >
        <source src="/video/girl-behind-curtains-3.1920x1080.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export default BackgroundPattern;
