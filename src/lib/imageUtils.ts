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
  
  // For Google/YouTube images (lh3.googleusercontent.com)
  if (url.includes('googleusercontent.com')) {
    // Replace any existing size parameters with optimized ones
    // -l70 sets quality to 70 for better compression
    // -rw requests WebP format for modern browsers
    return url
      .replace(/=w\d+-h\d+[^&]*/i, `=w${size}-h${size}-l70-rw`)
      .replace(/\?w=\d+&h=\d+/, `?w=${size}&h=${size}`);
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
  
  // Replace size parameters and add WebP format with quality optimization
  let optimized = url
    .replace(/w=\d+/g, `w=${size}`)
    .replace(/h=\d+/g, `h=${size}`);
  
  // Add WebP format and quality if not present
  if (!optimized.includes('fm=webp')) {
    optimized += optimized.includes('?') ? '&fm=webp&q=75' : '?fm=webp&q=75';
  } else if (!optimized.includes('q=')) {
    optimized += '&q=75';
  }
  
  return optimized;
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
