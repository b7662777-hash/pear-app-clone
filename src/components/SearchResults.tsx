import { Play, Loader2, Download, Music, Disc3, ListMusic, Video } from "lucide-react";
import { YouTubeTrack } from "@/hooks/useYouTubeMusic";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/imageUtils";
import { useState } from "react";

interface SearchResultsProps {
  results: YouTubeTrack[];
  isSearching: boolean;
  onTrackClick: (track: YouTubeTrack) => void;
  onDownloadClick?: (track: YouTubeTrack) => void;
  isDownloading?: boolean;
  currentVideoId?: string | null;
  isVisible: boolean;
}

type SearchFilter = "all" | "songs" | "videos" | "albums" | "playlists";

const filterTabs: { id: SearchFilter; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All", icon: null },
  { id: "songs", label: "Songs", icon: <Music className="w-3.5 h-3.5" /> },
  { id: "videos", label: "Videos", icon: <Video className="w-3.5 h-3.5" /> },
  { id: "albums", label: "Albums", icon: <Disc3 className="w-3.5 h-3.5" /> },
  { id: "playlists", label: "Playlists", icon: <ListMusic className="w-3.5 h-3.5" /> },
];

function TrackRow({
  track,
  index,
  onTrackClick,
  onDownloadClick,
  isDownloading,
  isPlaying,
}: {
  track: YouTubeTrack;
  index: number;
  onTrackClick: (track: YouTubeTrack) => void;
  onDownloadClick?: (track: YouTubeTrack) => void;
  isDownloading?: boolean;
  isPlaying: boolean;
}) {
  return (
    <button
      onClick={() => onTrackClick(track)}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-left w-full",
        "hover:bg-muted/50 group",
        isPlaying && "bg-muted/70"
      )}
    >
      <span className="w-6 text-xs text-muted-foreground text-right flex-shrink-0 group-hover:hidden">
        {index + 1}
      </span>
      <span className="w-6 flex-shrink-0 hidden group-hover:flex items-center justify-center">
        <Play className="w-3.5 h-3.5 fill-foreground text-foreground" />
      </span>
      <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
        <img
          src={optimizeImageUrl(track.thumbnail, 80)}
          alt={track.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className={cn("text-sm font-medium truncate", isPlaying ? "text-primary" : "text-foreground")}>
          {track.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {track.artist}
        </p>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
        {track.album}
      </span>
      <span className="text-xs text-muted-foreground flex-shrink-0 w-12 text-right">
        {track.duration}
      </span>
      {onDownloadClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onDownloadClick(track); }}
          disabled={isDownloading}
          className="flex-shrink-0 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted transition-all duration-200 disabled:opacity-50"
          aria-label={`Download ${track.title}`}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          ) : (
            <Download className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      )}
    </button>
  );
}

