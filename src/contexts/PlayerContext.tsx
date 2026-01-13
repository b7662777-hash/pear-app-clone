import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useDownload } from '@/hooks/useDownload';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  plays: string;
  image: string;
  duration: number;
  videoId?: string;
}

interface PlayerContextType {
  // Current track state
  currentTrack: Track | null;
  setCurrentTrack: (track: Track | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  progress: number;
  setProgress: (progress: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isBuffering: boolean;
  setIsBuffering: (buffering: boolean) => void;
  
  // Queue
  queue: Track[];
  setQueue: (queue: Track[]) => void;
  
  // Actions
  playTrack: (track: Track, queue?: Track[]) => void;
  playPause: () => void;
  next: () => void;
  previous: () => void;
  seekTo: (time: number) => void;
  
  // Like functionality
  isLiked: (videoId: string) => boolean;
  toggleLike: (track: Track) => Promise<boolean>;
  
  // Download functionality
  downloadTrack: () => void;
  isDownloading: boolean;
  downloadProgress: number;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  
  const { isLiked: checkIsLiked, toggleLike: toggleLikeSong } = usePlaylists();
  const { downloadTrack: download, isDownloading, downloadProgress } = useDownload();

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    if (currentTrack?.id === track.id && currentTrack?.videoId === track.videoId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setProgress(0);
      setCurrentTime(0);
      setIsBuffering(true);
      setIsPlaying(true);
      if (newQueue) {
        setQueue(newQueue);
      }
    }
  }, [currentTrack, isPlaying]);

  const playPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const next = useCallback(() => {
    if (queue.length === 0 || !currentTrack) return;
    
    const currentIndex = queue.findIndex(t => 
      (t.videoId && t.videoId === currentTrack.videoId) || t.id === currentTrack.id
    );
    const nextIndex = (currentIndex + 1) % queue.length;
    const nextTrack = queue[nextIndex];
    
    setCurrentTrack(nextTrack);
    setProgress(0);
    setCurrentTime(0);
    setIsBuffering(true);
    setIsPlaying(true);
  }, [currentTrack, queue]);

  const previous = useCallback(() => {
    if (queue.length === 0 || !currentTrack) return;
    
    const currentIndex = queue.findIndex(t => 
      (t.videoId && t.videoId === currentTrack.videoId) || t.id === currentTrack.id
    );
    const prevIndex = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    const prevTrack = queue[prevIndex];
    
    setCurrentTrack(prevTrack);
    setProgress(0);
    setCurrentTime(0);
    setIsBuffering(true);
    setIsPlaying(true);
  }, [currentTrack, queue]);

  const seekTo = useCallback((time: number) => {
    if (window.youtubePlayerSeekTo) {
      window.youtubePlayerSeekTo(time);
    }
    setCurrentTime(time);
    if (duration > 0) {
      setProgress((time / duration) * 100);
    }
  }, [duration]);

  const isLiked = useCallback((videoId: string) => {
    return checkIsLiked(videoId);
  }, [checkIsLiked]);

  const toggleLike = useCallback(async (track: Track) => {
    if (!track.videoId) return false;
    return await toggleLikeSong({
      videoId: track.videoId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      thumbnail: track.image,
      duration: track.duration?.toString(),
    });
  }, [toggleLikeSong]);

  const handleDownload = useCallback(() => {
    if (currentTrack?.videoId) {
      download({
        videoId: currentTrack.videoId,
        title: currentTrack.title,
        artist: currentTrack.artist,
      });
    }
  }, [currentTrack, download]);

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      setCurrentTrack,
      isPlaying,
      setIsPlaying,
      progress,
      setProgress,
      volume,
      setVolume,
      duration,
      setDuration,
      currentTime,
      setCurrentTime,
      isBuffering,
      setIsBuffering,
      queue,
      setQueue,
      playTrack,
      playPause,
      next,
      previous,
      seekTo,
      isLiked,
      toggleLike,
      downloadTrack: handleDownload,
      isDownloading,
      downloadProgress,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
