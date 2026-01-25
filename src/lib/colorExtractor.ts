import ColorThief from 'colorthief';

export interface ColorPalette {
  dominant: string;
  palette: string[];
  rgbPalette: [number, number, number][];
}

export interface DynamicTheme extends ColorPalette {
  vibrant: string;
  muted: string;
  darkVibrant: string;
  lightVibrant: string;
  luminance: number;
  textColor: 'white' | 'black';
  textSecondary: string;
  accentGlow: string;
}

// Cache for extracted colors to avoid re-processing
const colorCache = new Map<string, DynamicTheme>();

/**
 * Convert RGB array to CSS HSL string for better theme integration
 */
function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

/**
 * Convert RGB array to CSS rgba string
 */
function rgbToRgba(rgb: [number, number, number], alpha: number = 1): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

/**
 * Calculate relative luminance for WCAG contrast
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate saturation of a color
 */
function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;
  if (max === min) return 0;
  const d = (max - min) / 255;
  return l > 0.5 ? d / (2 - max / 255 - min / 255) : d / (max / 255 + min / 255);
}

/**
 * Calculate brightness
 */
function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000 / 255;
}

/**
 * Categorize colors into vibrant/muted/dark/light variants
 */
function categorizeColors(palette: [number, number, number][]): {
  vibrant: string;
  muted: string;
  darkVibrant: string;
  lightVibrant: string;
} {
  const analyzed = palette.map(([r, g, b]) => ({
    rgb: [r, g, b] as [number, number, number],
    hsl: rgbToHsl(r, g, b),
    luminance: getLuminance(r, g, b),
    saturation: getSaturation(r, g, b),
    brightness: getBrightness(r, g, b),
  }));

  // Sort by saturation for vibrant/muted
  const bySaturation = [...analyzed].sort((a, b) => b.saturation - a.saturation);
  
  // Sort by brightness for light/dark
  const byBrightness = [...analyzed].sort((a, b) => b.brightness - a.brightness);

  // Find vibrant (high saturation, medium brightness)
  const vibrant = bySaturation.find(c => c.saturation > 0.3 && c.brightness > 0.2 && c.brightness < 0.8)
    || bySaturation[0];

  // Find muted (lower saturation)
  const muted = bySaturation.find(c => c.saturation < 0.5 && c.saturation > 0.1)
    || bySaturation[bySaturation.length - 1];

  // Find dark vibrant (saturated but dark)
  const darkVibrant = analyzed.find(c => c.saturation > 0.2 && c.brightness < 0.4)
    || byBrightness[byBrightness.length - 1];

  // Find light vibrant (saturated but light)
  const lightVibrant = analyzed.find(c => c.saturation > 0.2 && c.brightness > 0.6)
    || byBrightness[0];

  return {
    vibrant: vibrant.hsl,
    muted: muted.hsl,
    darkVibrant: darkVibrant.hsl,
    lightVibrant: lightVibrant.hsl,
  };
}

/**
 * Get a proxy-friendly URL for cross-origin images
 */
function getProxiedImageUrl(url: string): string {
  // YouTube thumbnails are already CORS-friendly
  if (url.includes('img.youtube.com') || url.includes('i.ytimg.com')) {
    return url;
  }
  return url;
}

/**
 * Get fallback theme when extraction fails
 */
function getFallbackTheme(): DynamicTheme {
  return {
    dominant: 'hsl(270, 30%, 25%)',
    palette: [
      'hsl(270, 30%, 25%)',
      'hsl(260, 25%, 20%)',
      'hsl(280, 35%, 30%)',
      'hsl(250, 20%, 15%)',
      'hsl(290, 40%, 35%)',
    ],
    rgbPalette: [
      [64, 45, 82],
      [51, 38, 64],
      [77, 50, 99],
      [38, 31, 46],
      [99, 53, 125],
    ],
    vibrant: 'hsl(280, 50%, 50%)',
    muted: 'hsl(270, 20%, 30%)',
    darkVibrant: 'hsl(260, 40%, 20%)',
    lightVibrant: 'hsl(290, 60%, 70%)',
    luminance: 0.15,
    textColor: 'white',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    accentGlow: 'rgba(180, 100, 200, 0.4)',
  };
}

