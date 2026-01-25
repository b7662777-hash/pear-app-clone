import { useEffect, useState } from 'react';
import { DynamicTheme } from '@/lib/colorExtractor';

interface ContrastColors {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  isLightBackground: boolean;
}

export function useContrastColor(theme: DynamicTheme | null): ContrastColors {
  const [colors, setColors] = useState<ContrastColors>({
    textPrimary: 'white',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    isLightBackground: false,
  });

  useEffect(() => {
    if (!theme) {
      return;
    }

    const isLight = theme.luminance > 0.4;
    
    const newColors = {
      textPrimary: isLight ? 'rgba(0, 0, 0, 0.9)' : 'white',
      textSecondary: isLight ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
      textMuted: isLight ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
      isLightBackground: isLight,
    };
    
    setColors(newColors);

    // Update CSS custom properties for global access
    document.documentElement.style.setProperty('--dynamic-text-primary', newColors.textPrimary);
    document.documentElement.style.setProperty('--dynamic-text-secondary', newColors.textSecondary);
    document.documentElement.style.setProperty('--dynamic-text-muted', newColors.textMuted);
  }, [theme]);

  return colors;
}
