import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, X, Maximize2 } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from '@/components/ui/button';

interface MiniPlayerProps {
  onClose: () => void;
  onExpand: () => void;
}

export function MiniPlayer({ onClose, onExpand }: MiniPlayerProps) {
  const { currentTrack, isPlaying, playPause, next, previous } = usePlayer();
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('miniPlayerPosition');
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        setPosition(parsed);
      } catch (e) {
        console.warn('Failed to parse mini player position');
      }
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('miniPlayerPosition', JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 320, dragRef.current.startPosX + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.startPosY + deltaY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!currentTrack) return null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] bg-black/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl cursor-move select-none"
      style={{
        left: position.x,
        top: position.y,
        width: '320px',
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Album Art */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
          <img
            src={currentTrack.image}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-4">
                <div className="w-0.5 bg-primary animate-equalizer" style={{ animationDelay: '0ms' }} />
                <div className="w-0.5 bg-primary animate-equalizer" style={{ animationDelay: '150ms' }} />
                <div className="w-0.5 bg-primary animate-equalizer" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {currentTrack.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={previous}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 bg-primary/20 hover:bg-primary/30 text-primary"
            onClick={playPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={next}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onExpand}
            title="Expand"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-destructive/20 hover:text-destructive"
            onClick={onClose}
            title="Close Mini Player"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
