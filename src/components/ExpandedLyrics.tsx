import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SyncedLyricLine } from "@/hooks/useYouTubeMusic";

interface ExpandedLyricsProps {
  lyrics: SyncedLyricLine[];
  currentTime: number;
  onSeek?: (time: number) => void;
}

export function ExpandedLyrics({ lyrics, currentTime, onSeek }: ExpandedLyricsProps) {
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
      className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent px-6"
    >
      <div className="py-8 space-y-8">
        {lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;
          
          return (
            <div
              key={`${line.time}-${index}`}
              ref={isActive ? activeLineRef : null}
              onClick={() => onSeek?.(line.time)}
              className={cn(
                "text-2xl font-semibold leading-relaxed cursor-pointer transition-all duration-300 text-left",
                isActive && "text-white text-3xl",
                isPast && "text-white/30",
                !isActive && !isPast && "text-white/50 hover:text-white/70"
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
