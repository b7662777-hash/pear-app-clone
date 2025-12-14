import { Play } from "lucide-react";

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
      className="music-card group p-4 animate-fade-in"
    >
      {/* Album Art */}
      <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Play Button Overlay */}
        <div className="play-overlay rounded-lg">
          <button className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground ml-1" />
          </button>
        </div>
      </div>

      {/* Album Info */}
      <h3 className="font-medium text-foreground truncate mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
    </div>
  );
}
