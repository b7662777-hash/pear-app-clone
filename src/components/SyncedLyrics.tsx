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
        <div className="py-6 px-4 space-y-2">
          {lyrics.map((line, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;
            const isFuture = index > activeIndex;
            
            // Calculate opacity based on distance from active line
            let opacity = 1;
            if (isFuture) {
              const distance = index - activeIndex;
              opacity = Math.max(0.3, 1 - distance * 0.12);
            } else if (isPast) {
              const distance = activeIndex - index;
              opacity = Math.max(0.2, 0.6 - distance * 0.08);
            }
            
            return (
              <div
                key={`${line.time}-${index}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => onSeek?.(line.time)}
                style={{ opacity: isActive ? 1 : opacity }}
                className={cn(
                  "text-lg leading-relaxed cursor-pointer transition-all duration-300 py-2 px-3 rounded-lg",
                  isActive && "text-primary font-bold text-2xl scale-[1.02] origin-left",
                  isPast && "text-foreground/50",
                  !isActive && !isPast && "text-foreground/70 hover:text-foreground/90 hover:bg-muted/20"
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
