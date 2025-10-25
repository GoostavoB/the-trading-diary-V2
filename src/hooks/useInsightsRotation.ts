import { useState, useEffect, useCallback, useRef } from 'react';
import { Insight } from './useHomeInsights';

export const useInsightsRotation = (
  insights: Insight[],
  rotationInterval = 8000,
  maxVisible = 8
) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  const visibleInsights = insights.slice(currentIndex, currentIndex + maxVisible);

  const rotate = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + maxVisible;
      return next >= insights.length ? 0 : next;
    });
  }, [insights.length, maxVisible]);

  useEffect(() => {
    if (isPaused || insights.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(rotate, rotationInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, rotate, rotationInterval, insights.length]);

  const handleMouseEnter = useCallback(() => setIsPaused(true), []);
  const handleMouseLeave = useCallback(() => setIsPaused(false), []);

  return {
    visibleInsights,
    isPaused,
    handleMouseEnter,
    handleMouseLeave,
  };
};