/**
 * Extract dominant colors from an image URL using ColorThief with enhanced categorization
 */
export async function extractColors(imageUrl: string): Promise<DynamicTheme> {
  // Check cache first
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        
        // Get dominant color
        const dominantRgb = colorThief.getColor(img) as [number, number, number];
        
        // Get palette of 8 colors for better categorization
        const paletteRgb = colorThief.getPalette(img, 8) as [number, number, number][];
        
        if (!paletteRgb || paletteRgb.length < 5) {
          resolve(getFallbackTheme());
          return;
        }

        // Categorize colors
        const categorized = categorizeColors(paletteRgb);
        
        // Calculate luminance for contrast detection
        const luminance = getLuminance(dominantRgb[0], dominantRgb[1], dominantRgb[2]);
        
        // Calculate average luminance of top colors for text contrast
        const avgLuminance = paletteRgb.slice(0, 3).reduce((acc, [r, g, b]) => 
          acc + getLuminance(r, g, b), 0) / 3;
        
        const textColor: 'white' | 'black' = avgLuminance > 0.4 ? 'black' : 'white';
        const textSecondary = textColor === 'white' 
          ? 'rgba(255, 255, 255, 0.6)' 
          : 'rgba(0, 0, 0, 0.6)';

        // Create accent glow from first vibrant color
        const vibrantRgb = paletteRgb.find(([r, g, b]) => getSaturation(r, g, b) > 0.3) || paletteRgb[0];
        const accentGlow = rgbToRgba(vibrantRgb, 0.4);

        const result: DynamicTheme = {
          dominant: rgbToHsl(dominantRgb[0], dominantRgb[1], dominantRgb[2]),
          palette: paletteRgb.slice(0, 5).map(rgb => rgbToHsl(rgb[0], rgb[1], rgb[2])),
          rgbPalette: paletteRgb.slice(0, 5) as [number, number, number][],
          ...categorized,
          luminance,
          textColor,
          textSecondary,
          accentGlow,
        };
        
        // Cache the result
        colorCache.set(imageUrl, result);
        
        // Limit cache size
        if (colorCache.size > 50) {
          const firstKey = colorCache.keys().next().value;
          if (firstKey) colorCache.delete(firstKey);
        }
        
        resolve(result);
      } catch (error) {
        console.warn('ColorThief extraction failed:', error);
        resolve(getFallbackTheme());
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image for color extraction:', imageUrl);
      resolve(getFallbackTheme());
    };

    // Set timeout for loading
    setTimeout(() => {
      if (!img.complete) {
        console.warn('Image load timeout for color extraction');
        resolve(getFallbackTheme());
      }
    }, 5000);

    img.src = getProxiedImageUrl(imageUrl);
  });
}

/**
 * Generate CSS gradient strings from a dynamic theme
 */
export function generateGradientStyles(theme: DynamicTheme): {
  primaryGradient: string;
  secondaryGradient: string;
  accentGlow: string;
} {
  const [c1, c2, c3, c4, c5] = theme.rgbPalette;
  
  return {
    primaryGradient: `radial-gradient(ellipse at 20% 20%, ${rgbToRgba(c1, 0.4)} 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 80%, ${rgbToRgba(c2, 0.35)} 0%, transparent 50%)`,
    secondaryGradient: `radial-gradient(ellipse at 60% 30%, ${rgbToRgba(c3, 0.25)} 0%, transparent 40%),
                        radial-gradient(ellipse at 30% 70%, ${rgbToRgba(c4, 0.2)} 0%, transparent 45%)`,
    accentGlow: `radial-gradient(ellipse at center, ${rgbToRgba(c5 || c1, 0.15)} 0%, transparent 70%)`,
  };
}

/**
 * Clear the color cache (useful for memory management)
 */
export function clearColorCache(): void {
  colorCache.clear();
}
