import { useState, useEffect, useCallback, useRef } from "react";
import { X, Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Track {
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: number;
  videoId?: string;
}

interface AmbientModeProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering?: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

function getHDThumbnail(thumbnail: string, videoId?: string): string {
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return thumbnail.replace('w120-h120', 'w544-h544').replace('w60-h60', 'w544-h544');
}

export function AmbientMode({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  isBuffering,
  onPlayPause,
  onNext,
  onPrevious,
}: AmbientModeProps) {
  const [isIdle, setIsIdle] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset idle timer on mouse move
  const resetIdleTimer = useCallback(() => {
    setIsIdle(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 5000); // 5 seconds idle timeout
  }, []);

  // Request wake lock to prevent screen sleep
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.log('Wake Lock not supported or failed:', err);
    }
  }, []);

  // Release wake lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.log('Fullscreen not supported:', err);
    }
  }, []);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Setup/cleanup when ambient mode opens/closes
  useEffect(() => {
    if (isOpen) {
      requestWakeLock();
      resetIdleTimer();
      
      // Add mousemove listener
      const handleMouseMove = () => resetIdleTimer();
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchstart', handleMouseMove);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchstart', handleMouseMove);
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
      };
    } else {
      releaseWakeLock();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, [isOpen, resetIdleTimer, requestWakeLock, releaseWakeLock]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      } else if (e.key === ' ' && isOpen) {
        e.preventDefault();
        onPlayPause();
      } else if (e.key === 'ArrowRight' && isOpen) {
        onNext();
      } else if (e.key === 'ArrowLeft' && isOpen) {
        onPrevious();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPlayPause, onNext, onPrevious]);

  if (!isOpen || !currentTrack) return null;

  const hdImage = getHDThumbnail(currentTrack.image, currentTrack.videoId);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black overflow-hidden animate-ambient-fade-in"
      style={{ cursor: isIdle ? 'none' : 'default' }}
      onMouseMove={resetIdleTimer}
      onTouchStart={resetIdleTimer}
    >
      {/* Animated Blurred Background */}
      <div 
        className="absolute inset-[-50px] animate-ambient-drift will-change-transform"
        style={{
          backgroundImage: `url(${hdImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(80px) brightness(0.4) saturate(1.2)',
        }}
      />
      
      {/* Secondary animated layer for depth */}
      <div 
        className="absolute inset-[-100px] animate-ambient-drift-reverse opacity-50 will-change-transform"
        style={{
          backgroundImage: `url(${hdImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(120px) brightness(0.3)',
        }}
      />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

      {/* Main Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-12">
        {/* Album Art */}
        <div className="relative mb-12 animate-scale-in">
          <div 
            className="w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10"
            style={{
              boxShadow: '0 25px 100px -20px rgba(0, 0, 0, 0.8), 0 0 100px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <img
              src={hdImage}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = currentTrack.image;
              }}
            />
          </div>
          
          {/* Subtle glow effect behind album art */}
          <div 
            className="absolute inset-0 -z-10 blur-3xl opacity-40 scale-110"
            style={{
              backgroundImage: `url(${hdImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        {/* Track Info */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            {currentTrack.title}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-white/70">
            {currentTrack.artist}
          </p>
        </div>

        {/* Playback Controls - fade when idle */}
        <div 
          className={cn(
            "flex items-center gap-8 transition-all duration-700 ease-out",
            isIdle ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"
          )}
        >
          <button
            onClick={onPrevious}
            className="group p-4 text-white/70 hover:text-white transition-all duration-300"
            aria-label="Previous track"
          >
            <SkipBack className="w-10 h-10 fill-current group-hover:scale-110 transition-transform duration-300" />
          </button>
          
          <button
            onClick={onPlayPause}
            className="p-6 bg-white/10 backdrop-blur-lg rounded-full text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 ring-1 ring-white/20"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isBuffering ? (
              <Loader2 className="w-12 h-12 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-12 h-12 fill-current" />
            ) : (
              <Play className="w-12 h-12 fill-current ml-1" />
            )}
          </button>
          
          <button
            onClick={onNext}
            className="group p-4 text-white/70 hover:text-white transition-all duration-300"
            aria-label="Next track"
          >
            <SkipForward className="w-10 h-10 fill-current group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Top Controls - fade when idle */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 p-6 flex items-center justify-between transition-all duration-700 ease-out",
          isIdle ? "opacity-0 -translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"
        )}
      >
        <button
          onClick={onClose}
          className="p-3 bg-white/10 backdrop-blur-lg rounded-full text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 ring-1 ring-white/20"
          aria-label="Close ambient mode"
        >
          <X className="w-6 h-6" />
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-white/10 backdrop-blur-lg rounded-full text-white hover:bg-white/20 hover:scale-105 transition-all duration-300 ring-1 ring-white/20"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="w-6 h-6" />
          ) : (
            <Maximize className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Hint text when controls are visible */}
      <div 
        className={cn(
          "absolute bottom-8 left-0 right-0 text-center text-white/30 text-sm transition-all duration-700 ease-out",
          isIdle ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        Press ESC to exit • Space to play/pause • ← → to skip tracks
      </div>
    </div>
  );
}
