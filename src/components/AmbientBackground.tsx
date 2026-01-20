import { usePlayer } from "@/contexts/PlayerContext";

function getHDThumbnail(thumbnail: string, videoId?: string): string {
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return thumbnail.replace('w120-h120', 'w544-h544').replace('w60-h60', 'w544-h544');
}

export function AmbientBackground() {
  const { currentTrack } = usePlayer();

  if (!currentTrack) return null;

  const hdImage = getHDThumbnail(currentTrack.image, currentTrack.videoId);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Primary ambient layer - large blurred background */}
      <div 
        className="absolute inset-[-100px] animate-ambient-drift transition-all duration-1000"
        style={{ 
          backgroundImage: `url(${hdImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'blur(80px) saturate(1.5) brightness(0.7)',
          transform: 'scale(1.3)',
        }}
      />
      
      {/* Secondary ambient layer - creates depth */}
      <div 
        className="absolute inset-[-150px] animate-ambient-drift-reverse transition-all duration-1000"
        style={{ 
          backgroundImage: `url(${hdImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'blur(120px) saturate(1.8) brightness(0.5)',
          transform: 'scale(1.5)',
          opacity: 0.6,
        }}
      />
      
      {/* Color accent glow layer */}
      <div 
        className="absolute inset-0 transition-all duration-1000"
        style={{ 
          backgroundImage: `url(${hdImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'blur(200px) saturate(2) brightness(0.4)',
          opacity: 0.4,
        }}
      />
      
      {/* Dark gradient overlay for content readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0" style={{ 
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)' 
      }} />
    </div>
  );
}