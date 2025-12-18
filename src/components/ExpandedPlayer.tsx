import { X, ChevronDown, SkipBack, SkipForward, Play, Pause, Shuffle, Repeat, Heart, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { LyricsData, LyricsProvider } from "@/hooks/useYouTubeMusic";
import { ExpandedLyrics } from "@/components/ExpandedLyrics";

interface Track {
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: number;
  videoId?: string;
}

interface ExpandedPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onProgressChange: (value: number[]) => void;
  isLiked: boolean;
  onLikeToggle: () => void;
  isBuffering?: boolean;
  lyricsData: LyricsData | null;
  currentTime: number;
  onSeek: (time: number) => void;
  provider: LyricsProvider;
  onProviderChange: (provider: LyricsProvider) => void;
  isLoadingLyrics: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ExpandedPlayer({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  progress,
  onPlayPause,
  onNext,
  onPrevious,
  onProgressChange,
  isLiked,
  onLikeToggle,
  isBuffering,
  lyricsData,
  currentTime,
  onSeek,
  provider,
  onProviderChange,
  isLoadingLyrics,
}: ExpandedPlayerProps) {
  if (!isOpen || !currentTrack) return null;

  const currentTimeSeconds = (progress / 100) * currentTrack.duration;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Now Playing</p>
          <p className="font-medium">{currentTrack.title}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Album Art Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative max-w-[500px] w-full aspect-square">
            <img
              src={currentTrack.image}
              alt={currentTrack.title}
              className="w-full h-full object-cover rounded-lg shadow-2xl"
            />
          </div>
        </div>

        {/* Lyrics Section */}
        <div className="w-[400px] border-l border-border/30 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-border/30">
            <button className="flex-1 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
              UP NEXT
            </button>
            <button className="flex-1 py-3 text-sm text-foreground font-medium border-b-2 border-primary">
              LYRICS
            </button>
            <button className="flex-1 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
              RELATED
            </button>
          </div>

          {/* Provider indicator */}
          <div className="px-4 py-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              ⊙ {provider === 'lrclib' ? 'LRCLib' : provider === 'musixmatch' ? 'Musixmatch' : 'YouTube'} ☆
            </span>
          </div>

          {/* Lyrics Content */}
          <div className="flex-1 overflow-hidden">
            {isLoadingLyrics ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : lyricsData?.synced && lyricsData?.lyrics ? (
              <ExpandedLyrics
                lyrics={lyricsData.lyrics}
                currentTime={currentTime}
                onSeek={onSeek}
              />
            ) : lyricsData?.plainLyrics ? (
              <div className="p-6 overflow-y-auto h-full">
                <p className="text-foreground/70 whitespace-pre-line leading-relaxed">
                  {lyricsData.plainLyrics}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <span className="text-4xl mb-4">♪</span>
                <p>No lyrics available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-8 pb-6 pt-4">
        {/* Track Info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{currentTrack.title}</h2>
            <p className="text-muted-foreground">{currentTrack.artist}</p>
          </div>
          <button
            onClick={onLikeToggle}
            className={cn("p-2 rounded-full hover:bg-muted transition-colors", isLiked && "text-primary")}
          >
            <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[progress]}
            onValueChange={onProgressChange}
            max={100}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{formatTime(currentTimeSeconds)}</span>
            <span className="text-xs text-muted-foreground">{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-6">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Shuffle className="w-5 h-5" />
          </button>
          <button onClick={onPrevious} className="p-2 hover:bg-muted rounded-full transition-colors">
            <SkipBack className="w-6 h-6 fill-current" />
          </button>
          <button
            onClick={onPlayPause}
            className="p-4 bg-foreground text-background rounded-full hover:scale-105 transition-transform"
          >
            {isBuffering ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>
          <button onClick={onNext} className="p-2 hover:bg-muted rounded-full transition-colors">
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Repeat className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
