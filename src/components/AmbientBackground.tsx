import { useState, useEffect, useMemo } from 'react';
import { usePlayer } from "@/contexts/PlayerContext";
import { extractColors, generateGradientStyles, DynamicTheme } from "@/lib/colorExtractor";
import { useContrastColor } from "@/hooks/useContrastColor";

function getHDThumbnail(thumbnail: string, videoId?: string): string {
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return thumbnail.replace('w120-h120', 'w544-h544').replace('w60-h60', 'w544-h544');
}

export function AmbientBackground() {
  const { currentTrack } = usePlayer();
  const [theme, setTheme] = useState<DynamicTheme | null>(null);
  const [prevTheme, setPrevTheme] = useState<DynamicTheme | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [colorExtractionEnabled, setColorExtractionEnabled] = useState(true);

  // Use contrast color hook for accessibility
  useContrastColor(theme);

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
      setTheme(null);
      return;
    }

    const hdImage = getHDThumbnail(currentTrack.image, currentTrack.videoId);
    
    extractColors(hdImage).then((extractedTheme) => {
      // Save previous theme for transition
      if (theme) {
        setPrevTheme(theme);
        setIsTransitioning(true);
      }
      
      setTheme(extractedTheme);
      
      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        setPrevTheme(null);
      }, 2000);
    });
  }, [currentTrack, colorExtractionEnabled]);

  // Generate gradient styles
  const gradients = useMemo(() => {
    if (!theme) return null;
    return generateGradientStyles(theme);
  }, [theme]);

  if (!currentTrack) return null;

  const hdImage = getHDThumbnail(currentTrack.image, currentTrack.videoId);

  // Build multi-stop radial gradient from theme colors
  const multiStopGradient = theme ? `
    radial-gradient(ellipse 80% 60% at 15% 15%, ${theme.vibrant.replace(')', ', 0.45)')} 0%, transparent 55%),
    radial-gradient(ellipse 70% 70% at 85% 85%, ${theme.darkVibrant.replace(')', ', 0.4)')} 0%, transparent 50%),
    radial-gradient(ellipse 60% 50% at 50% 50%, ${theme.muted.replace(')', ', 0.3)')} 0%, transparent 45%),
    radial-gradient(ellipse 50% 40% at 75% 25%, ${theme.lightVibrant.replace(')', ', 0.2)')} 0%, transparent 40%)
  ` : '';

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Primary ambient layer - large blurred background */}
      <div 
        className="absolute inset-[-100px] transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ 
          backgroundImage: `url(${hdImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'blur(100px) saturate(1.8) brightness(0.6)',
          transform: 'scale(1.3)',
        }}
      />
      
      {/* Secondary ambient layer - creates depth with animation */}
      <div 
        className="absolute inset-[-150px] animate-ambient-breathe transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ 
          backgroundImage: `url(${hdImage})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          filter: 'blur(140px) saturate(2) brightness(0.4)',
          transform: 'scale(1.5)',
          opacity: 0.6,
        }}
      />
      
      {/* Multi-stop radial gradient canvas from extracted colors */}
      {theme && (
        <div 
          className="absolute inset-0 transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] animate-gradient-shift"
          style={{ 
            background: multiStopGradient,
          }}
        />
      )}
      
      {/* Primary color gradient layer with pulse */}
      {gradients && (
        <>
          <div 
            className="absolute inset-0 transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] animate-ambient-pulse"
            style={{ 
              background: gradients.primaryGradient,
            }}
          />
          
          {/* Secondary color gradient layer */}
          <div 
            className="absolute inset-0 transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] animate-ambient-drift"
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
        </>
      )}
      
      {/* Fallback when ColorThief is disabled */}
      {!gradients && (
        <div 
          className="absolute inset-0 transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ 
            backgroundImage: `url(${hdImage})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center',
            filter: 'blur(200px) saturate(2) brightness(0.4)',
            opacity: 0.4,
          }}
        />
      )}
      
      {/* Dark gradient overlay for content readability - enhanced */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70" />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0" style={{ 
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.5) 100%)' 
      }} />
      
      {/* Inner shadow for depth */}
      <div className="absolute inset-0" style={{
        boxShadow: 'inset 0 0 200px 50px rgba(0,0,0,0.3)'
      }} />
    </div>
  );
}
