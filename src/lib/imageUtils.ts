/**
 * Utility functions for optimizing image URLs
 */

/**
 * Optimizes Google/YouTube thumbnail URLs to request appropriate sizes
 * @param url - Original thumbnail URL
 * @param size - Desired size (width and height will be the same)
 * @returns Optimized URL
 */
export function optimizeGoogleThumbnail(url: string, size: number = 160): string {
  if (!url) return url;
  
  // Use exact size (no retina multiplier) to minimize payload
  const optimizedSize = size;
  
  // For Google/YouTube images (lh3.googleusercontent.com)
  if (url.includes('googleusercontent.com')) {
    // Check if URL has existing parameters
    const hasParams = url.includes('=');
    if (hasParams) {
      // Replace any existing size/quality parameters with optimized ones
      // -l40 sets quality to 40 for aggressive compression
      // -rw requests WebP format for modern browsers
      return url.replace(/=[^?&]+$/, `=w${optimizedSize}-h${optimizedSize}-l40-rw`);
    } else {
      // Add parameters if none exist
      return `${url}=w${optimizedSize}-h${optimizedSize}-l40-rw`;
    }
  }
  
  // For YouTube video thumbnails (i.ytimg.com)
  if (url.includes('i.ytimg.com')) {
    // Use mqdefault (320x180) for smaller displays, hqdefault for larger
    if (size <= 200) {
      return url.replace(/(hqdefault|maxresdefault|sddefault)/, 'mqdefault');
    }
  }
  
  return url;
}

/**
 * Optimizes Unsplash URLs for better performance
 * @param url - Original Unsplash URL
 * @param size - Desired size
 * @returns Optimized URL with WebP format
 */
export function optimizeUnsplashUrl(url: string, size: number = 160): string {
  if (!url || !url.includes('unsplash.com')) return url;
  
  // Use exact size (no retina multiplier) for minimal payload
  const optimizedSize = size;
  
  // Parse the URL to properly handle parameters
  try {
    const urlObj = new URL(url);
    
    // Set size parameters - exact display size
    urlObj.searchParams.set('w', String(optimizedSize));
    urlObj.searchParams.set('h', String(optimizedSize));
    
    // Add WebP format and aggressive compression (q=30) for better delivery
    urlObj.searchParams.set('fm', 'webp');
    urlObj.searchParams.set('q', '30');
    urlObj.searchParams.set('fit', 'crop');
    
    return urlObj.toString();
  } catch {
    // Fallback for invalid URLs - use string replacement
    let optimized = url
      .replace(/w=\d+/g, `w=${optimizedSize}`)
      .replace(/h=\d+/g, `h=${optimizedSize}`);
    
    // Add WebP format and quality if not present
    if (!optimized.includes('fm=webp')) {
      optimized += optimized.includes('?') ? '&fm=webp&q=30' : '?fm=webp&q=30';
    } else if (!optimized.includes('q=')) {
      optimized += '&q=30';
    }
    
    return optimized;
  }
}

/**
 * General image optimizer that handles multiple sources
 * @param url - Original image URL
 * @param displaySize - The size the image will be displayed at
 * @returns Optimized URL
 */
export function optimizeImageUrl(url: string, displaySize: number = 160): string {
  if (!url) return url;
  
  if (url.includes('googleusercontent.com') || url.includes('i.ytimg.com')) {
    return optimizeGoogleThumbnail(url, displaySize);
  }
  
  if (url.includes('unsplash.com')) {
    return optimizeUnsplashUrl(url, displaySize);
  }
  
  return url;
}
