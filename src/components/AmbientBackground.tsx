import { useState, useEffect, useMemo } from 'react';
import { usePlayer } from "@/contexts/PlayerContext";
import { extractColors, generateGradientStyles, DynamicTheme } from "@/lib/colorExtractor";
import { useContrastColor } from "@/hooks/useContrastColor";
import { usePersistedAmbient, DEEP_SEA_THEME } from "@/hooks/usePersistedAmbient";

function getHDThumbnail(thumbnail: string, videoId?: string): string {
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return thumbnail.replace('w120-h120', 'w544-h544').replace('w60-h60', 'w544-h544');
}

export function AmbientBackground() {
  const { currentTrack } = usePlayer();
  const { theme: persistedTheme, setTheme: setPersistedTheme, isDefault } = usePersistedAmbient();
  const [theme, setTheme] = useState<DynamicTheme | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [colorExtractionEnabled, setColorExtractionEnabled] = useState(true);

  // Use current theme or persisted theme
  const activeTheme = theme || persistedTheme;

  // Use contrast color hook for accessibility
  useContrastColor(activeTheme);

  // Check localStorage for color extraction preference
  useEffect(() => {
    const enabled = localStorage.getItem('colorExtractionEnabled');
    if (enabled !== null) {
      setColorExtractionEnabled(enabled === 'true');
    }
  }, []);

  // Extract colors when track changes with smooth transition
  useEffect(() => {
    if (!currentTrack || !colorExtractionEnabled) {
      return;
    }

    const hdImage = getHDThumbnail(currentTrack.image, currentTrack.videoId);
    
    extractColors(hdImage).then((extractedTheme) => {
      setIsTransitioning(true);
      setTheme(extractedTheme);
      
      // Persist the theme for future sessions
      setPersistedTheme(extractedTheme, currentTrack.videoId);
      
      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 2000);
    });
  }, [currentTrack, colorExtractionEnabled, setPersistedTheme]);

  // Generate gradient styles from active theme
  const gradients = useMemo(() => {
    return generateGradientStyles(activeTheme);
  }, [activeTheme]);

  // Build multi-stop radial gradient from theme colors
  const multiStopGradient = useMemo(() => {
    const t = activeTheme;
    return `
      radial-gradient(ellipse 90% 70% at 10% 10%, ${t.vibrant.replace(')', ', 0.5)')} 0%, transparent 60%),
      radial-gradient(ellipse 80% 80% at 90% 90%, ${t.darkVibrant.replace(')', ', 0.45)')} 0%, transparent 55%),
      radial-gradient(ellipse 70% 60% at 50% 50%, ${t.muted.replace(')', ', 0.35)')} 0%, transparent 50%),
      radial-gradient(ellipse 60% 50% at 80% 20%, ${t.lightVibrant.replace(')', ', 0.25)')} 0%, transparent 45%),
      radial-gradient(ellipse 50% 40% at 20% 80%, ${t.vibrant.replace(')', ', 0.2)')} 0%, transparent 40%)
    `;
  }, [activeTheme]);

  // Get HD image for blur layers only if track is playing
  const hdImage = currentTrack 
    ? getHDThumbnail(currentTrack.image, currentTrack.videoId)
    : null;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base color layer - always visible from persisted/default theme */}
      <div 
        className="absolute inset-[-150px] transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ 
          background: `linear-gradient(135deg, ${activeTheme.darkVibrant} 0%, ${activeTheme.muted} 50%, ${activeTheme.vibrant} 100%)`,
          filter: 'blur(120px) saturate(1.8) brightness(0.5)',
          transform: 'scale(1.4)',
        }}
      />
      
      {/* Primary image blur layer - only when track is playing */}
      {hdImage && (
        <div 
          className="absolute inset-[-120px] transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] animate-ambient-drift"
          style={{ 
            backgroundImage: `url(${hdImage})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            filter: 'blur(120px) saturate(1.8) brightness(0.55)',
            transform: 'scale(1.35)',
          }}
        />
      )}
      
      {/* Secondary depth layer with breathing animation */}
      {hdImage && (
        <div 
          className="absolute inset-[-180px] animate-ambient-breathe transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ 
            backgroundImage: `url(${hdImage})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            filter: 'blur(150px) saturate(2) brightness(0.4)',
            transform: 'scale(1.6)',
            opacity: 0.5,
          }}
        />
      )}
      
      {/* Multi-stop radial gradient canvas from extracted colors */}
      <div 
        className="absolute inset-0 transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] animate-gradient-shift"
        style={{ 
          background: multiStopGradient,
        }}
      />
      
      {/* Primary color gradient layer with pulse */}
      <div 
        className="absolute inset-0 transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] animate-ambient-pulse"
        style={{ 
          background: gradients.primaryGradient,
        }}
      />
      
      {/* Secondary color gradient layer with drift */}
      <div 
        className="absolute inset-0 transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] animate-ambient-drift-reverse"
        style={{ 
          background: gradients.secondaryGradient,
        }}
      />
      
      {/* Accent glow layer */}
      <div 
        className="absolute inset-0 transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ 
          background: gradients.accentGlow,
        }}
      />
      
      {/* Dark gradient overlay for content readability - enhanced */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/75" />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0" style={{ 
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.55) 100%)' 
      }} />
      
      {/* Inner shadow for depth */}
      <div className="absolute inset-0" style={{
        boxShadow: 'inset 0 0 250px 80px rgba(0,0,0,0.35)'
      }} />
    </div>
  );
}
