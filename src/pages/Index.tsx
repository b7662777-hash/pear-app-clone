import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { MoodChips } from "@/components/MoodChips";
import { QuickPicks } from "@/components/QuickPicks";
import { AlbumSection } from "@/components/AlbumSection";
import { PlayerBar } from "@/components/PlayerBar";
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

  // Simulate progress when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + (100 / currentTrack.duration);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const handleTrackClick = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setProgress(0);
      setIsPlaying(true);
      setIsLiked(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    const currentIndex = quickPickTracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % quickPickTracks.length;
    setCurrentTrack(quickPickTracks[nextIndex]);
    setProgress(0);
    setIsLiked(false);
  };

  const handlePrevious = () => {
    const currentIndex = quickPickTracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = currentIndex === 0 ? quickPickTracks.length - 1 : currentIndex - 1;
    setCurrentTrack(quickPickTracks[prevIndex]);
    setProgress(0);
    setIsLiked(false);
  };

  const handleAlbumClick = (album: { id: string; title: string }) => {
    // For now, just play the first track
    const randomTrack = quickPickTracks[Math.floor(Math.random() * quickPickTracks.length)];
    setCurrentTrack(randomTrack);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-6 pb-24">
          {/* Mood Chips */}
          <div className="mb-6">
            <MoodChips selected={selectedMood} onSelect={setSelectedMood} />
          </div>

          {/* Quick Picks */}
          <div className="mb-10">
            <QuickPicks
              tracks={quickPickTracks}
              currentTrackId={currentTrack?.id || null}
              onTrackClick={handleTrackClick}
            />
          </div>

          {/* Throwback Jams */}
          <div className="mb-10">
            <AlbumSection
              title="Throwback jams"
              subtitle="Hits from every decade"
              albums={throwbackAlbums}
              onAlbumClick={handleAlbumClick}
            />
          </div>

          {/* Recommended for You */}
          <div className="mb-10">
            <AlbumSection
              title="Recommended for you"
              subtitle="Based on your listening"
              albums={recommendedAlbums}
              onAlbumClick={handleAlbumClick}
            />
          </div>

          {/* New Releases */}
          <div className="mb-10">
            <AlbumSection
              title="New releases"
              subtitle="Fresh music just dropped"
              albums={newReleases}
              onAlbumClick={handleAlbumClick}
            />
          </div>
        </main>
      </div>

      {/* Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        volume={volume}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onProgressChange={(value) => setProgress(value[0])}
        onVolumeChange={(value) => setVolume(value[0])}
        isLiked={isLiked}
        onLikeToggle={() => setIsLiked(!isLiked)}
      />
    </div>
  );
};

export default Index;
