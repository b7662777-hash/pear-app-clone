import { Play } from "lucide-react";
import { optimizeImageUrl } from "@/lib/imageUtils";

interface AlbumCardProps {
  title: string;
  subtitle: string;
  image: string;
  onClick: () => void;
}

export function AlbumCard({ title, subtitle, image, onClick }: AlbumCardProps) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer animate-fade-in"
    >
      {/* Album Art */}
      <div className="relative aspect-square rounded-md overflow-hidden mb-3">
        <img
          src={optimizeImageUrl(image, 200)}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button 
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform"
            aria-label={`Play ${title}`}
          >
            <Play className="w-5 h-5 text-black fill-black ml-0.5" />
          </button>
        </div>
      </div>

      {/* Album Info */}
      <h3 className="font-medium text-sm text-foreground truncate mb-0.5">{title}</h3>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
  );
}
