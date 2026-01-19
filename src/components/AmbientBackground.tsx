import { usePlayer } from "@/contexts/PlayerContext";

export function AmbientBackground() {
  const { currentTrack } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div 
        className="absolute inset-[-150px] opacity-40 blur-[100px] scale-125 animate-ambient-drift transition-all duration-1000"
        style={{ backgroundImage: `url(${currentTrack.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div 
        className="absolute inset-[-250px] opacity-30 blur-[140px] scale-150 animate-ambient-drift-reverse transition-all duration-1000"
        style={{ backgroundImage: `url(${currentTrack.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="absolute inset-0 bg-background/60" />
    </div>
  );
}