import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrackCardProps {
  title: string;
  artist: string;
  image: string;
  plays?: string;
  isPlaying?: boolean;
  onClick: () => void;
}

export function TrackCard({ title, artist, image, plays, isPlaying, onClick }: TrackCardProps) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-all duration-200 cursor-pointer"
    >
      {/* Album Art */}
      <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className={cn(
          "absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity",
          isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-4">
              <div className="w-1 bg-primary animate-equalizer" />
              <div className="w-1 bg-primary animate-equalizer animation-delay-100" />
              <div className="w-1 bg-primary animate-equalizer animation-delay-200" />
            </div>
          ) : (
            <Play className="w-5 h-5 text-white fill-white" />
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className={cn(
          "text-sm font-medium truncate",
          isPlaying ? "text-primary" : "text-foreground"
        )}>
          {title}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {artist} {plays && `• ${plays}`}
        </p>
      </div>
    </div>
  );
}
