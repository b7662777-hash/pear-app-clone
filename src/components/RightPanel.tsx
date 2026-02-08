import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { useYouTubeMusic, SyncedLyricLine, LyricsData } from "@/hooks/useYouTubeMusic";
import { cn } from "@/lib/utils";
import { Play, Music, Bookmark, Volume2, ChevronLeft, ChevronRight, Check, Star } from "lucide-react";
import { optimizeImageUrl } from "@/lib/imageUtils";
import { Switch } from "@/components/ui/switch";

type Tab = "upnext" | "lyrics" | "related";

const filterChips = ["All", "Familiar", "Discover", "Popular", "Deep cuts", "Workout"];

export function RightPanel() {
  const { currentTrack, queue, playTrack, currentTime, seekTo } = usePlayer();
  const [activeTab, setActiveTab] = useState<Tab>("upnext");
  const [activeFilter, setActiveFilter] = useState("All");
  const [autoPlay, setAutoPlay] = useState(true);
  const { fetchSyncedLyrics } = useYouTubeMusic();
  const [lyrics, setLyrics] = useState<SyncedLyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Fetch lyrics when track changes
  useEffect(() => {
    if (currentTrack && activeTab === "lyrics") {
      setIsLoadingLyrics(true);
      fetchSyncedLyrics(currentTrack.title, currentTrack.artist)
        .then((result: LyricsData | undefined[] | undefined) => {
          if (result && 'lyrics' in result && result.lyrics) {
            setLyrics(result.lyrics);
          } else {
            setLyrics([]);
          }
        })
        .finally(() => setIsLoadingLyrics(false));
    }
  }, [currentTrack?.id, activeTab, fetchSyncedLyrics, currentTrack?.title, currentTrack?.artist]);

  // Find active lyric line
  const activeIndex = lyrics.findIndex((line, index) => {
    const nextLine = lyrics[index + 1];
    return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
  });

  // Auto-scroll to active line
  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeLine = activeLineRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();
      
      const scrollOffset = lineRect.top - containerRect.top - containerRect.height / 3;
      
      container.scrollTo({
        top: container.scrollTop + scrollOffset,
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  if (!currentTrack) return null;

  // Get current track index in queue
  const currentIndex = queue.findIndex(t => t.videoId === currentTrack.videoId);
  const upNextTracks = queue.slice(currentIndex, currentIndex + 10);

  // Format duration (number in seconds to "M:SS")
  const formatDuration = (duration?: number) => {
    if (!duration || typeof duration !== 'number') return "";
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-80 h-full flex flex-col bg-[#0f0f0f] border-l border-white/[0.08]">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.08]">
        {(["upnext", "lyrics", "related"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors",
              activeTab === tab
                ? "text-white border-b-2 border-white"
                : "text-white/50 hover:text-white/70"
            )}
          >
            {tab === "upnext" ? "UP NEXT" : tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* UP NEXT Tab */}
        {activeTab === "upnext" && (
          <div className="h-full overflow-y-auto">
            {/* Playing from header */}
            <div className="p-4 border-b border-white/[0.08]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/50 uppercase tracking-wider">Playing from</span>
                <button className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
                  <Bookmark className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
              <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
            </div>

            {/* Auto-play toggle */}
            <div className="p-4 border-b border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Auto-play</p>
                  <p className="text-xs text-white/50">Add similar content to the end of the queue</p>
                </div>
                <Switch 
                  checked={autoPlay} 
                  onCheckedChange={setAutoPlay}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            {/* Track list */}
            <div className="p-2 space-y-0.5">
              {upNextTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/40">
                  <Music className="w-12 h-12 mb-3" />
                  <p className="text-sm">No tracks in queue</p>
                </div>
              ) : (
                upNextTracks.map((track, index) => {
                  const isCurrentlyPlaying = track.videoId === currentTrack.videoId;
                  
                  return (
                    <div
                      key={`${track.videoId}-${index}`}
                      onClick={() => !isCurrentlyPlaying && playTrack(track, queue)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer group transition-colors",
                        isCurrentlyPlaying 
                          ? "bg-white/[0.12]" 
                          : "hover:bg-white/[0.08]"
                      )}
                    >
                      {/* Playing indicator or thumbnail */}
                      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        {isCurrentlyPlaying ? (
                          <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                          </div>
                        ) : (
                          <>
                            <img
                              src={optimizeImageUrl(track.image, 80)}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isCurrentlyPlaying ? "text-primary" : "text-white"
                        )}>
                          {track.title}
                        </p>
                        <p className="text-xs text-white/50 truncate">{track.artist}</p>
                      </div>
                      {/* Duration */}
                      <span className="text-xs text-white/40 flex-shrink-0">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Auto-play indicator */}
            {autoPlay && upNextTracks.length > 0 && (
              <div className="px-4 py-2 text-xs text-white/40">
                Auto-play is on
              </div>
            )}

            {/* Filter chips */}
            <div className="p-3 border-t border-white/[0.08]">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {filterChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setActiveFilter(chip)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                      activeFilter === chip
                        ? "bg-white text-black"
                        : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LYRICS Tab */}
        {activeTab === "lyrics" && (
          <div className="h-full flex flex-col">
            {/* Provider header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-white">YTMusic</span>
                <Check className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1 rounded hover:bg-white/[0.08] transition-colors">
                  <ChevronLeft className="w-4 h-4 text-white/50" />
                </button>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                </div>
                <button className="p-1 rounded hover:bg-white/[0.08] transition-colors">
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>
              </div>
            </div>

            {/* Lyrics content */}
            <div ref={lyricsContainerRef} className="flex-1 overflow-y-auto p-6">
              {isLoadingLyrics ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
                </div>
              ) : lyrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/40">
                  <Music className="w-12 h-12 mb-3" />
                  <p className="text-sm">No lyrics available</p>
                </div>
              ) : (
                <div className="space-y-6 pb-20">
                  {lyrics.map((line, index) => {
                    const isActive = index === activeIndex;
                    const isPast = index < activeIndex;
                    
                    return (
                      <div
                        key={`${line.time}-${index}`}
                        ref={isActive ? activeLineRef : null}
                        onClick={() => seekTo(line.time)}
                        className={cn(
                          "text-xl font-semibold leading-relaxed cursor-pointer transition-all duration-300 text-left",
                          isActive && "text-white text-2xl",
                          isPast && "text-white/30",
                          !isActive && !isPast && "text-white/50 hover:text-white/70"
                        )}
                      >
                        {line.text || "♪"}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RELATED Tab */}
        {activeTab === "related" && (
          <div className="h-full overflow-y-auto">
            {/* You might also like section */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">You might also like</h3>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded hover:bg-white/[0.08] transition-colors">
                    <ChevronLeft className="w-4 h-4 text-white/50" />
                  </button>
                  <button className="p-1 rounded hover:bg-white/[0.08] transition-colors">
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {queue.slice(0, 8).map((track, index) => (
                  <div
                    key={`related-${track.videoId}-${index}`}
                    onClick={() => playTrack(track, queue)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.08] cursor-pointer group transition-colors"
                  >
                    {/* Dual album art */}
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <img
                        src={optimizeImageUrl(track.image, 80)}
                        alt={track.title}
                        className="w-full h-full rounded object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{track.title}</p>
                      <p className="text-xs text-white/50 truncate">{track.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended playlists section */}
            <div className="p-4 border-t border-white/[0.08]">
              <h3 className="text-sm font-semibold text-white mb-3">Recommended playlists</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "PHONK TRENDING", color: "from-purple-600 to-pink-600" },
                  { name: "Chill Vibes", color: "from-blue-600 to-cyan-600" },
                  { name: "Late Night", color: "from-indigo-600 to-purple-600" },
                  { name: "Workout Mix", color: "from-orange-600 to-red-600" },
                ].map((playlist) => (
                  <div
                    key={playlist.name}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  >
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      playlist.color
                    )} />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs font-bold text-white uppercase tracking-wider truncate">
                        {playlist.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RightPanel;
