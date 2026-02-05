import { useState, useEffect, useCallback, lazy, Suspense, startTransition } from "react";
import { SidebarShell } from "@/components/SidebarShell";
import { SearchBarShell } from "@/components/SearchBarShell";
import { MoodChips } from "@/components/MoodChips";
import { AlbumSection } from "@/components/AlbumSection";
import { SearchResults } from "@/components/SearchResults";
import { ListenAgainSection } from "@/components/ListenAgainSection";
import { useYouTubeMusic, YouTubeTrack } from "@/hooks/useYouTubeMusic";

// Lazy load components that aren't critical for initial render
const AmbientBackground = lazy(() => import("@/components/AmbientBackground").then(m => ({ default: m.AmbientBackground })));
const RightPanel = lazy(() => import("@/components/RightPanel"));
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { useNavigate } from "react-router-dom";
import { 
  throwbackAlbums, 
  recommendedAlbums, 
  newReleases 
} from "@/data/mockData";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { playTrack, currentTrack } = usePlayer();

  const {
    isSearching,
    searchResults,
    searchTracks,
    clearSearch,
    recommendedTracks,
    isLoadingRecommended,
    fetchRecommendedTracks,
  } = useYouTubeMusic();

  // Fetch recommended tracks on mount only if cache is empty
  // Use startTransition to keep UI responsive during fetch
  useEffect(() => {
    if (recommendedTracks.length === 0) {
      // Fetch immediately to reduce LCP resource load delay
      // The API call is already non-blocking and cached results load instantly
      startTransition(() => {
        fetchRecommendedTracks();
      });
    }
  }, [fetchRecommendedTracks, recommendedTracks.length]);

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
      <Suspense fallback={null}>
        <AmbientBackground />
      </Suspense>

      {/* Sidebar */}
      <SidebarShell activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <SearchBarShell value={searchQuery} onChange={setSearchQuery} />

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

          {/* Albums for you */}
          {!searchQuery.trim() && (
            <div className="mb-10">
              <AlbumSection title="Albums for you" albums={recommendedAlbums} onAlbumClick={handleAlbumClick} />
            </div>
          )}

          {/* Listen again */}
          {!searchQuery.trim() && (
            <div className="min-h-[320px]">
              {recommendedTracks.length > 0 && (
                <ListenAgainSection
                  tracks={recommendedTracks.slice(0, 4).map(t => ({
                    id: t.videoId,
                    title: t.title,
                    artist: t.artist,
                    image: t.thumbnail,
                    videoId: t.videoId,
                  }))}
                  featuredTrack={recommendedTracks[4] ? {
                    id: recommendedTracks[4].videoId,
                    title: recommendedTracks[4].title,
                    artist: recommendedTracks[4].artist,
                    image: recommendedTracks[4].thumbnail,
                    videoId: recommendedTracks[4].videoId,
                  } : null}
                  onTrackClick={(track) => {
                    const ytTrack = recommendedTracks.find(t => t.videoId === track.videoId);
                    if (ytTrack) handleYouTubeTrackClick(ytTrack);
                  }}
                />
              )}
            </div>
          )}

          {/* Album Sections */}
          {!searchQuery.trim() && (
            <>
              <div className="mb-10">
                <AlbumSection title="Throwback jams" subtitle="Hits from every decade" albums={throwbackAlbums} onAlbumClick={handleAlbumClick} />
              </div>
              <div className="mb-10">
                <AlbumSection title="Popular albums" subtitle="Top picks this week" albums={recommendedAlbums} onAlbumClick={handleAlbumClick} />
              </div>
              <div className="mb-10">
                <AlbumSection title="New releases" subtitle="Fresh music just dropped" albums={newReleases} onAlbumClick={handleAlbumClick} />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Right Panel - only visible when track is playing */}
      {currentTrack && (
        <Suspense fallback={null}>
          <RightPanel />
        </Suspense>
      )}
    </div>
  );
};

export default Index;
