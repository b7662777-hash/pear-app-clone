import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { optimizeImageUrl } from "@/lib/imageUtils";

interface Track {
  id: string;
  title: string;
  artist: string;
  image: string;
  videoId?: string;
}

interface ListenAgainSectionProps {
  tracks: Track[];
  featuredTrack?: Track | null;
  onTrackClick: (track: Track) => void;
}

export function ListenAgainSection({ tracks, featuredTrack, onTrackClick }: ListenAgainSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Preload LCP images for better discovery
  useEffect(() => {
    const preloadLinks: HTMLLinkElement[] = [];
    
    // Preload first track image for LCP
    if (tracks[0]?.image) {
      const imageUrl = optimizeImageUrl(tracks[0].image, 160);
      const existingPreload = document.querySelector(`link[rel="preload"][href="${imageUrl}"]`);
      
      if (!existingPreload) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = imageUrl;
        preloadLink.setAttribute('fetchpriority', 'high');
        preloadLink.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(preloadLink);
        preloadLinks.push(preloadLink);
      }
    }
    
    return () => {
      preloadLinks.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [tracks]);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [tracks]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (tracks.length === 0) return null;

  // Use all available tracks for the grid
  const displayTracks = tracks.slice(0, 12);

  return (
    <section className="mb-10">
      {/* Header with avatar, title, and navigation */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {featuredTrack && (
            <img 
              src={optimizeImageUrl(featuredTrack.image, 48)} 
              alt="" 
              className="w-12 h-12 rounded-lg object-cover ring-2 ring-white/[0.1]"
            />
          )}
          <div>
            <span className="text-xs text-white/40 uppercase tracking-wider font-medium">BLUE SUN</span>
            <h2 className="text-2xl font-bold text-foreground">Listen again</h2>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2">
          <button className="text-sm font-medium text-white/60 hover:text-white transition-colors px-3 py-1.5">
            More
          </button>
          <button 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-1.5 rounded-full hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <button 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-1.5 rounded-full hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Track grid - 6 columns on larger screens */}
      <div 
        ref={scrollContainerRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-x-auto scrollbar-hide"
      >
        {displayTracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => onTrackClick(track)}
            className="group relative cursor-pointer bg-[#1a1a1a] hover:bg-[#252525] rounded-xl p-3 transition-colors min-w-0"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
              <img
                src={optimizeImageUrl(track.image, 160)}
                alt={track.title}
                className="w-full h-full object-cover"
                loading={index < 2 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                crossOrigin={index === 0 ? "anonymous" : undefined}
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg"
                  aria-label={`Play ${track.title}`}
                >
                  <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                </button>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate">{track.title}</h3>
            <p className="text-xs text-white/50 truncate">
              Song • {track.artist}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
