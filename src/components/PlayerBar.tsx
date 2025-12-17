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
  Loader2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

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
}: PlayerBarProps) {
  if (!currentTrack) return null;

  const currentTime = (progress / 100) * currentTrack.duration;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-player border-t border-border/50 flex items-center px-4 z-50" style={{ boxShadow: 'var(--shadow-player)' }}>
      {/* Left: Current Track */}
      <div className="flex items-center gap-3 w-[280px]">
        <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
          <img
            src={currentTrack.image}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-foreground truncate">
            {currentTrack.title}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack.artist}
          </p>
        </div>
        <button
          onClick={onLikeToggle}
          className={cn(
            "player-control ml-2",
            isLiked && "text-primary"
          )}
        >
          <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
        </button>
      </div>

      {/* Center: Controls */}
      <div className="flex-1 flex flex-col items-center max-w-[600px] mx-auto">
        {/* Control Buttons */}
        <div className="flex items-center gap-4 mb-1">
          <button className="player-control">
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={onPrevious} className="player-control">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button
            onClick={onPlayPause}
            className="player-control-main relative"
          >
            {isBuffering ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
          <button onClick={onNext} className="player-control">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
          <button className="player-control">
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[progress]}
            onValueChange={onProgressChange}
            max={100}
            step={0.1}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(currentTrack.duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & Actions */}
      <div className="w-[280px] flex items-center justify-end gap-2">
        {currentTrack.videoId && (
          <button 
            onClick={onLyricsToggle}
            className={cn("player-control", showLyrics && "text-primary")}
          >
            <Mic2 className="w-5 h-5" />
          </button>
        )}
        <button className="player-control">
          <ListMusic className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 w-32">
          <Volume2 className="w-5 h-5 text-muted-foreground" />
          <Slider
            value={[volume]}
            onValueChange={onVolumeChange}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>
        <button className="player-control">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
