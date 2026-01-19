import { ChevronLeft, ChevronRight } from "lucide-react";
import { AlbumCard } from "./AlbumCard";
import { useRef } from "react";

interface Album {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

interface AlbumSectionProps {
  title: string;
  subtitle?: string;
  albums: Album[];
  onAlbumClick: (album: Album) => void;
}

export function AlbumSection({ title, subtitle, albums, onAlbumClick }: AlbumSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="animate-slide-up">
      <div className="flex items-end justify-between mb-4">
        <div>
          {subtitle && (
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {subtitle}
            </span>
          )}
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-card hover:bg-accent transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-card hover:bg-accent transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
      >
        {albums.map((album) => (
          <div key={album.id} className="flex-shrink-0 w-[180px] snap-start">
            <AlbumCard
              title={album.title}
              subtitle={album.subtitle}
              image={album.image}
              onClick={() => onAlbumClick(album)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
