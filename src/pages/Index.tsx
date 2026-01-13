import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { MoodChips } from "@/components/MoodChips";
import { QuickPicks } from "@/components/QuickPicks";
import { AlbumSection } from "@/components/AlbumSection";
import { SearchResults } from "@/components/SearchResults";
import { RecommendedSongs } from "@/components/RecommendedSongs";
import { useYouTubeMusic, YouTubeTrack } from "@/hooks/useYouTubeMusic";
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { useNavigate } from "react-router-dom";
import { 
  quickPickTracks, 
  throwbackAlbums, 
  recommendedAlbums, 
  newReleases 
} from "@/data/mockData";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { playTrack, currentTrack, setQueue } = usePlayer();

  const {
    isSearching,
    searchResults,
    searchTracks,
    clearSearch,
    recommendedTracks,
    isLoadingRecommended,
    fetchRecommendedTracks,
  } = useYouTubeMusic();

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

  // Parse duration string to seconds
  const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

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
    
    // Set queue from search results or recommended
    const queue = (searchResults.length > 0 ? searchResults : recommendedTracks).map(t => ({
      id: t.videoId,
      title: t.title,
      artist: t.artist,
      album: t.album,
      plays: "",
      image: t.thumbnail,
      duration: parseDuration(t.duration),
      videoId: t.videoId,
    }));
    
    playTrack(newTrack, queue);
  }, [searchResults, recommendedTracks, playTrack]);

  // Handle mock track click
  const handleTrackClick = (track: Track) => {
    playTrack(track, quickPickTracks);
  };

  const handleAlbumClick = (album: { id: string; title: string }) => {
    searchTracks(album.title);
    setSearchQuery(album.title);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "explore") navigate("/explore");
    if (tab === "library") navigate("/library");
    if (tab === "liked") navigate("/library/liked");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Global Ambient Background */}
      {currentTrack && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-[-150px] opacity-40 blur-[100px] scale-125 animate-ambient-drift transition-all duration-1000"
            style={{ backgroundImage: `url(${currentTrack.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div 
            className="absolute inset-[-250px] opacity-30 blur-[140px] scale-150 animate-ambient-drift-reverse transition-all duration-1000"
            style={{ backgroundImage: `url(${currentTrack.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-background/60" />
        </div>
      )}

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <main className="flex-1 overflow-y-auto px-6 pb-32">
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

          {/* Quick Picks */}
          {!searchQuery.trim() && (
            <div className="mb-10 animate-fade-in-up">
              <QuickPicks
                tracks={quickPickTracks}
                currentTrackId={currentTrack?.id || null}
                onTrackClick={handleTrackClick}
              />
            </div>
          )}

          {/* Recommended Songs */}
          {!searchQuery.trim() && (
            <div className="mb-10 animate-fade-in-up animation-delay-100">
              <RecommendedSongs
                tracks={recommendedTracks}
                isLoading={isLoadingRecommended}
                onTrackClick={handleYouTubeTrackClick}
                currentVideoId={currentTrack?.videoId}
              />
            </div>
          )}

          {/* Album Sections */}
          {!searchQuery.trim() && (
            <>
              <div className="mb-10 animate-fade-in-up animation-delay-200">
                <AlbumSection title="Throwback jams" subtitle="Hits from every decade" albums={throwbackAlbums} onAlbumClick={handleAlbumClick} />
              </div>
              <div className="mb-10 animate-fade-in-up animation-delay-300">
                <AlbumSection title="Popular albums" subtitle="Top picks this week" albums={recommendedAlbums} onAlbumClick={handleAlbumClick} />
              </div>
              <div className="mb-10 animate-fade-in-up animation-delay-400">
                <AlbumSection title="New releases" subtitle="Fresh music just dropped" albums={newReleases} onAlbumClick={handleAlbumClick} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
