import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { optimizeImageUrl } from "@/lib/imageUtils";

interface Album {
  id: string;
  title: string;
  artist: string;
  image: string;
  videoId?: string;
}

interface SimilarToSectionProps {
  title: string;
  subtitle?: string;
  featuredImage?: string;
  albums: Album[];
  onAlbumClick: (album: Album) => void;
}

export function SimilarToSection({ 
  title, 
  subtitle = "SIMILAR TO",
  featuredImage,
  albums, 
  onAlbumClick 
}: SimilarToSectionProps) {
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
  }, [albums]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (albums.length === 0) return null;

  return (
    <section className="mb-8 min-h-[284px]">
      {/* Header with featured image and title */}
      <div className="flex items-start gap-4 mb-4">
        {featuredImage && (
          <img 
            src={optimizeImageUrl(featuredImage, 64)} 
            alt="" 
            className="w-14 h-14 rounded object-cover"
          />
        )}
        <div className="flex-1">
          <span className="text-xs text-white/50 uppercase tracking-wide font-medium">{subtitle}</span>
          <h2 className="text-2xl font-bold text-white leading-tight">{title}</h2>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center gap-1 self-end">
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

      {/* Album scroll */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
      >
        {albums.map((album) => (
          <div 
            key={album.id} 
            onClick={() => onAlbumClick(album)}
            className="flex-shrink-0 w-[160px] group cursor-pointer"
          >
            <div className="relative aspect-square rounded overflow-hidden mb-2">
              <img
                src={optimizeImageUrl(album.image, 226)}
                alt={album.title}
                className="w-full h-full object-cover"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  className="w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg"
                  aria-label={`Play ${album.title}`}
                >
                  <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                </button>
              </div>
            </div>
            <h3 className="text-sm font-medium text-white truncate">{album.title}</h3>
            <p className="text-xs text-white/50 truncate">{album.artist}</p>
          </div>
        ))}
      </div>
    </section>
  );
}