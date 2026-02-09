import { useState, useEffect, useCallback } from 'react';
import { DynamicTheme } from '@/lib/colorExtractor';

const STORAGE_KEY = 'ambient_theme';

// Warm Wood default gradient (Olive + Brown)
export const DEEP_SEA_THEME: DynamicTheme = {
  dominant: 'hsl(39, 34%, 28%)',
  palette: [
    'hsl(39, 34%, 28%)',
    'hsl(35, 28%, 22%)',
    'hsl(42, 30%, 32%)',
    'hsl(30, 26%, 20%)',
    'hsl(45, 22%, 36%)',
  ],
  rgbPalette: [
    [93, 72, 40],    // Warm brown
    [74, 58, 33],    // Deep olive
    [112, 85, 51],   // Golden brown
    [64, 50, 30],    // Dark umber
    [126, 102, 65],  // Soft tan
  ],
  vibrant: 'hsl(38, 45%, 45%)',
  muted: 'hsl(34, 22%, 30%)',
  darkVibrant: 'hsl(34, 40%, 20%)',
  lightVibrant: 'hsl(40, 40%, 60%)',
  luminance: 0.18,
  textColor: 'white',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  accentGlow: 'rgba(120, 90, 45, 0.4)',
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
