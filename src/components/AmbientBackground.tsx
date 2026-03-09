import { useState, useEffect, useMemo } from 'react';
import { usePlayer } from "@/contexts/PlayerContext";
import { extractColors, getSolidBackgroundColor, DynamicTheme } from "@/lib/colorExtractor";
import { useContrastColor } from "@/hooks/useContrastColor";
import { usePersistedAmbient, DEEP_SEA_THEME } from "@/hooks/usePersistedAmbient";

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

  // Generate solid background color from theme
  const solidBackground = useMemo(() => {
    return getSolidBackgroundColor(activeTheme);
  }, [activeTheme]);

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

    // Use YouTube thumbnail for color extraction
    const imageUrl = currentTrack.videoId 
      ? `https://img.youtube.com/vi/${currentTrack.videoId}/mqdefault.jpg`
      : currentTrack.image;
    
    extractColors(imageUrl).then((extractedTheme) => {
      setIsTransitioning(true);
      setTheme(extractedTheme);
      
      // Persist the theme for future sessions
      setPersistedTheme(extractedTheme, currentTrack.videoId);
      
      // End transition after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    });
  }, [currentTrack, colorExtractionEnabled, setPersistedTheme]);

  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none transition-colors duration-[400ms] ease-in-out"
      style={{ backgroundColor: solidBackground }}
    >
      {/* Subtle vignette for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
        }}
      />
    </div>
  );
}
