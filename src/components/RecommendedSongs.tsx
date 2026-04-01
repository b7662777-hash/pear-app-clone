import { Play, Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/imageUtils";
import { YouTubeTrack } from "@/hooks/useYouTubeMusic";
import { useRef, useState, useEffect } from "react";

interface RecommendedSongsProps {
  tracks: YouTubeTrack[];
  isLoading: boolean;
  onTrackClick: (track: YouTubeTrack) => void;
  onDownloadClick?: (track: YouTubeTrack) => void;
  isDownloading?: boolean;
  currentVideoId?: string;
  title?: string;
  subtitle?: string;
}

export function RecommendedSongs({ 
  tracks, 
  isLoading, 
  onTrackClick,
  onDownloadClick,
  isDownloading,
  currentVideoId,
  title = "Recommended for you",
  subtitle = "Based on what's popular",
}: RecommendedSongsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [tracks]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mb-10 min-h-[284px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[28px] font-bold text-white">{title}</h2>
            <p className="text-sm text-white/50">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      </div>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <section className="mb-10 min-h-[284px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[28px] font-bold text-white">{title}</h2>
          <p className="text-sm text-white/50">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-2 rounded-full hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <button 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-2 rounded-full hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
      >
        {tracks.map((track, index) => {
          const isPlaying = track.videoId === currentVideoId;
          
          return (
            <div
              key={track.videoId}
              onClick={() => onTrackClick(track)}
              className="group cursor-pointer flex-shrink-0 w-[180px]"
            >
              <div className="relative aspect-square rounded overflow-hidden mb-2">
                <img
                  src={optimizeImageUrl(track.thumbnail, 226)}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  loading={index < 6 ? "eager" : "lazy"}
                  fetchPriority={index < 6 ? "high" : "auto"}
                />
                <div className={cn(
                  "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity",
                  isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                  {isPlaying ? (
                    <div className="flex items-end gap-0.5 h-6" aria-label="Currently playing">
                      <div className="w-1 bg-white animate-equalizer" />
                      <div className="w-1 bg-white animate-equalizer animation-delay-100" />
                      <div className="w-1 bg-white animate-equalizer animation-delay-200" />
                    </div>
                  ) : (
                    <button 
                      className="w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg"
                      aria-label={`Play ${track.title}`}
                      onClick={(e) => { e.stopPropagation(); onTrackClick(track); }}
                    >
                      <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                    </button>
                  )}
                </div>
              </div>
              
              <h3 className={cn(
                "text-sm font-medium truncate",
                isPlaying ? "text-white" : "text-white"
              )}>
                {track.title}
              </h3>
              <p className="text-xs text-white/50 truncate">
                {track.artist}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
