import { useEffect, useRef } from 'react';

/**
 * Performance monitoring hook for development
 * Logs component render times and detects slow renders
 */
export const usePerformanceMonitor = (componentName: string, warnThreshold: number = 16) => {
  const renderCount = useRef(0);
  const renderStartTime = useRef(0);

  useEffect(() => {
    renderCount.current++;
  });

  // Measure render time (only in development)
  if (import.meta.env.DEV) {
    renderStartTime.current = performance.now();
    
    useEffect(() => {
      const renderTime = performance.now() - renderStartTime.current;
      
      if (renderTime > warnThreshold) {
        console.warn(
          `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render (Render #${renderCount.current})`
        );
      }
    });
  }

  return { renderCount: renderCount.current };
};
