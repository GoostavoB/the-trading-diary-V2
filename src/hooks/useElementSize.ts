import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Measures an element with a ResizeObserver.
 * Used by the hand-rolled SVG charts so their viewBox can match the real pixel
 * size 1:1 — avoids the stroke/marker distortion that happens when a small
 * viewBox is stretched with preserveAspectRatio="none" on wide screens.
 */
export function useElementSize<T extends HTMLElement>(
  fallback: { width: number; height: number },
) {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState(fallback);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setSize(prev =>
        Math.abs(prev.width - rect.width) < 1 && Math.abs(prev.height - rect.height) < 1
          ? prev
          : { width: rect.width, height: rect.height },
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, size] as const;
}
