import { useState, useEffect } from 'react';
import { usePlayer } from "@/contexts/PlayerContext";
import { extractColors, generateGradientStyles, ColorPalette } from "@/lib/colorExtractor";

function getHDThumbnail(thumbnail: string, videoId?: string): string {
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return thumbnail.replace('w120-h120', 'w544-h544').replace('w60-h60', 'w544-h544');
}

export function AmbientBackground() {
  const { currentTrack } = usePlayer();
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [gradients, setGradients] = useState<ReturnType<typeof generateGradientStyles> | null>(null);
  const [colorExtractionEnabled, setColorExtractionEnabled] = useState(true);

  // Check localStorage for color extraction preference
  useEffect(() => {
    const enabled = localStorage.getItem('colorExtractionEnabled');
    if (enabled !== null) {
      setColorExtractionEnabled(enabled === 'true');
    }
  }, []);

  // Extract colors when track changes
  useEffect(() => {
    if (!currentTrack || !colorExtractionEnabled) {
      setPalette(null);
      setGradients(null);
      return;
    }

    const hdImage = getHDThumbnail(currentTrack.image, currentTrack.videoId);
    
    extractColors(hdImage).then((extractedPalette) => {
      setPalette(extractedPalette);
      setGradients(generateGradientStyles(extractedPalette));
    });
  }, [currentTrack, colorExtractionEnabled]);

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
      
      {/* ColorThief extracted color gradients */}
      {gradients && (
        <>
          {/* Primary color gradient layer */}
          <div 
            className="absolute inset-0 transition-all duration-1000 animate-ambient-pulse"
            style={{ 
              background: gradients.primaryGradient,
            }}
          />
          
          {/* Secondary color gradient layer */}
          <div 
            className="absolute inset-0 transition-all duration-1000 animate-ambient-drift"
            style={{ 
              background: gradients.secondaryGradient,
            }}
          />
          
          {/* Accent glow layer */}
          <div 
            className="absolute inset-0 transition-all duration-1000"
            style={{ 
              background: gradients.accentGlow,
            }}
          />
        </>
      )}
      
      {/* Color accent glow layer (fallback when ColorThief is disabled) */}
      {!gradients && (
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
      )}
      
      {/* Dark gradient overlay for content readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0" style={{ 
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)' 
      }} />
    </div>
  );
}
