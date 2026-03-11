import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, Maximize2, Loader2, ThumbsDown, ThumbsUp,
  MoreHorizontal, Minimize2, Download
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
  currentTrack, isPlaying, progress, volume,
  onPlayPause, onNext, onPrevious,
  onProgressChange, onVolumeChange,
  isLiked, onLikeToggle, isBuffering,
  onExpandClick, onMiniPlayerClick, onDownloadClick,
}: PlayerBarProps) {
  const currentTime = currentTrack ? (progress / 100) * currentTrack.duration : 0;

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[64px] md:h-[72px] bg-[#181818] flex flex-col z-50 border-t border-white/[0.05]">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
        <div 
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        <Slider
          value={[progress]}
          onValueChange={onProgressChange}
          max={100}
          step={0.1}
          className="absolute inset-0 opacity-0 hover:opacity-100 cursor-pointer"
          aria-label="Track progress"
        />
      </div>
      
      {/* Main controls */}
      <div className="flex-1 flex items-center justify-between px-4">
        {/* Left: Transport controls + time */}
        <div className="flex items-center gap-1 md:gap-2">
          <button onClick={onPrevious} className="p-2 hover:bg-white/[0.1] rounded-full transition-colors" aria-label="Previous">
            <SkipBack className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
          </button>
          <button onClick={onPlayPause} className="p-2 hover:bg-white/[0.1] rounded-full transition-colors" aria-label={isBuffering ? "Loading" : isPlaying ? "Pause" : "Play"}>
            {isBuffering ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 text-white fill-white" />
            ) : (
              <Play className="w-8 h-8 text-white fill-white" />
            )}
          </button>
          <button onClick={onNext} className="p-2 hover:bg-white/[0.1] rounded-full transition-colors" aria-label="Next">
            <SkipForward className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
          </button>
          
          <span className="text-xs text-white/60 ml-2 tabular-nums hidden sm:inline">
            {formatTime(currentTime)} / {formatTime(currentTrack.duration)}
          </span>
        </div>

        {/* Center: Track info */}
        <div 
          className="flex items-center gap-3 cursor-pointer group flex-1 justify-center max-w-lg min-w-0"
          onClick={onExpandClick}
        >
          <img
            src={optimizeImageUrl(currentTrack.image, 96)}
            alt={currentTrack.title}
            className="w-10 h-10 rounded object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate max-w-[200px]">
              {currentTrack.title}
            </h3>
            <p className="text-xs text-white/50 truncate max-w-[200px]">
              {currentTrack.artist} • {currentTrack.album}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 md:gap-1">
          <button className="p-2 hover:bg-white/[0.1] rounded-full transition-colors hidden md:block" aria-label="Dislike">
            <ThumbsDown className="w-5 h-5 text-white/60" />
          </button>
          <button
            onClick={onLikeToggle}
            className={cn("p-2 hover:bg-white/[0.1] rounded-full transition-colors", isLiked && "text-white")}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <ThumbsUp className={cn("w-5 h-5", isLiked ? "text-white fill-white" : "text-white/60")} />
          </button>
          
          {onDownloadClick && (
            <button onClick={onDownloadClick} className="p-2 hover:bg-white/[0.1] rounded-full transition-colors hidden md:block" aria-label="Download">
              <Download className="w-5 h-5 text-white/60" />
            </button>
          )}
          
          <button className="p-2 hover:bg-white/[0.1] rounded-full transition-colors hidden md:block" aria-label="More">
            <MoreHorizontal className="w-5 h-5 text-white/60" />
          </button>

          <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />
          
          <button className="p-2 hover:bg-white/[0.1] rounded-full transition-colors hidden md:block" aria-label="Volume">
            <Volume2 className="w-5 h-5 text-white/60" />
          </button>
          <Slider
            value={[volume]}
            onValueChange={onVolumeChange}
            max={100}
            step={1}
            className="w-20 hidden md:flex"
            aria-label="Volume"
          />
          
          <div className="w-px h-6 bg-white/10 mx-1 hidden lg:block" />
          
          <button className="p-2 hover:bg-white/[0.1] rounded-full transition-colors hidden lg:block" aria-label="Repeat">
            <Repeat className="w-5 h-5 text-white/60" />
          </button>
          <button className="p-2 hover:bg-white/[0.1] rounded-full transition-colors hidden lg:block" aria-label="Shuffle">
            <Shuffle className="w-5 h-5 text-white/60" />
          </button>
          
          {currentTrack.videoId && (
            <>
              <button onClick={onMiniPlayerClick} className="p-2 hover:bg-white/[0.1] rounded-full transition-colors hidden md:block" aria-label="Mini player">
                <Minimize2 className="w-5 h-5 text-white/60" />
              </button>
              <button onClick={onExpandClick} className="p-2 hover:bg-white/[0.1] rounded-full transition-colors" aria-label="Expand">
                <Maximize2 className="w-5 h-5 text-white/60" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
