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
  Download
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
  onExpandClick?: () => void;
  onAmbientModeClick?: () => void;
  onDownloadClick?: () => void;
  isDownloading?: boolean;
  downloadProgress?: number;
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
}: PlayerBarProps) {
  if (!currentTrack) return null;

  const currentTime = (progress / 100) * currentTrack.duration;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-background/80 backdrop-blur-xl border-t border-border/30 flex items-center px-4 z-50 overflow-hidden" style={{ boxShadow: 'var(--shadow-player)' }}>
      {/* Ambient Background Layers */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute inset-[-20px] opacity-40 blur-2xl scale-110 animate-ambient-drift"
          style={{
            backgroundImage: `url(${currentTrack.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div 
          className="absolute inset-[-30px] opacity-25 blur-3xl scale-125 animate-ambient-drift-reverse"
          style={{
            backgroundImage: `url(${currentTrack.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>
      {/* Left: Current Track */}
      <div 
        className="flex items-center gap-3 w-[280px] cursor-pointer group"
        onClick={onExpandClick}
      >
        <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 group-hover:shadow-lg transition-shadow">
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
        {currentTrack.videoId && (
          <button 
            onClick={onDownloadClick}
            className="player-control relative"
            disabled={isDownloading}
            title={isDownloading ? `Downloading ${downloadProgress}%` : "Download"}
          >
            {isDownloading ? (
              <div className="relative">
                <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="opacity-20"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${downloadProgress * 0.628} 100`}
                    strokeLinecap="round"
                    className="text-primary transition-all duration-300"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
                  {downloadProgress}
                </span>
              </div>
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>
        )}
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
        {currentTrack.videoId && (
          <button 
            onClick={onAmbientModeClick}
            className="player-control"
            title="Ambient Mode"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}
        <button className="player-control">
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
