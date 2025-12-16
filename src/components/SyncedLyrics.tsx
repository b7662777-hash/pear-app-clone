import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SyncedLyricLine } from "@/hooks/useYouTubeMusic";

interface SyncedLyricsProps {
  lyrics: SyncedLyricLine[];
  currentTime: number;
  onSeek?: (time: number) => void;
}

export function SyncedLyrics({ lyrics, currentTime, onSeek }: SyncedLyricsProps) {
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
      className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent px-2"
    >
      <div className="py-8 space-y-4">
        {lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;
          
          return (
            <div
              key={`${line.time}-${index}`}
              ref={isActive ? activeLineRef : null}
              onClick={() => onSeek?.(line.time)}
              className={cn(
                "text-base leading-relaxed cursor-pointer transition-all duration-300 px-2 py-1 rounded-md",
                isActive && "text-primary font-semibold text-lg scale-105 origin-left bg-primary/10",
                isPast && "text-muted-foreground/60",
                !isActive && !isPast && "text-foreground/80 hover:text-foreground hover:bg-muted/50"
              )}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
