import { useState, useEffect, useMemo, useRef } from 'react';
import { usePlayer } from "@/contexts/PlayerContext";
import { extractColors, getSolidBackgroundColor, DynamicTheme } from "@/lib/colorExtractor";
import { useContrastColor } from "@/hooks/useContrastColor";
import { usePersistedAmbient, DEEP_SEA_THEME } from "@/hooks/usePersistedAmbient";

export function AmbientBackground() {
  const { currentTrack } = usePlayer();
  const { theme: persistedTheme, setTheme: setPersistedTheme, isDefault } = usePersistedAmbient();
  const [theme, setTheme] = useState<DynamicTheme | null>(null);
  const [colorExtractionEnabled, setColorExtractionEnabled] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prevImageUrl, setPrevImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const activeTheme = theme || persistedTheme;

  useContrastColor(activeTheme);

  const solidBackground = useMemo(() => {
    return getSolidBackgroundColor(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    const enabled = localStorage.getItem('colorExtractionEnabled');
    if (enabled !== null) {
      setColorExtractionEnabled(enabled === 'true');
    }
  }, []);

  // Update image and extract colors when track changes
  useEffect(() => {
    if (!currentTrack || !colorExtractionEnabled) return;

    const newImageUrl = currentTrack.videoId
      ? `https://img.youtube.com/vi/${currentTrack.videoId}/maxresdefault.jpg`
      : currentTrack.image;

    // Preload the image before showing it
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      // If maxresdefault is a placeholder (120x90), fall back to hqdefault
      if (img.naturalWidth <= 120 && currentTrack.videoId) {
        const fallback = `https://img.youtube.com/vi/${currentTrack.videoId}/hqdefault.jpg`;
        const img2 = new Image();
        img2.crossOrigin = 'Anonymous';
        img2.onload = () => {
          setPrevImageUrl(imageUrl);
          setImageUrl(fallback);
          setImageLoaded(true);
        };
        img2.src = fallback;
      } else {
        setPrevImageUrl(imageUrl);
        setImageUrl(newImageUrl);
        setImageLoaded(true);
      }
    };
    img.onerror = () => {
      // Fallback to hqdefault
      if (currentTrack.videoId) {
        const fallback = `https://img.youtube.com/vi/${currentTrack.videoId}/hqdefault.jpg`;
        setPrevImageUrl(imageUrl);
        setImageUrl(fallback);
        setImageLoaded(true);
      }
    };
    img.src = newImageUrl;

    // Also extract colors for theme/contrast
    const colorUrl = currentTrack.videoId
      ? `https://img.youtube.com/vi/${currentTrack.videoId}/mqdefault.jpg`
      : currentTrack.image;

    extractColors(colorUrl).then((extractedTheme) => {
      setTheme(extractedTheme);
      setPersistedTheme(extractedTheme, currentTrack.videoId);
    });
  }, [currentTrack, colorExtractionEnabled, setPersistedTheme]);

  // Clear the previous image after transition
  useEffect(() => {
    if (prevImageUrl && imageLoaded) {
      const timer = setTimeout(() => setPrevImageUrl(null), 800);
      return () => clearTimeout(timer);
    }
  }, [prevImageUrl, imageLoaded]);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ backgroundColor: solidBackground }}
    >
      {/* Previous blurred image (fading out) */}
      {prevImageUrl && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{
            opacity: 0,
            backgroundImage: `url(${prevImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px) saturate(1.8) brightness(0.6)',
            transform: 'scale(1.3)',
          }}
        />
      )}

      {/* Current blurred album art — PearMusic style */}
      {imageUrl && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{
            opacity: imageLoaded ? 1 : 0,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(80px) saturate(1.8) brightness(0.6)',
            transform: 'scale(1.3)',
          }}
        />
      )}

      {/* Very subtle vignette for depth — not darkening the color */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.2) 100%)',
        }}
      />
    </div>
  );
}
