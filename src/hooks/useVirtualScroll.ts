import { useState, useEffect, useRef, useMemo } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}

/**
 * Virtual scrolling hook for large lists
 * Only renders visible items + overscan for performance
 */
export const useVirtualScroll = ({
  itemCount,
  itemHeight,
  overscan = 5,
}: UseVirtualScrollOptions) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    container.addEventListener('scroll', handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const { visibleRange, totalHeight, offsetY } = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      visibleRange: { start: startIndex, end: endIndex },
      totalHeight: itemCount * itemHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [scrollTop, containerHeight, itemCount, itemHeight, overscan]);

  return {
    containerRef,
    visibleRange,
    totalHeight,
    offsetY,
  };
};
