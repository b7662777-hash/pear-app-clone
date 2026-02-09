import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { optimizeImageUrl } from "@/lib/imageUtils";
import { useAuth } from "@/hooks/useAuth";

interface Track {
  id: string;
  title: string;
  artist: string;
  image: string;
  videoId?: string;
  type?: string;
  views?: string;
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
  const { profile, user } = useAuth();

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'BLUE SUN';

  // Preload LCP images for better discovery
  useEffect(() => {
    const preloadLinks: HTMLLinkElement[] = [];
    
    if (tracks[0]?.image) {
      const imageUrl = optimizeImageUrl(tracks[0].image, 226);
      const existingPreload = document.querySelector(`link[rel="preload"][href="${imageUrl}"]`);
      
      if (!existingPreload) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = imageUrl;
        preloadLink.setAttribute('fetchpriority', 'high');
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

  const displayTracks = tracks.slice(0, 12);

  return (
    <section className="mb-8">
      {/* Header with avatar, title, and navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {featuredTrack && (
            <img 
              src={optimizeImageUrl(featuredTrack.image, 48)} 
              alt="" 
              className="w-12 h-12 rounded object-cover"
            />
          )}
          <div>
            <span className="text-xs text-white/50 uppercase tracking-wide font-medium block">{displayName.toUpperCase()}</span>
            <h2 className="text-2xl font-bold text-white">Listen again</h2>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 rounded-full border border-white/20 text-sm font-medium text-white hover:bg-white/[0.05] transition-colors">
            More
          </button>
          <button 
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-2 rounded-full hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
          <button 
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-2 rounded-full hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Track grid - 6 columns */}
      <div 
        ref={scrollContainerRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      >
        {displayTracks.map((track, index) => (
          <div
            key={track.id}
            onClick={() => onTrackClick(track)}
            className="group relative cursor-pointer"
          >
            {/* Album art container */}
            <div className="relative aspect-square rounded overflow-hidden mb-2">
              <img
                src={optimizeImageUrl(track.image, 226)}
                alt={track.title}
                className="w-full h-full object-cover"
                loading={index < 2 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
              />
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                  aria-label={`Play ${track.title}`}
                >
                  <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                </button>
              </div>
            </div>
            
            {/* Track info */}
            <h3 className="text-sm font-medium text-white truncate">{track.title}</h3>
            <p className="text-xs text-white/50 truncate">
              {track.type || 'Song'} • {track.artist}{track.views ? ` • ${track.views}` : ''}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}