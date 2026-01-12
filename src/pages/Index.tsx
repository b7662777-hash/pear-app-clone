import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { MoodChips } from "@/components/MoodChips";
import { QuickPicks } from "@/components/QuickPicks";
import { AlbumSection } from "@/components/AlbumSection";
import { PlayerBar } from "@/components/PlayerBar";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { LyricsPanel } from "@/components/LyricsPanel";
import { SearchResults } from "@/components/SearchResults";
import { ExpandedPlayer } from "@/components/ExpandedPlayer";
import { AmbientMode } from "@/components/AmbientMode";
import { RecommendedSongs } from "@/components/RecommendedSongs";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { useYouTubeMusic, YouTubeTrack, LyricsProvider } from "@/hooks/useYouTubeMusic";
import { useDownload } from "@/hooks/useDownload";
import { usePlaylists } from "@/hooks/usePlaylists";
import { 
  quickPickTracks, 
  throwbackAlbums, 
  recommendedAlbums, 
  newReleases 
} from "@/data/mockData";

declare global {
  interface Window {
    youtubePlayerSeekTo?: (seconds: number) => void;
  }
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  plays: string;
  image: string;
  duration: number;
  videoId?: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  
  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isLiked, setIsLiked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [lyricsProvider, setLyricsProvider] = useState<LyricsProvider>("lrclib");
  const [isBuffering, setIsBuffering] = useState(false);
  const [showExpandedPlayer, setShowExpandedPlayer] = useState(false);
  const [showAmbientMode, setShowAmbientMode] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // YouTube Music hook
  const {
    isSearching,
    searchResults,
    searchTracks,
    clearSearch,
    lyricsData,
    isLoadingLyrics,
    fetchSyncedLyrics,
    clearLyrics,
    relatedTracks,
    isLoadingRelated,
    fetchRelatedTracks,
    recommendedTracks,
    isLoadingRecommended,
    fetchRecommendedTracks,
  } = useYouTubeMusic();

  // Download hook
  const { downloadTrack, isDownloading, downloadProgress } = useDownload();

  // Playlists hook
  const { isLiked: checkIsLiked, toggleLike } = usePlaylists();

  // Handle download
  const handleDownload = useCallback(() => {
    if (currentTrack?.videoId) {
      downloadTrack({
        videoId: currentTrack.videoId,
        title: currentTrack.title,
        artist: currentTrack.artist,
      });
    }
  }, [currentTrack, downloadTrack]);

  // Fetch recommended tracks on mount
  useEffect(() => {
    fetchRecommendedTracks();
  }, [fetchRecommendedTracks]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchTracks(searchQuery);
      } else {
        clearSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchTracks, clearSearch]);

  // Handle YouTube track click
  const handleYouTubeTrackClick = useCallback((track: YouTubeTrack) => {
    const newTrack: Track = {
      id: track.videoId,
      title: track.title,
      artist: track.artist,
      album: track.album,
      plays: "",
      image: track.thumbnail,
      duration: parseDuration(track.duration),
      videoId: track.videoId,
    };
    
    if (currentTrack?.videoId === track.videoId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(newTrack);
      setProgress(0);
      setCurrentTime(0);
      setIsBuffering(true);
      setIsPlaying(true);
      setIsLiked(false);
      clearLyrics();
    }
  }, [currentTrack, isPlaying, clearLyrics]);

  // Parse duration string (e.g., "3:45") to seconds
  const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Handle mock track click (for demo tracks)
  const handleTrackClick = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setProgress(0);
      setIsPlaying(true);
      setIsLiked(false);
      clearLyrics();
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = useCallback(() => {
    // If we have related tracks and current track
    if (relatedTracks.length > 0 && currentTrack?.videoId) {
      const currentIndex = relatedTracks.findIndex((t) => t.videoId === currentTrack.videoId);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % relatedTracks.length;
      const nextTrack = relatedTracks[nextIndex];
      
      setCurrentTrack({
        id: nextTrack.videoId,
        title: nextTrack.title,
        artist: nextTrack.artist,
        album: nextTrack.album,
        plays: "",
        image: nextTrack.thumbnail,
        duration: parseDuration(nextTrack.duration),
        videoId: nextTrack.videoId,
      });
      setProgress(0);
      setCurrentTime(0);
      setIsBuffering(true);
      setIsPlaying(true);
      setIsLiked(false);
      clearLyrics();
      return;
    }
    
    // If we have search results and current track is from search
    if (searchResults.length > 0 && currentTrack?.videoId) {
      const currentIndex = searchResults.findIndex((t) => t.videoId === currentTrack.videoId);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % searchResults.length;
        const nextTrack = searchResults[nextIndex];
        
        setCurrentTrack({
          id: nextTrack.videoId,
          title: nextTrack.title,
          artist: nextTrack.artist,
          album: nextTrack.album,
          plays: "",
          image: nextTrack.thumbnail,
          duration: parseDuration(nextTrack.duration),
          videoId: nextTrack.videoId,
        });
        setProgress(0);
        setCurrentTime(0);
        setIsBuffering(true);
        setIsPlaying(true);
        setIsLiked(false);
        clearLyrics();
        return;
      }
    }
    
    // Otherwise, use quick picks
    const currentIndex = quickPickTracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % quickPickTracks.length;
    setCurrentTrack(quickPickTracks[nextIndex]);
    setProgress(0);
    setIsLiked(false);
  }, [currentTrack, relatedTracks, searchResults, clearLyrics]);

  const handlePrevious = useCallback(() => {
    // If we have related tracks and current track
    if (relatedTracks.length > 0 && currentTrack?.videoId) {
      const currentIndex = relatedTracks.findIndex((t) => t.videoId === currentTrack.videoId);
      const prevIndex = currentIndex <= 0 ? relatedTracks.length - 1 : currentIndex - 1;
      const prevTrack = relatedTracks[prevIndex];
      
      setCurrentTrack({
        id: prevTrack.videoId,
        title: prevTrack.title,
        artist: prevTrack.artist,
        album: prevTrack.album,
        plays: "",
        image: prevTrack.thumbnail,
        duration: parseDuration(prevTrack.duration),
        videoId: prevTrack.videoId,
      });
      setProgress(0);
      setCurrentTime(0);
      setIsBuffering(true);
      setIsPlaying(true);
      setIsLiked(false);
      clearLyrics();
      return;
    }
    
    // If we have search results and current track is from search
    if (searchResults.length > 0 && currentTrack?.videoId) {
      const currentIndex = searchResults.findIndex((t) => t.videoId === currentTrack.videoId);
      if (currentIndex !== -1) {
        const prevIndex = currentIndex === 0 ? searchResults.length - 1 : currentIndex - 1;
        const prevTrack = searchResults[prevIndex];
        
        setCurrentTrack({
          id: prevTrack.videoId,
          title: prevTrack.title,
          artist: prevTrack.artist,
          album: prevTrack.album,
          plays: "",
          image: prevTrack.thumbnail,
          duration: parseDuration(prevTrack.duration),
          videoId: prevTrack.videoId,
        });
        setProgress(0);
        setCurrentTime(0);
        setIsBuffering(true);
        setIsPlaying(true);
        setIsLiked(false);
        clearLyrics();
        return;
      }
    }
    
    const currentIndex = quickPickTracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = currentIndex === 0 ? quickPickTracks.length - 1 : currentIndex - 1;
    setCurrentTrack(quickPickTracks[prevIndex]);
    setProgress(0);
    setIsLiked(false);
  }, [currentTrack, relatedTracks, searchResults, clearLyrics]);

  const handleAlbumClick = (album: { id: string; title: string }) => {
    // Search for the album
    searchTracks(album.title);
    setSearchQuery(album.title);
  };

  // Handle YouTube player progress
  const handleProgress = useCallback((current: number, totalDuration: number) => {
    if (totalDuration > 0) {
      setProgress((current / totalDuration) * 100);
      setDuration(totalDuration);
      setCurrentTime(current);
    }
  }, []);

  // Handle track end
  const handleEnded = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Handle buffering
  const handleBuffering = useCallback((buffering: boolean) => {
    setIsBuffering(buffering);
  }, []);

  // Handle progress bar seek
  const handleProgressChange = useCallback((value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    
    // Seek in YouTube player
    if (currentTrack?.videoId && duration > 0) {
      const seekTime = (newProgress / 100) * duration;
      if (window.youtubePlayerSeekTo) {
        window.youtubePlayerSeekTo(seekTime);
      }
    }
  }, [currentTrack, duration]);

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
    if (currentTrack?.videoId) {
      const effectiveDuration = duration > 0 ? duration : currentTrack.duration;
      if (effectiveDuration > 0) {
        const newProgress = (time / effectiveDuration) * 100;
        setProgress(newProgress);
        setCurrentTime(time);
      }
      
      // Use global seek function
      if (window.youtubePlayerSeekTo) {
        window.youtubePlayerSeekTo(time);
      }
    }
  }, [currentTrack, duration]);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Global Ambient Background - shows when a track is playing */}
      {currentTrack && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Primary glow layer */}
          <div 
            className="absolute inset-[-150px] opacity-40 blur-[100px] scale-125 animate-ambient-drift transition-all duration-1000"
            style={{
              backgroundImage: `url(${currentTrack.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Secondary glow layer */}
          <div 
            className="absolute inset-[-250px] opacity-30 blur-[140px] scale-150 animate-ambient-drift-reverse transition-all duration-1000"
            style={{
              backgroundImage: `url(${currentTrack.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Tertiary subtle layer for depth */}
          <div 
            className="absolute inset-[-100px] opacity-25 blur-[80px] scale-110 transition-all duration-1000"
            style={{
              backgroundImage: `url(${currentTrack.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          {/* Dark overlay to maintain readability */}
          <div className="absolute inset-0 bg-background/60" />
        </div>
      )}
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

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${showLyrics ? 'mr-[350px]' : ''}`}>
        {/* Search Bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-6 pb-24">
          {/* Mood Chips */}
          <div className="mb-6">
            <MoodChips selected={selectedMood} onSelect={setSelectedMood} />
          </div>

          {/* Search Results */}
          <SearchResults
            results={searchResults}
            isSearching={isSearching}
            onTrackClick={handleYouTubeTrackClick}
            currentVideoId={currentTrack?.videoId}
            isVisible={searchQuery.trim().length > 0}
          />

          {/* Quick Picks (hide when searching) */}
          {!searchQuery.trim() && (
            <div className="mb-10">
              <QuickPicks
                tracks={quickPickTracks}
                currentTrackId={currentTrack?.id || null}
                onTrackClick={handleTrackClick}
              />
            </div>
          )}

          {/* Recommended Songs from YouTube */}
          {!searchQuery.trim() && (
            <div className="mb-10">
              <RecommendedSongs
                tracks={recommendedTracks}
                isLoading={isLoadingRecommended}
                onTrackClick={handleYouTubeTrackClick}
                currentVideoId={currentTrack?.videoId}
              />
            </div>
          )}

          {/* Throwback Jams */}
          {!searchQuery.trim() && (
            <div className="mb-10">
              <AlbumSection
                title="Throwback jams"
                subtitle="Hits from every decade"
                albums={throwbackAlbums}
                onAlbumClick={handleAlbumClick}
              />
            </div>
          )}

          {/* Recommended for You (Albums) */}
          {!searchQuery.trim() && (
            <div className="mb-10">
              <AlbumSection
                title="Popular albums"
                subtitle="Top picks this week"
                albums={recommendedAlbums}
                onAlbumClick={handleAlbumClick}
              />
            </div>
          )}

          {/* New Releases */}
          {!searchQuery.trim() && (
            <div className="mb-10">
              <AlbumSection
                title="New releases"
                subtitle="Fresh music just dropped"
                albums={newReleases}
                onAlbumClick={handleAlbumClick}
              />
            </div>
          )}
        </main>
      </div>

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
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onProgressChange={handleProgressChange}
        isLiked={isLiked}
        onLikeToggle={() => setIsLiked(!isLiked)}
        isBuffering={isBuffering}
        lyricsData={lyricsData}
        currentTime={currentTime}
        onSeek={handleLyricsSeek}
        provider={lyricsProvider}
        onProviderChange={handleProviderChange}
        isLoadingLyrics={isLoadingLyrics}
        relatedTracks={relatedTracks}
        isLoadingRelated={isLoadingRelated}
        onRelatedTrackClick={handleYouTubeTrackClick}
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
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      {/* Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        volume={volume}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onProgressChange={handleProgressChange}
        onVolumeChange={(value) => setVolume(value[0])}
        isLiked={currentTrack?.videoId ? checkIsLiked(currentTrack.videoId) : isLiked}
        onLikeToggle={() => {
          if (currentTrack?.videoId) {
            toggleLike({
              videoId: currentTrack.videoId,
              title: currentTrack.title,
              artist: currentTrack.artist,
              album: currentTrack.album,
              thumbnail: currentTrack.image,
              duration: currentTrack.duration?.toString(),
            });
          } else {
            setIsLiked(!isLiked);
          }
        }}
        onLyricsToggle={handleLyricsToggle}
        showLyrics={showLyrics}
        isBuffering={isBuffering}
        onExpandClick={handleExpandPlayer}
        onAmbientModeClick={() => setShowAmbientMode(true)}
        onDownloadClick={handleDownload}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        onAddToPlaylist={() => setShowAddToPlaylist(true)}
      />

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
    </div>
  );
};

export default Index;
