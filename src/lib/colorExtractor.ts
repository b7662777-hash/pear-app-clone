import ColorThief from 'colorthief';

export interface ColorPalette {
  dominant: string;
  palette: string[];
  rgbPalette: [number, number, number][];
}

// Cache for extracted colors to avoid re-processing
const colorCache = new Map<string, ColorPalette>();

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
 * Get a proxy-friendly URL for cross-origin images
 */
function getProxiedImageUrl(url: string): string {
  // YouTube thumbnails are already CORS-friendly
  if (url.includes('img.youtube.com') || url.includes('i.ytimg.com')) {
    return url;
  }
  // For other sources, try using a CORS proxy or return original
  return url;
}

/**
 * Extract dominant colors from an image URL using ColorThief
 */
export async function extractColors(imageUrl: string): Promise<ColorPalette> {
  // Check cache first
  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        
        // Get dominant color
        const dominantRgb = colorThief.getColor(img) as [number, number, number];
        
        // Get palette of 5 colors
        const paletteRgb = colorThief.getPalette(img, 5) as [number, number, number][];
        
        const result: ColorPalette = {
          dominant: rgbToHsl(dominantRgb[0], dominantRgb[1], dominantRgb[2]),
          palette: paletteRgb.map(rgb => rgbToHsl(rgb[0], rgb[1], rgb[2])),
          rgbPalette: paletteRgb,
        };
        
        // Cache the result
        colorCache.set(imageUrl, result);
        
        resolve(result);
      } catch (error) {
        console.warn('ColorThief extraction failed:', error);
        // Return fallback colors
        resolve(getFallbackPalette());
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image for color extraction:', imageUrl);
      resolve(getFallbackPalette());
    };

    // Set timeout for loading
    setTimeout(() => {
      if (!img.complete) {
        console.warn('Image load timeout for color extraction');
        resolve(getFallbackPalette());
      }
    }, 5000);

    img.src = getProxiedImageUrl(imageUrl);
  });
}

/**
 * Get fallback colors when extraction fails
 */
function getFallbackPalette(): ColorPalette {
  return {
    dominant: 'hsl(0, 0%, 20%)',
    palette: [
      'hsl(0, 0%, 20%)',
      'hsl(0, 0%, 15%)',
      'hsl(0, 0%, 25%)',
      'hsl(0, 0%, 30%)',
      'hsl(0, 0%, 10%)',
    ],
    rgbPalette: [
      [51, 51, 51],
      [38, 38, 38],
      [64, 64, 64],
      [77, 77, 77],
      [26, 26, 26],
    ],
  };
}

/**
 * Generate CSS gradient strings from a color palette
 */
export function generateGradientStyles(palette: ColorPalette): {
  primaryGradient: string;
  secondaryGradient: string;
  accentGlow: string;
} {
  const [c1, c2, c3, c4, c5] = palette.rgbPalette;
  
  return {
    primaryGradient: `radial-gradient(ellipse at 20% 20%, ${rgbToRgba(c1, 0.4)} 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 80%, ${rgbToRgba(c2, 0.3)} 0%, transparent 50%)`,
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
