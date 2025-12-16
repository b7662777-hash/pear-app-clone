import { X, Music } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SyncedLyrics } from "@/components/SyncedLyrics";
import { LyricsData } from "@/hooks/useYouTubeMusic";

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  lyricsData: LyricsData | null;
  isLoading: boolean;
  trackTitle?: string;
  trackArtist?: string;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

export function LyricsPanel({
  isOpen,
  onClose,
  lyricsData,
  isLoading,
  trackTitle,
  trackArtist,
  currentTime = 0,
  onSeek,
}: LyricsPanelProps) {
  if (!isOpen) return null;

  const hasSyncedLyrics = lyricsData?.synced && lyricsData?.lyrics;
  const hasPlainLyrics = lyricsData?.plainLyrics;

  return (
    <div className="fixed right-0 top-0 bottom-[72px] w-[350px] bg-card border-l border-border/50 z-40 flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Lyrics</span>
          {hasSyncedLyrics && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              Synced
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Track Info */}
      {(trackTitle || trackArtist) && (
        <div className="px-4 py-3 border-b border-border/30">
          <h3 className="font-semibold text-foreground truncate">{trackTitle}</h3>
          <p className="text-sm text-muted-foreground truncate">{trackArtist}</p>
        </div>
      )}

      {/* Lyrics Content */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 h-full">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading lyrics...</p>
          </div>
        ) : hasSyncedLyrics ? (
          <SyncedLyrics
            lyrics={lyricsData.lyrics!}
            currentTime={currentTime}
            onSeek={onSeek}
          />
        ) : hasPlainLyrics ? (
          <ScrollArea className="h-full">
            <div className="p-4">
              <p className="text-foreground whitespace-pre-line leading-relaxed text-sm">
                {lyricsData.plainLyrics}
              </p>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center h-full">
            <Music className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No lyrics available</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Lyrics are not available for this track
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
