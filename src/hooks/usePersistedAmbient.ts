import { useState, useEffect, useCallback } from 'react';
import { DynamicTheme } from '@/lib/colorExtractor';

const STORAGE_KEY = 'ambient_theme';

// Deep Sea default gradient (Indigo + Purple)
export const DEEP_SEA_THEME: DynamicTheme = {
  dominant: 'hsl(250, 60%, 30%)',
  palette: [
    'hsl(250, 60%, 30%)',
    'hsl(270, 50%, 25%)',
    'hsl(260, 55%, 35%)',
    'hsl(280, 45%, 40%)',
    'hsl(240, 50%, 20%)',
  ],
  rgbPalette: [
    [64, 51, 122],   // Indigo
    [82, 51, 96],    // Purple
    [89, 64, 138],   // Light indigo
    [122, 82, 147],  // Light purple
    [41, 41, 82],    // Dark indigo
  ],
  vibrant: 'hsl(260, 65%, 55%)',
  muted: 'hsl(270, 35%, 35%)',
  darkVibrant: 'hsl(250, 55%, 22%)',
  lightVibrant: 'hsl(280, 55%, 65%)',
  luminance: 0.12,
  textColor: 'white',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  accentGlow: 'rgba(120, 80, 200, 0.4)',
};

interface PersistedAmbientState {
  theme: DynamicTheme;
  trackId?: string;
  timestamp: number;
}

interface UsePersistedAmbientReturn {
  theme: DynamicTheme;
  setTheme: (theme: DynamicTheme, trackId?: string) => void;
  isDefault: boolean;
}

export function usePersistedAmbient(): UsePersistedAmbientReturn {
  const [state, setState] = useState<PersistedAmbientState>(() => {
    // Initialize from localStorage or use default
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PersistedAmbientState;
        // Validate the stored theme has required properties
        if (parsed.theme && parsed.theme.vibrant && parsed.theme.rgbPalette) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load persisted ambient theme:', e);
    }
    
    // Return Deep Sea default
    return {
      theme: DEEP_SEA_THEME,
      timestamp: Date.now(),
    };
  });

  const [isDefault, setIsDefault] = useState(() => {
    try {
      return !localStorage.getItem(STORAGE_KEY);
    } catch {
      return true;
    }
  });

  // Save theme to localStorage whenever it changes
  const setTheme = useCallback((theme: DynamicTheme, trackId?: string) => {
    const newState: PersistedAmbientState = {
      theme,
      trackId,
      timestamp: Date.now(),
    };
    
    setState(newState);
    setIsDefault(false);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.warn('Failed to persist ambient theme:', e);
    }
  }, []);

  return {
    theme: state.theme,
    setTheme,
    isDefault,
  };
}