function TopResultCard({
  track,
  onTrackClick,
  isPlaying,
}: {
  track: YouTubeTrack;
  onTrackClick: (track: YouTubeTrack) => void;
  isPlaying: boolean;
}) {
  return (
    <button
      onClick={() => onTrackClick(track)}
      className={cn(
        "flex flex-col gap-4 p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 text-left group relative overflow-hidden",
        isPlaying && "bg-muted/60"
      )}
    >
      <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-lg">
        <img
          src={optimizeImageUrl(track.thumbnail, 200)}
          alt={track.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-primary-foreground text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>
      <div className="min-w-0">
        <h3 className={cn("text-lg font-bold truncate", isPlaying ? "text-primary" : "text-foreground")}>
          {track.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate mt-1">
          Song • {track.artist}
        </p>
      </div>
    </button>
  );
}

function AlbumCard({
  track,
  onTrackClick,
}: {
  track: YouTubeTrack;
  onTrackClick: (track: YouTubeTrack) => void;
}) {
  return (
    <button
      onClick={() => onTrackClick(track)}
      className="flex flex-col gap-2 p-3 rounded-lg hover:bg-muted/40 transition-all duration-200 text-left group w-[160px] flex-shrink-0"
    >
      <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-md">
        <img
          src={optimizeImageUrl(track.thumbnail, 200)}
          alt={track.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-primary-foreground text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>
      <h3 className="text-sm font-medium text-foreground truncate w-full">{track.title}</h3>
      <p className="text-xs text-muted-foreground truncate w-full">{track.artist}</p>
    </button>
  );
}

export function SearchResults({
  results,
  isSearching,
  onTrackClick,
  onDownloadClick,
  isDownloading,
  currentVideoId,
  isVisible,
}: SearchResultsProps) {
  const [activeFilter, setActiveFilter] = useState<SearchFilter>("all");

  if (!isVisible) return null;

  if (isSearching) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Search Results</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Searching...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) return null;

  const topResult = results[0];
  const songs = results;
  // Simulate categories from the same results for a YT Music-like feel
  const videos = results.filter((_, i) => i % 3 === 0);
  const albums = results.filter((_, i) => i % 4 === 0 || i % 5 === 0);
  const playlists = results.filter((_, i) => i % 3 === 1);

  const getFilteredResults = () => {
    switch (activeFilter) {
      case "songs": return songs;
      case "videos": return videos;
      case "albums": return albums;
      case "playlists": return playlists;
      default: return songs;
    }
  };

  return (
    <div className="mb-8">
      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
              activeFilter === tab.id
                ? "bg-foreground text-background"
                : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeFilter === "all" ? (
        <div className="space-y-8">
          {/* Top Result + Songs */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_2fr] gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3">Top result</h3>
              <TopResultCard
                track={topResult}
                onTrackClick={onTrackClick}
                isPlaying={currentVideoId === topResult.videoId}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-3">Songs</h3>
              <div className="space-y-0.5">
                {songs.slice(0, 4).map((track, i) => (
                  <TrackRow
                    key={track.videoId}
                    track={track}
                    index={i}
                    onTrackClick={onTrackClick}
                    onDownloadClick={onDownloadClick}
                    isDownloading={isDownloading}
                    isPlaying={currentVideoId === track.videoId}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Videos section */}
          {videos.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Videos</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {videos.slice(0, 6).map((track) => (
                  <AlbumCard key={`vid-${track.videoId}`} track={track} onTrackClick={onTrackClick} />
                ))}
              </div>
            </div>
          )}

          {/* Albums section */}
          {albums.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Albums</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {albums.slice(0, 6).map((track) => (
                  <AlbumCard key={`alb-${track.videoId}`} track={track} onTrackClick={onTrackClick} />
                ))}
              </div>
            </div>
          )}

          {/* Community playlists */}
          {playlists.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3">Community playlists</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {playlists.slice(0, 6).map((track) => (
                  <AlbumCard key={`pl-${track.videoId}`} track={track} onTrackClick={onTrackClick} />
                ))}
              </div>
            </div>
          )}

          {/* All songs list */}
          {songs.length > 4 && (
            <div>
              <h3 className="text-lg font-bold mb-3">More songs</h3>
              <div className="space-y-0.5">
                {songs.slice(4).map((track, i) => (
                  <TrackRow
                    key={track.videoId}
                    track={track}
                    index={i + 4}
                    onTrackClick={onTrackClick}
                    onDownloadClick={onDownloadClick}
                    isDownloading={isDownloading}
                    isPlaying={currentVideoId === track.videoId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeFilter === "albums" || activeFilter === "playlists" ? (
        <div className="flex flex-wrap gap-3">
          {getFilteredResults().map((track) => (
            <AlbumCard key={track.videoId} track={track} onTrackClick={onTrackClick} />
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          {getFilteredResults().map((track, i) => (
            <TrackRow
              key={track.videoId}
              track={track}
              index={i}
              onTrackClick={onTrackClick}
              onDownloadClick={onDownloadClick}
              isDownloading={isDownloading}
              isPlaying={currentVideoId === track.videoId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
