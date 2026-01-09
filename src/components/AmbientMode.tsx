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
      className="fixed inset-0 z-[100] bg-background text-foreground overflow-hidden animate-ambient-fade-in"
      style={{ cursor: isIdle ? "none" : "default" }}
      onMouseMove={resetIdleTimer}
      onTouchStart={resetIdleTimer}
    >
      {/* Animated Blurred Background (smooth + vibrant) */}
      <div
        className="absolute inset-[-80px] animate-ambient-drift will-change-transform"
        style={{
          backgroundImage: `url(${hdImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(70px) brightness(0.75) saturate(1.7) contrast(1.05)",
          transition: "filter 900ms ease, opacity 900ms ease",
          animationDuration: "28s",
          animationTimingFunction: "ease-in-out",
        }}
      />

      {/* Secondary layer for depth */}
      <div
        className="absolute inset-[-120px] animate-ambient-drift-reverse opacity-70 will-change-transform"
        style={{
          backgroundImage: `url(${hdImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(120px) brightness(0.6) saturate(1.5)",
          transition: "filter 900ms ease, opacity 900ms ease",
          animationDuration: "34s",
          animationTimingFunction: "ease-in-out",
        }}
      />

      {/* Tertiary layer for pop */}
      <div
        className="absolute inset-[-40px] opacity-45 will-change-transform"
        style={{
          backgroundImage: `url(${hdImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(45px) brightness(0.85) saturate(1.85)",
          transition: "filter 900ms ease, opacity 900ms ease",
        }}
      />

      {/* Overlay for readability (less dull) */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-background/25 to-background/55" />
      {/* Main Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-12">
        {/* Album Art */}
        <div className="relative mb-10 animate-scale-in">
          <div
            className="w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-foreground/15"
            style={{
              boxShadow:
                "0 25px 100px -20px rgba(0, 0, 0, 0.8), 0 0 80px 10px hsl(var(--foreground) / 0.06)",
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
          
          {/* Glow effect behind album art */}
          <div 
            className="absolute inset-0 -z-10 blur-3xl opacity-50 scale-125"
            style={{
              backgroundImage: `url(${hdImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>

        {/* Track Info */}
        <div className="text-center mb-10 animate-fade-in max-w-4xl px-4">
          <div className="inline-block rounded-2xl bg-background/25 backdrop-blur-xl border border-foreground/10 px-8 py-6">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-3 tracking-tight break-words leading-tight"
              style={{ textShadow: "0 2px 24px hsl(var(--background) / 0.9)" }}
            >
              {currentTrack.title}
            </h1>
            <p
              className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-foreground/80 font-medium break-words"
              style={{ textShadow: "0 2px 18px hsl(var(--background) / 0.85)" }}
            >
              {currentTrack.artist}
            </p>
          </div>
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
            className="group p-4 text-foreground/70 hover:text-foreground transition-all duration-300"
            aria-label="Previous track"
          >
            <SkipBack className="w-10 h-10 fill-current group-hover:scale-110 transition-transform duration-300" />
          </button>

          <button
            onClick={onPlayPause}
            className="p-6 bg-background/25 backdrop-blur-xl rounded-full text-foreground hover:bg-background/35 hover:scale-105 transition-all duration-300 ring-1 ring-foreground/15"
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
            className="group p-4 text-foreground/70 hover:text-foreground transition-all duration-300"
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
          className="p-3 bg-background/25 backdrop-blur-xl rounded-full text-foreground hover:bg-background/35 hover:scale-105 transition-all duration-300 ring-1 ring-foreground/15"
          aria-label="Close ambient mode"
        >
          <X className="w-6 h-6" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-3 bg-background/25 backdrop-blur-xl rounded-full text-foreground hover:bg-background/35 hover:scale-105 transition-all duration-300 ring-1 ring-foreground/15"
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
          "absolute bottom-8 left-0 right-0 text-center text-foreground/40 text-sm transition-all duration-700 ease-out",
          isIdle ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}
      >
        Press ESC to exit • Space to play/pause • ← → to skip tracks
      </div>
    </div>
  );
}
