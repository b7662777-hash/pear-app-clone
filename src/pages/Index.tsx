import { useState, useEffect, useCallback, lazy, Suspense, startTransition } from "react";
import { SidebarShell } from "@/components/SidebarShell";
import { SearchBar } from "@/components/SearchBar";
import { MoodChips } from "@/components/MoodChips";
import { SearchResults } from "@/components/SearchResults";
import { ListenAgainSection } from "@/components/ListenAgainSection";
import { SimilarToSection } from "@/components/SimilarToSection";
import { useYouTubeMusic, YouTubeTrack } from "@/hooks/useYouTubeMusic";
import { QuickPicks } from "@/components/QuickPicks";

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
  } = useYouTubeMusic();

  // Fetch recommended tracks on mount only if cache is empty
  useEffect(() => {
    if (recommendedTracks.length === 0) {
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

  // Convert recommended tracks for SimilarToSection
  const similarAlbums = recommendedTracks.slice(6, 12).map(t => ({
    id: t.videoId,
    title: t.title,
    artist: t.artist,
    image: t.thumbnail,
    videoId: t.videoId,
  }));

  const quickPickTracks = recommendedTracks.slice(0, 12).map(track => ({
    id: track.videoId,
    title: track.title,
    artist: track.artist,
    album: track.album ?? "YouTube Music",
    plays: track.views ?? "Fresh picks",
    image: track.thumbnail,
  }));

  return (
    <div className="flex h-screen bg-[#0b0b0b] overflow-hidden relative">
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

        <main className="flex-1 overflow-y-auto px-6 pb-24">
          {!searchQuery.trim() && (
            <section className="mt-6 mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#2a0505] via-[#140c0c] to-[#090909] p-6 text-white shadow-[0_20px_60px_-40px_rgba(255,0,0,0.45)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3 max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
                    For you
                  </span>
                  <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
                    Your soundtrack, powered by fresh picks and deep cuts.
                  </h1>
                  <p className="text-sm md:text-base text-white/70">
                    Dive into mixes tailored to your mood, discover new releases, and keep the music rolling without missing a beat.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors">
                      Play the mix
                    </button>
                    <button className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:border-white/60 transition-colors">
                      Start radio
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-white/70 lg:text-right">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Daily</p>
                    <p className="mt-1 text-lg font-semibold text-white">00:42</p>
                    <p className="text-xs text-white/60">Listening streak</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/50">Drop</p>
                    <p className="mt-1 text-lg font-semibold text-white">Fresh Finds</p>
                    <p className="text-xs text-white/60">New this week</p>
                  </div>
                </div>
              </div>
            </section>
          )}
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

          {/* Quick picks */}
          {!searchQuery.trim() && quickPickTracks.length > 0 && (
            <div className="mb-8">
              <QuickPicks
                tracks={quickPickTracks}
                currentTrackId={currentTrack?.id ?? null}
                onTrackClick={(track) => {
                  const ytTrack = recommendedTracks.find(t => t.videoId === track.id);
                  if (ytTrack) handleYouTubeTrackClick(ytTrack);
                }}
              />
            </div>
          )}

          {/* Listen again */}
          {!searchQuery.trim() && recommendedTracks.length > 0 && (
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

          {/* Similar To Section */}
          {!searchQuery.trim() && similarAlbums.length > 0 && (
            <SimilarToSection
              title="On repeat right now"
              subtitle="RECOMMENDED"
              featuredImage={similarAlbums[0]?.image}
              albums={similarAlbums}
              onAlbumClick={(album) => {
                const ytTrack = recommendedTracks.find(t => t.videoId === album.videoId);
                if (ytTrack) handleYouTubeTrackClick(ytTrack);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
