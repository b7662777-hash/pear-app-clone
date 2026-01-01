import { useEffect, useRef, useState, useCallback } from "react";

// Video ID validation regex (YouTube IDs are 11 characters: a-z, A-Z, 0-9, -, _)
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function isValidVideoId(videoId: string | null): boolean {
  return typeof videoId === 'string' && VIDEO_ID_REGEX.test(videoId);
}

interface YouTubePlayerProps {
  videoId: string | null;
  isPlaying: boolean;
  volume: number;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onProgress?: (current: number, duration: number) => void;
  onEnded?: () => void;
  onBuffering?: (isBuffering: boolean) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function YouTubePlayer({
  videoId,
  isPlaying,
  volume,
  onReady,
  onStateChange,
  onProgress,
  onEnded,
  onBuffering,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API ready");
      setIsAPIReady(true);
    };

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isAPIReady || !containerRef.current || playerRef.current) return;

    console.log("Initializing YouTube player");
    
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "0",
      width: "0",
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          console.log("Player ready");
          playerRef.current.setVolume(volume);
          onReady?.();
        },
        onStateChange: (event: any) => {
          console.log("Player state:", event.data);
          onStateChange?.(event.data);
          
          // -1 = unstarted, 0 = ended, 1 = playing, 2 = paused, 3 = buffering
          if (event.data === 0) {
            onEnded?.();
          }
          
          // Handle buffering state
          onBuffering?.(event.data === 3 || event.data === -1);
          
          // Start/stop progress tracking
          if (event.data === 1 || event.data === 3) {
            startProgressTracking();
          } else if (event.data === 0 || event.data === 2) {
            stopProgressTracking();
          }
        },
        onError: (event: any) => {
          console.error("YouTube player error:", event.data);
        },
      },
    });
  }, [isAPIReady, onReady, onStateChange, onEnded, volume]);

  // Handle video changes
  useEffect(() => {
    if (!playerRef.current || !videoId) return;
    
    // Validate video ID before loading
    if (!isValidVideoId(videoId)) {
      console.error("Invalid video ID format:", videoId);
      return;
    }

    // Always load new video when videoId changes
    if (videoId !== currentVideoId) {
      console.log("Loading video:", videoId);
      setCurrentVideoId(videoId);
      
      try {
        playerRef.current.loadVideoById(videoId);
      } catch (error) {
        console.error("Error loading video:", error);
      }
    }
  }, [videoId]);

  // Handle play/pause
  useEffect(() => {
    if (!playerRef.current || !currentVideoId) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (error) {
      console.error("Error controlling playback:", error);
    }
  }, [isPlaying, currentVideoId]);

  // Handle volume changes
  useEffect(() => {
    if (!playerRef.current) return;

    try {
      playerRef.current.setVolume(volume);
    } catch (error) {
      console.error("Error setting volume:", error);
    }
  }, [volume]);

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        try {
          const current = playerRef.current.getCurrentTime() || 0;
          const duration = playerRef.current.getDuration() || 0;
          onProgress?.(current, duration);
        } catch (error) {
          // Player might not be ready
        }
      }
    }, 250);
  }, [onProgress]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Expose seek function via ref
  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(seconds, true);
      } catch (error) {
        console.error("Error seeking:", error);
      }
    }
  }, []);

  // Store seekTo on the container element for parent access
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).seekTo = seekTo;
    }
  }, [seekTo]);

  return (
    <div
      ref={containerRef}
      id="youtube-player"
      style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
    />
  );
}
