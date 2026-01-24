import { useCallback, useState, useEffect } from 'react';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { PlayerBar } from '@/components/PlayerBar';
import { LyricsPanel } from '@/components/LyricsPanel';
import { ExpandedPlayer } from '@/components/ExpandedPlayer';
import { AmbientMode } from '@/components/AmbientMode';
import { AddToPlaylistDialog } from '@/components/AddToPlaylistDialog';
import { MiniPlayer } from '@/components/MiniPlayer';
import { usePlayer } from '@/contexts/PlayerContext';
import { useYouTubeMusic, LyricsProvider } from '@/hooks/useYouTubeMusic';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useLastFmScrobble } from '@/hooks/useLastFmScrobble';
import { useDiscordPresence } from '@/hooks/useDiscordPresence';

declare global {
  interface Window {
    youtubePlayerSeekTo?: (seconds: number) => void;
  }
}

export function GlobalPlayer() {
  const {
    currentTrack,
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
    playPause,
    next,
    previous,
    seekTo,
    isLiked,
    toggleLike,
    downloadTrack,
    isDownloading,
    downloadProgress,
  } = usePlayer();

  const [showLyrics, setShowLyrics] = useState(false);
  const [showExpandedPlayer, setShowExpandedPlayer] = useState(false);
  const [showAmbientMode, setShowAmbientMode] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [lyricsProvider, setLyricsProvider] = useState<LyricsProvider>("lrclib");

  const {
    lyricsData,
    isLoadingLyrics,
    fetchSyncedLyrics,
    clearLyrics,
    relatedTracks,
    isLoadingRelated,
    fetchRelatedTracks,
  } = useYouTubeMusic();

  // Media Session API for global media keys
  const mediaSessionEnabled = localStorage.getItem('media_session_enabled') !== 'false';
  useMediaSession({
    currentTrack: mediaSessionEnabled ? currentTrack : null,
    isPlaying,
    currentTime,
    duration,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onNext: next,
    onPrevious: previous,
    onSeek: seekTo,
  });

  // Last.fm scrobbling integration
  useLastFmScrobble({
    currentTrack,
    isPlaying,
    currentTime,
    duration,
  });

  // Discord presence integration
  useDiscordPresence({
    currentTrack,
    isPlaying,
    currentTime,
    duration,
  });

  // Handle YouTube player progress
  const handleProgress = useCallback((current: number, totalDuration: number) => {
    if (totalDuration > 0) {
      setProgress((current / totalDuration) * 100);
      setDuration(totalDuration);
      setCurrentTime(current);
    }
  }, [setProgress, setDuration, setCurrentTime]);

  // Handle track end
  const handleEnded = useCallback(() => {
    next();
  }, [next]);

  // Handle buffering
  const handleBuffering = useCallback((buffering: boolean) => {
    setIsBuffering(buffering);
  }, [setIsBuffering]);

  // Handle progress bar seek
  const handleProgressChange = useCallback((value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    
    if (currentTrack?.videoId && duration > 0) {
      const seekTime = (newProgress / 100) * duration;
      seekTo(seekTime);
    }
  }, [currentTrack, duration, setProgress, seekTo]);

  // Toggle lyrics panel
  const handleLyricsToggle = useCallback(() => {
    if (!showLyrics && currentTrack) {
      fetchSyncedLyrics(currentTrack.title, currentTrack.artist, lyricsProvider, currentTrack.videoId);
    }
    setShowLyrics(!showLyrics);
  }, [showLyrics, currentTrack, fetchSyncedLyrics, lyricsProvider]);

  // Handle expanded player toggle
  const handleExpandPlayer = useCallback(() => {
    if (currentTrack) {
      fetchSyncedLyrics(currentTrack.title, currentTrack.artist, lyricsProvider, currentTrack.videoId);
      fetchRelatedTracks(currentTrack.title, currentTrack.artist);
    }
    setShowExpandedPlayer(true);
  }, [currentTrack, fetchSyncedLyrics, fetchRelatedTracks, lyricsProvider]);

  // Handle provider change
  const handleProviderChange = useCallback((provider: LyricsProvider) => {
    setLyricsProvider(provider);
    if (currentTrack) {
      fetchSyncedLyrics(currentTrack.title, currentTrack.artist, provider, currentTrack.videoId);
    }
  }, [currentTrack, fetchSyncedLyrics]);

  // Handle lyrics seek
  const handleLyricsSeek = useCallback((time: number) => {
    seekTo(time);
  }, [seekTo]);

  // Clear lyrics when track changes
  useEffect(() => {
    clearLyrics();
  }, [currentTrack?.videoId, clearLyrics]);

  const handleRelatedTrackClick = useCallback((track: any) => {
    // This will be handled by the parent component
  }, []);

  if (!currentTrack) return null;

  return (
    <>
      {/* YouTube Player (hidden) */}
      {currentTrack?.videoId && (
        <YouTubePlayer
          videoId={currentTrack.videoId}
          isPlaying={isPlaying}
          volume={volume}
          onProgress={handleProgress}
          onEnded={handleEnded}
          onBuffering={handleBuffering}
        />
      )}

      {/* Lyrics Panel */}
      <LyricsPanel
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        lyricsData={lyricsData}
        isLoading={isLoadingLyrics}
        trackTitle={currentTrack?.title}
        trackArtist={currentTrack?.artist}
        currentTime={currentTime}
        onSeek={handleLyricsSeek}
        provider={lyricsProvider}
        onProviderChange={handleProviderChange}
      />

      {/* Expanded Player */}
      <ExpandedPlayer
        isOpen={showExpandedPlayer}
        onClose={() => setShowExpandedPlayer(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        volume={volume}
        onPlayPause={playPause}
        onNext={next}
        onPrevious={previous}
        onProgressChange={handleProgressChange}
        isLiked={currentTrack?.videoId ? isLiked(currentTrack.videoId) : false}
        onLikeToggle={() => currentTrack && toggleLike(currentTrack)}
        isBuffering={isBuffering}
        lyricsData={lyricsData}
        currentTime={currentTime}
        onSeek={handleLyricsSeek}
        provider={lyricsProvider}
        onProviderChange={handleProviderChange}
        isLoadingLyrics={isLoadingLyrics}
        relatedTracks={relatedTracks}
        isLoadingRelated={isLoadingRelated}
        onRelatedTrackClick={handleRelatedTrackClick}
        onAmbientModeClick={() => {
          setShowExpandedPlayer(false);
          setShowAmbientMode(true);
        }}
      />

      {/* Ambient Mode */}
      <AmbientMode
        isOpen={showAmbientMode}
        onClose={() => setShowAmbientMode(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        onPlayPause={playPause}
        onNext={next}
        onPrevious={previous}
      />

      {/* Mini Player */}
      {showMiniPlayer && (
        <MiniPlayer
          onClose={() => setShowMiniPlayer(false)}
          onExpand={() => {
            setShowMiniPlayer(false);
            setShowExpandedPlayer(true);
          }}
        />
      )}

      {/* Player Bar - hidden when mini player is active */}
      {!showMiniPlayer && (
        <PlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          volume={volume}
          onPlayPause={playPause}
          onNext={next}
          onPrevious={previous}
          onProgressChange={handleProgressChange}
          onVolumeChange={(value) => setVolume(value[0])}
          isLiked={currentTrack?.videoId ? isLiked(currentTrack.videoId) : false}
          onLikeToggle={() => currentTrack && toggleLike(currentTrack)}
          onLyricsToggle={handleLyricsToggle}
          showLyrics={showLyrics}
          isBuffering={isBuffering}
          onExpandClick={handleExpandPlayer}
          onAmbientModeClick={() => setShowAmbientMode(true)}
          onDownloadClick={downloadTrack}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          onAddToPlaylist={() => setShowAddToPlaylist(true)}
          onMiniPlayerClick={() => setShowMiniPlayer(true)}
        />
      )}

      {/* Add to Playlist Dialog */}
      <AddToPlaylistDialog
        isOpen={showAddToPlaylist}
        onClose={() => setShowAddToPlaylist(false)}
        song={currentTrack?.videoId ? {
          videoId: currentTrack.videoId,
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album,
          thumbnail: currentTrack.image,
          duration: currentTrack.duration?.toString(),
        } : null}
      />
    </>
  );
}
