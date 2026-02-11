import { Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/imageUtils";
import { YouTubeTrack } from "@/hooks/useYouTubeMusic";

interface RecommendedSongsProps {
  tracks: YouTubeTrack[];
  isLoading: boolean;
  onTrackClick: (track: YouTubeTrack) => void;
  currentVideoId?: string;
  title?: string;
  subtitle?: string;
}

export function RecommendedSongs({ 
  tracks, 
  isLoading, 
  onTrackClick, 
  currentVideoId,
  title = "Recommended for you",
  subtitle = "Based on what's popular",
}: RecommendedSongsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {tracks.map((track, index) => {
          const isPlaying = track.videoId === currentVideoId;
          
          return (
            <div
              key={track.videoId}
              onClick={() => onTrackClick(track)}
              className="group cursor-pointer flex-shrink-0 w-[140px] md:w-[160px]"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                <img
                  src={optimizeImageUrl(track.thumbnail, 160)}
                  alt={track.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading={index < 6 ? "eager" : "lazy"}
                  fetchPriority={index < 6 ? "high" : "auto"}
                />
                <div className={cn(
                  "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
                  isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-6" aria-label="Currently playing">
                      <div className="w-1 bg-primary animate-equalizer" />
                      <div className="w-1 bg-primary animate-equalizer animation-delay-100" />
                      <div className="w-1 bg-primary animate-equalizer animation-delay-200" />
                    </div>
                  ) : (
                    <button 
                      className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg"
                      aria-label={`Play ${track.title}`}
                      onClick={(e) => { e.stopPropagation(); onTrackClick(track); }}
                    >
                      <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
              
              <h3 className={cn(
                "text-sm font-medium truncate",
                isPlaying ? "text-primary" : "text-foreground"
              )}>
                {track.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {track.artist}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
