import { useState, useEffect, useCallback, lazy, Suspense, startTransition } from "react";
import { SidebarShell } from "@/components/SidebarShell";
import { SearchBar } from "@/components/SearchBar";
import { MoodChips } from "@/components/MoodChips";
import { SearchResults } from "@/components/SearchResults";
import { ListenAgainSection } from "@/components/ListenAgainSection";
import { SimilarToSection } from "@/components/SimilarToSection";
import { RecommendedSongs } from "@/components/RecommendedSongs";
import { useYouTubeMusic, YouTubeTrack } from "@/hooks/useYouTubeMusic";
import { Loader2, Music } from "lucide-react";

// Lazy load components that aren't critical for initial render
const AmbientBackground = lazy(() => import("@/components/AmbientBackground").then(m => ({ default: m.AmbientBackground })));
import { usePlayer, Track } from "@/contexts/PlayerContext";
import { useNavigate } from "react-router-dom";

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
    trendingTracks,
    isLoadingTrending,
    fetchTrendingTracks,
    newReleaseTracks,
    isLoadingNewReleases,
    fetchNewReleases,
  } = useYouTubeMusic();

  // Fetch all sections on mount
  useEffect(() => {
    if (recommendedTracks.length === 0) {
      startTransition(() => { fetchRecommendedTracks(); });
    }
    startTransition(() => { fetchTrendingTracks(); });
    startTransition(() => { fetchNewReleases(); });
  }, [fetchRecommendedTracks, fetchTrendingTracks, fetchNewReleases, recommendedTracks.length]);

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

  const parseDuration = (durationStr: string): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

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

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "explore") navigate("/explore");
    if (tab === "library") navigate("/library");
    if (tab === "liked") navigate("/library/liked");
  };

  // Convert tracks for SimilarToSection
  const similarAlbums = recommendedTracks.slice(6, 12).map(t => ({
    id: t.videoId,
    title: t.title,
    artist: t.artist,
    image: t.thumbnail,
    videoId: t.videoId,
  }));

  const isHomeLoading = isLoadingRecommended && recommendedTracks.length === 0;

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden relative">
      {/* Global Ambient Background */}
      <Suspense fallback={null}>
        <AmbientBackground />
      </Suspense>

      {/* Sidebar */}
      <SidebarShell activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery}
          searchResults={searchResults.map(r => ({
            id: r.videoId,
            title: r.title,
            artist: r.artist,
            image: r.thumbnail,
            videoId: r.videoId,
          }))}
        />

        <main className="flex-1 overflow-y-auto px-3 md:px-6 pb-16 md:pb-24">
          {/* Mood Chips */}
          <div className="mb-6 pt-2">
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

          {/* Home content when not searching */}
          {!searchQuery.trim() && (
            <>
              {/* Loading state */}
              {isHomeLoading && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-sm">Loading your music...</p>
                </div>
              )}

              {/* Quick Picks / Listen Again */}
              {recommendedTracks.length > 0 && (
                <ListenAgainSection
                  tracks={recommendedTracks.slice(0, 6).map(t => ({
                    id: t.videoId,
                    title: t.title,
                    artist: t.artist,
                    image: t.thumbnail,
                    videoId: t.videoId,
                    type: 'Song',
                  }))}
                  featuredTrack={recommendedTracks[0] ? {
                    id: recommendedTracks[0].videoId,
                    title: recommendedTracks[0].title,
                    artist: recommendedTracks[0].artist,
                    image: recommendedTracks[0].thumbnail,
                    videoId: recommendedTracks[0].videoId,
                  } : null}
                  onTrackClick={(track) => {
                    const ytTrack = recommendedTracks.find(t => t.videoId === track.videoId);
                    if (ytTrack) handleYouTubeTrackClick(ytTrack);
                  }}
                />
              )}

              {/* Trending */}
              <RecommendedSongs
                tracks={trendingTracks}
                isLoading={isLoadingTrending}
                onTrackClick={handleYouTubeTrackClick}
                currentVideoId={currentTrack?.videoId}
                title="Trending Now"
                subtitle="What's hot right now"
              />

              {/* New Releases */}
              <RecommendedSongs
                tracks={newReleaseTracks}
                isLoading={isLoadingNewReleases}
                onTrackClick={handleYouTubeTrackClick}
                currentVideoId={currentTrack?.videoId}
                title="New Releases"
                subtitle="Fresh tracks just dropped"
              />

              {/* Similar To Section */}
              {similarAlbums.length > 0 && (
                <SimilarToSection
                  title={currentTrack?.artist || "Popular Artists"}
                  subtitle="SIMILAR TO"
                  featuredImage={similarAlbums[0]?.image}
                  albums={similarAlbums}
                  onAlbumClick={(album) => {
                    const ytTrack = recommendedTracks.find(t => t.videoId === album.videoId);
                    if (ytTrack) handleYouTubeTrackClick(ytTrack);
                  }}
                />
              )}

              {/* Empty state when nothing loaded */}
              {!isHomeLoading && recommendedTracks.length === 0 && trendingTracks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Music className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No music found. Try refreshing.</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
