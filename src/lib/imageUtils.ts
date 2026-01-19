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
  
  // Round up to nearest pixel for device pixel ratio (request slightly larger for retina)
  const optimizedSize = Math.ceil(size * 1.5);
  
  // For Google/YouTube images (lh3.googleusercontent.com)
  if (url.includes('googleusercontent.com')) {
    // Check if URL has existing parameters
    const hasParams = url.includes('=');
    if (hasParams) {
      // Replace any existing size/quality parameters with optimized ones
      // -l70 sets quality to 70 for better compression
      // -rw requests WebP format for modern browsers
      return url.replace(/=[^?&]+$/, `=w${optimizedSize}-h${optimizedSize}-l70-rw`);
    } else {
      // Add parameters if none exist
      return `${url}=w${optimizedSize}-h${optimizedSize}-l70-rw`;
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
  
  // Round up for retina displays
  const optimizedSize = Math.ceil(size * 1.5);
  
  // Parse the URL to properly handle parameters
  try {
    const urlObj = new URL(url);
    
    // Set size parameters
    urlObj.searchParams.set('w', String(optimizedSize));
    urlObj.searchParams.set('h', String(optimizedSize));
    
    // Add WebP format and quality optimization
    urlObj.searchParams.set('fm', 'webp');
    urlObj.searchParams.set('q', '75');
    urlObj.searchParams.set('fit', 'crop');
    
    return urlObj.toString();
  } catch {
    // Fallback for invalid URLs - use string replacement
    let optimized = url
      .replace(/w=\d+/g, `w=${optimizedSize}`)
      .replace(/h=\d+/g, `h=${optimizedSize}`);
    
    // Add WebP format and quality if not present
    if (!optimized.includes('fm=webp')) {
      optimized += optimized.includes('?') ? '&fm=webp&q=75' : '?fm=webp&q=75';
    } else if (!optimized.includes('q=')) {
      optimized += '&q=75';
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
