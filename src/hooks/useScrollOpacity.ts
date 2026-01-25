import { useState, useEffect, useCallback } from 'react';

interface ScrollOpacityState {
  opacity: number;
  hasScrolled: boolean;
  scrollY: number;
}

export function useScrollOpacity(
  threshold: number = 50,
  minOpacity: number = 0.85,
  maxOpacity: number = 1
): ScrollOpacityState {
  const [state, setState] = useState<ScrollOpacityState>({
    opacity: maxOpacity,
    hasScrolled: false,
    scrollY: 0,
  });

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const hasScrolled = scrollY > 10;
    
    // Calculate opacity based on scroll position
    const progress = Math.min(scrollY / threshold, 1);
    const opacity = maxOpacity - (progress * (maxOpacity - minOpacity));

    setState({ opacity, hasScrolled, scrollY });
  }, [threshold, minOpacity, maxOpacity]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return state;
}
