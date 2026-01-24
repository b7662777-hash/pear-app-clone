import { useEffect, useCallback } from 'react';
import { Track } from '@/contexts/PlayerContext';

interface UseMediaSessionOptions {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
}

export function useMediaSession({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek,
}: UseMediaSessionOptions) {
  // Update media session metadata when track changes
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    // Get high-quality artwork URL
    const artworkUrl = currentTrack.image?.replace('w120-h120', 'w512-h512') || currentTrack.image;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album || 'Unknown Album',
      artwork: artworkUrl ? [
        { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '384x384', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
      ] : [],
    });
  }, [currentTrack]);

  // Update playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Update position state for seek bar in system UI
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack || !duration) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      });
    } catch (e) {
      // Position state may not be supported in all browsers
      console.debug('MediaSession position state not supported');
    }
  }, [currentTime, duration, currentTrack]);

  // Register action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => onPlay()],
      ['pause', () => onPause()],
      ['nexttrack', () => onNext()],
      ['previoustrack', () => onPrevious()],
      ['seekto', (details) => {
        if (details.seekTime !== undefined) {
          onSeek(details.seekTime);
        }
      }],
      ['seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        onSeek(Math.max(0, currentTime - skipTime));
      }],
      ['seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        onSeek(Math.min(duration, currentTime + skipTime));
      }],
    ];

    // Register all handlers
    handlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {
        console.debug(`MediaSession action '${action}' not supported`);
      }
    });

    // Cleanup: remove handlers on unmount
    return () => {
      handlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    };
  }, [onPlay, onPause, onNext, onPrevious, onSeek, currentTime, duration]);
}
