import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat,
  Volume2,
  Maximize2,
  Heart,
  Loader2,
  Plus,
  Minimize2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/imageUtils";

interface Track {
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: number;
  videoId?: string;
}

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onProgressChange: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
  isLiked: boolean;
  onLikeToggle: () => void;
  onLyricsToggle?: () => void;
  showLyrics?: boolean;
  isBuffering?: boolean;
  onExpandClick?: () => void;
  onAmbientModeClick?: () => void;
  onDownloadClick?: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
  onAddToPlaylist?: () => void;
  onMiniPlayerClick?: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlayerBar({
  currentTrack,
  isPlaying,
  progress,
  volume,
  onPlayPause,
  onNext,
  onPrevious,
  onProgressChange,
  onVolumeChange,
  isLiked,
  onLikeToggle,
  isBuffering,
  onExpandClick,
  onAddToPlaylist,
  onMiniPlayerClick,
}: PlayerBarProps) {
  if (!currentTrack) return null;

  const currentTime = (progress / 100) * currentTrack.duration;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[80px] glass-dark border-t border-white/[0.06] flex items-center px-4 z-50 shadow-elevated">
      {/* Left: Transport controls */}
      <div className="flex items-center gap-1">
        <button 
          onClick={onPrevious} 
          className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95" 
          aria-label="Previous track"
        >
          <SkipBack className="w-5 h-5 text-foreground fill-current" />
        </button>
        <button
          onClick={onPlayPause}
          className="p-3 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all duration-200 play-glow"
          aria-label={isBuffering ? "Loading" : isPlaying ? "Pause" : "Play"}
        >
          {isBuffering ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
        <button 
          onClick={onNext} 
          className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95" 
          aria-label="Next track"
        >
          <SkipForward className="w-5 h-5 text-foreground fill-current" />
        </button>
        <span className="text-xs text-white/50 ml-3 min-w-[80px] font-medium">
          {formatTime(currentTime)} / {formatTime(currentTrack.duration)}
        </span>
      </div>

      {/* Center: Track info */}
      <div 
        className="flex-1 flex items-center justify-center gap-4 cursor-pointer group px-8"
        onClick={onExpandClick}
      >
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
          <img
            src={optimizeImageUrl(currentTrack.image, 120)}
            alt={currentTrack.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="text-center min-w-0 max-w-md">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-white transition-colors">
            {currentTrack.title}
          </h3>
          <p className="text-xs text-white/50 truncate">
            {currentTrack.artist} • {currentTrack.album}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onLikeToggle(); }}
          className={cn(
            "p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95",
            isLiked && "text-primary"
          )}
          aria-label={isLiked ? "Remove from liked songs" : "Add to liked songs"}
        >
          <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
        </button>
        <button 
          onClick={onAddToPlaylist}
          className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95"
          aria-label="Add to playlist"
        >
          <Plus className="w-5 h-5 text-white/60 hover:text-white" />
        </button>
        
        <div className="flex items-center gap-2 mx-3 px-3 py-1.5 rounded-full bg-white/5">
          <Volume2 className="w-4 h-4 text-white/50" />
          <Slider
            value={[volume]}
            onValueChange={onVolumeChange}
            max={100}
            step={1}
            className="w-24"
            aria-label="Volume"
          />
        </div>
        
        <button className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95" aria-label="Shuffle">
          <Shuffle className="w-5 h-5 text-white/60 hover:text-white" />
        </button>
        <button className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95" aria-label="Repeat">
          <Repeat className="w-5 h-5 text-white/60 hover:text-white" />
        </button>
        
        {currentTrack.videoId && (
          <>
            <button 
              onClick={onMiniPlayerClick}
              className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95"
              aria-label="Mini player"
              title="Mini player"
            >
              <Minimize2 className="w-5 h-5 text-white/60 hover:text-white" />
            </button>
            <button 
              onClick={onExpandClick}
              className="p-2.5 rounded-full hover:bg-white/10 transition-all duration-200 active:scale-95"
              aria-label="Expand player"
              title="Expand player"
            >
              <Maximize2 className="w-5 h-5 text-white/60 hover:text-white" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
