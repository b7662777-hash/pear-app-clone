import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat,
  Volume2,
  Maximize2,
  ListMusic,
  Heart,
  Mic2,
  Loader2,
  Sparkles,
  Download,
  Plus
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
  onLyricsToggle,
  showLyrics,
  isBuffering,
  onExpandClick,
  onAmbientModeClick,
  onDownloadClick,
  isDownloading,
  downloadProgress = 0,
  onAddToPlaylist,
}: PlayerBarProps) {
  if (!currentTrack) return null;

  const currentTime = (progress / 100) * currentTrack.duration;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-player-bg border-t border-border/20 flex items-center px-4 z-50">
      {/* Left: Transport controls */}
      <div className="flex items-center gap-1">
        <button onClick={onPrevious} className="p-2.5 rounded-full hover:bg-accent transition-colors">
          <SkipBack className="w-5 h-5 text-foreground fill-current" />
        </button>
        <button
          onClick={onPlayPause}
          className="p-2.5 rounded-full hover:bg-accent transition-colors"
        >
          {isBuffering ? (
            <Loader2 className="w-6 h-6 text-foreground animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6 text-foreground fill-current" />
          ) : (
            <Play className="w-6 h-6 text-foreground fill-current ml-0.5" />
          )}
        </button>
        <button onClick={onNext} className="p-2.5 rounded-full hover:bg-accent transition-colors">
          <SkipForward className="w-5 h-5 text-foreground fill-current" />
        </button>
        <span className="text-xs text-muted-foreground ml-2 min-w-[80px]">
          {formatTime(currentTime)} / {formatTime(currentTrack.duration)}
        </span>
      </div>
      {/* Center: Track info with progress */}
      <div 
        className="flex-1 flex items-center justify-center gap-4 cursor-pointer group"
        onClick={onExpandClick}
      >
        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
          <img
            src={optimizeImageUrl(currentTrack.image, 120)}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-center min-w-0 max-w-md">
          <h3 className="text-sm font-medium text-foreground truncate">
            {currentTrack.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack.artist} • {currentTrack.album}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onLikeToggle(); }}
          className={cn(
            "p-2.5 rounded-full hover:bg-accent transition-colors",
            isLiked && "text-foreground"
          )}
        >
          {isLiked ? (
            <Heart className="w-5 h-5 fill-current" />
          ) : (
            <Heart className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
        <button 
          onClick={onAddToPlaylist}
          className="p-2.5 rounded-full hover:bg-accent transition-colors"
          title="Add to playlist"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-1 mx-2">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={onVolumeChange}
            max={100}
            step={1}
            className="w-24"
          />
        </div>
        <button className="p-2.5 rounded-full hover:bg-accent transition-colors">
          <Shuffle className="w-5 h-5 text-muted-foreground" />
        </button>
        <button className="p-2.5 rounded-full hover:bg-accent transition-colors">
          <Repeat className="w-5 h-5 text-muted-foreground" />
        </button>
        {currentTrack.videoId && (
          <button 
            onClick={onExpandClick}
            className="p-2.5 rounded-full hover:bg-accent transition-colors"
          >
            <Maximize2 className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
