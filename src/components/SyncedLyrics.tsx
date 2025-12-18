import { useEffect, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { SyncedLyricLine } from "@/hooks/useYouTubeMusic";

interface SyncedLyricsProps {
  lyrics: SyncedLyricLine[];
  currentTime: number;
  onSeek?: (time: number) => void;
}

export const SyncedLyrics = forwardRef<HTMLDivElement, SyncedLyricsProps>(
  function SyncedLyrics({ lyrics, currentTime, onSeek }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeLineRef = useRef<HTMLDivElement>(null);

    // Find current active line index
    const activeIndex = lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });

    // Auto-scroll to active line
    useEffect(() => {
      if (activeLineRef.current && containerRef.current) {
        const container = containerRef.current;
        const activeLine = activeLineRef.current;
        
        const containerRect = container.getBoundingClientRect();
        const lineRect = activeLine.getBoundingClientRect();
        
        // Calculate the position to center the active line
        const scrollOffset = lineRect.top - containerRect.top - containerRect.height / 3;
        
        container.scrollTo({
          top: container.scrollTop + scrollOffset,
          behavior: "smooth",
        });
      }
    }, [activeIndex]);

    return (
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        <div className="py-6 px-4 space-y-4">
          {lyrics.map((line, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;
            
            return (
              <div
                key={`${line.time}-${index}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek?.(line.time)}
                className={cn(
                  "text-lg font-medium leading-relaxed cursor-pointer transition-all duration-300",
                  isActive && "text-foreground text-xl",
                  isPast && "text-muted-foreground/40",
                  !isActive && !isPast && "text-muted-foreground/60 hover:text-muted-foreground"
                )}
              >
                {line.text || "♪"}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
