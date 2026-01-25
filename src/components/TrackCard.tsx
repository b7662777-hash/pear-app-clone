import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/imageUtils";

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
      className="group flex items-center gap-3 p-2.5 rounded-xl glass-card cursor-pointer"
    >
      {/* Album Art */}
      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={optimizeImageUrl(image, 100)}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className={cn(
          "absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-200",
          isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          {isPlaying ? (
            <div className="flex items-end gap-0.5 h-4">
              <div className="w-1 bg-primary animate-equalizer rounded-full" />
              <div className="w-1 bg-primary animate-equalizer animation-delay-100 rounded-full" />
              <div className="w-1 bg-primary animate-equalizer animation-delay-200 rounded-full" />
            </div>
          ) : (
            <Play className="w-5 h-5 text-white fill-white" />
          )}
        </div>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "text-sm font-semibold truncate transition-colors",
          isPlaying ? "text-primary" : "text-foreground"
        )}>
          {title}
        </h3>
        <p className="text-xs text-white/50 truncate">
          {artist} {plays && `• ${plays}`}
        </p>
      </div>
    </div>
  );
}
