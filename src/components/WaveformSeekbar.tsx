import { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface WaveformSeekbarProps {
  progress: number; // 0-100
  duration: number;
  onSeek: (progress: number) => void;
  accentColor?: string;
  className?: string;
}

// Generate a pseudo-random waveform pattern based on seed
function generateWaveform(barCount: number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    // Create a wave-like pattern with some randomness
    const wave = Math.sin(i * 0.3) * 0.3 + 0.5;
    const noise = Math.sin(i * 1.7) * 0.15 + Math.sin(i * 2.3) * 0.1;
    const height = Math.max(0.2, Math.min(1, wave + noise));
    bars.push(height);
  }
  return bars;
}

export function WaveformSeekbar({
  progress,
  duration,
  onSeek,
  accentColor = 'hsl(var(--primary))',
  className,
}: WaveformSeekbarProps) {
  const barCount = 60;
  const waveform = useMemo(() => generateWaveform(barCount), []);
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newProgress = (x / rect.width) * 100;
    onSeek(Math.max(0, Math.min(100, newProgress)));
  }, [onSeek]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      onSeek(Math.max(0, progress - 1));
    } else if (e.key === 'ArrowRight') {
      onSeek(Math.min(100, progress + 1));
    }
  }, [progress, onSeek]);

  return (
    <div
      className={cn(
        "relative h-12 flex items-center gap-[2px] cursor-pointer group",
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="slider"
      aria-label="Seek position"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      tabIndex={0}
    >
      {waveform.map((height, index) => {
        const barProgress = (index / barCount) * 100;
        const isActive = barProgress <= progress;
        const isCurrentPosition = Math.abs(barProgress - progress) < (100 / barCount);
        
        return (
          <div
            key={index}
            className={cn(
              "flex-1 rounded-full transition-all duration-150",
              isActive ? "opacity-100" : "opacity-40",
              isCurrentPosition && "animate-pulse"
            )}
            style={{
              height: `${height * 100}%`,
              minHeight: '4px',
              maxHeight: '100%',
              backgroundColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.3)',
              boxShadow: isActive 
                ? `0 0 ${isCurrentPosition ? '12px' : '6px'} ${accentColor.replace(')', ', 0.5)').replace('hsl(', 'hsla(').replace('rgb(', 'rgba(')}`
                : 'none',
              transform: isCurrentPosition ? 'scaleY(1.15)' : 'scaleY(1)',
            }}
          />
        );
      })}
      
      {/* Hover glow effect */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor.replace(')', ', 0.1)').replace('hsl(', 'hsla(')} ${progress}%, transparent ${progress + 2}%)`,
        }}
      />
    </div>
  );
}
