import { Play, Loader2 } from "lucide-react";
import { YouTubeTrack } from "@/hooks/useYouTubeMusic";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/imageUtils";

interface SearchResultsProps {
  results: YouTubeTrack[];
  isSearching: boolean;
  onTrackClick: (track: YouTubeTrack) => void;
  currentVideoId?: string | null;
  isVisible: boolean;
}

export function SearchResults({
  results,
  isSearching,
  onTrackClick,
  currentVideoId,
  isVisible,
}: SearchResultsProps) {
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

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4">Search Results</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {results.map((track) => (
          <button
            key={track.videoId}
            onClick={() => onTrackClick(track)}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-left",
              "hover:bg-muted/50 group",
              currentVideoId === track.videoId && "bg-muted/70"
            )}
          >
            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
              <img
                src={optimizeImageUrl(track.thumbnail, 100)}
                alt={track.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-5 h-5 fill-white text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-foreground truncate">
                {track.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {track.artist}
              </p>
              <p className="text-xs text-muted-foreground/70 truncate">
                {track.album} {track.duration && `• ${track.duration}`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
