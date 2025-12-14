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
import { useYouTubeMusic, YouTubeTrack } from "@/hooks/useYouTubeMusic";
import { 
  quickPickTracks, 
  throwbackAlbums, 
  recommendedAlbums, 
  newReleases 
} from "@/data/mockData";

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
  
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // YouTube Music hook
  const {
    isSearching,
    searchResults,
    searchTracks,
    clearSearch,
    lyrics,
    isLoadingLyrics,
    fetchLyrics,
    clearLyrics,
  } = useYouTubeMusic();

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

  const handleNext = () => {
    // If we have search results and current track is from search
    if (searchResults.length > 0 && currentTrack?.videoId) {
      const currentIndex = searchResults.findIndex((t) => t.videoId === currentTrack.videoId);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % searchResults.length;
        handleYouTubeTrackClick(searchResults[nextIndex]);
        return;
      }
    }
    
    // Otherwise, use quick picks
    const currentIndex = quickPickTracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % quickPickTracks.length;
    setCurrentTrack(quickPickTracks[nextIndex]);
    setProgress(0);
    setIsLiked(false);
  };

  const handlePrevious = () => {
    // If we have search results and current track is from search
    if (searchResults.length > 0 && currentTrack?.videoId) {
      const currentIndex = searchResults.findIndex((t) => t.videoId === currentTrack.videoId);
      if (currentIndex !== -1) {
        const prevIndex = currentIndex === 0 ? searchResults.length - 1 : currentIndex - 1;
        handleYouTubeTrackClick(searchResults[prevIndex]);
        return;
      }
    }
    
    const currentIndex = quickPickTracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = currentIndex === 0 ? quickPickTracks.length - 1 : currentIndex - 1;
    setCurrentTrack(quickPickTracks[prevIndex]);
    setProgress(0);
    setIsLiked(false);
  };

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
    }
  }, []);

  // Handle track end
  const handleEnded = useCallback(() => {
    handleNext();
  }, [handleNext]);

  // Handle progress bar seek
  const handleProgressChange = useCallback((value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    
    // Seek in YouTube player
    if (currentTrack?.videoId && duration > 0) {
      const seekTime = (newProgress / 100) * duration;
      const playerElement = document.getElementById("youtube-player");
      if (playerElement && (playerElement as any).seekTo) {
        (playerElement as any).seekTo(seekTime);
      }
    }
  }, [currentTrack, duration]);

  // Toggle lyrics panel
  const handleLyricsToggle = useCallback(() => {
    if (!showLyrics && currentTrack?.videoId) {
      fetchLyrics(currentTrack.videoId);
    }
    setShowLyrics(!showLyrics);
  }, [showLyrics, currentTrack, fetchLyrics]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* YouTube Player (hidden) */}
      {currentTrack?.videoId && (
        <YouTubePlayer
          videoId={currentTrack.videoId}
          isPlaying={isPlaying}
          volume={volume}
          onProgress={handleProgress}
          onEnded={handleEnded}
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

          {/* Recommended for You */}
          {!searchQuery.trim() && (
            <div className="mb-10">
              <AlbumSection
                title="Recommended for you"
                subtitle="Based on your listening"
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
        lyrics={lyrics}
        isLoading={isLoadingLyrics}
        trackTitle={currentTrack?.title}
        trackArtist={currentTrack?.artist}
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
        isLiked={isLiked}
        onLikeToggle={() => setIsLiked(!isLiked)}
        onLyricsToggle={handleLyricsToggle}
        showLyrics={showLyrics}
      />
    </div>
  );
};

export default Index;
