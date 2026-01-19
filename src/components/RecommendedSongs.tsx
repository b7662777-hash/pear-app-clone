import { Play, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { YouTubeTrack } from "@/hooks/useYouTubeMusic";

interface RecommendedSongsProps {
  tracks: YouTubeTrack[];
  isLoading: boolean;
  onTrackClick: (track: YouTubeTrack) => void;
  currentVideoId?: string;
}

export function RecommendedSongs({ 
  tracks, 
  isLoading, 
  onTrackClick, 
  currentVideoId 
}: RecommendedSongsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Recommended for you</h2>
          <p className="text-sm text-muted-foreground">Based on what's popular</p>
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
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Recommended for you</h2>
        <p className="text-sm text-muted-foreground">Based on what's popular</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tracks.map((track, index) => {
          const isPlaying = track.videoId === currentVideoId;
          
          return (
            <div
              key={track.videoId}
              onClick={() => onTrackClick(track)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                <img
                  src={track.thumbnail.replace("w120-h120", "w300-h300")}
                  alt={track.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  fetchPriority={index < 6 ? "high" : "auto"}
                />
                <div className={cn(
                  "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
                  isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-6">
                      <div className="w-1 bg-primary animate-equalizer" />
                      <div className="w-1 bg-primary animate-equalizer animation-delay-100" />
                      <div className="w-1 bg-primary animate-equalizer animation-delay-200" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground ml-0.5" />
                    </div>
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