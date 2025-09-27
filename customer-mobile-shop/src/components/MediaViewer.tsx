'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, VolumeX, Volume2 } from 'lucide-react';

interface MediaViewerProps {
  src?: string;
  alt?: string;
  className?: string;
  isHomepage?: boolean;
  onClick?: () => void;
  fallbackSrc?: string;
}

export function MediaViewer({ 
  src, 
  alt = '', 
  className = '', 
  isHomepage = false,
  onClick,
  fallbackSrc 
}: MediaViewerProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(!isHomepage); // Muted by default outside homepage
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect if the source is a video based on file extension
  const isVideo = src && /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(src);

  useEffect(() => {
    if (videoRef.current && isVideo) {
      const video = videoRef.current;
      
      // Set initial state
      video.muted = isMuted;
      
      if (isPlaying) {
        video.play().catch(console.error);
      }
    }
  }, [src, isVideo, isPlaying, isMuted]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleMediaClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleVideoError = () => {
    console.error('Video failed to load:', src);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (fallbackSrc) {
      e.currentTarget.src = fallbackSrc;
    }
  };

  if (!src) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        onClick={handleMediaClick}
      >
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📷</div>
          <div className="text-sm">No media</div>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div 
        className={`relative overflow-hidden ${className}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={handleMediaClick}
      >
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover"
          autoPlay
          loop
          playsInline
          muted={isMuted}
          onError={handleVideoError}
          onLoadedData={() => {
            if (videoRef.current && isPlaying) {
              videoRef.current.play().catch(console.error);
            }
          }}
        />
        
        {/* Video Controls Overlay */}
        {showControls && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
            <div className="flex gap-2">
              <button
                onClick={togglePlay}
                className="bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all duration-200"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-gray-700" />
                ) : (
                  <Play className="w-4 h-4 text-gray-700" />
                )}
              </button>
              
              <button
                onClick={toggleMute}
                className="bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all duration-200"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-gray-700" />
                ) : (
                  <Volume2 className="w-4 h-4 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Video Indicator */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          🎬
        </div>
      </div>
    );
  }

  // Regular image
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={handleMediaClick}
      onError={handleImageError}
    />
  );
}