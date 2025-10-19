import { useState, useEffect } from 'react';

export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Reduce data points for mobile
  const optimizeDataPoints = <T,>(data: T[], maxPoints: number = 20): T[] => {
    if (!isMobile || data.length <= maxPoints) return data;
    
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  };

  // Simplify number formatting for mobile
  const formatNumberMobile = (value: number, decimals: number = 1): string => {
    if (!isMobile) return value.toFixed(decimals);
    
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(decimals);
  };

  return {
    isMobile,
    isTablet,
    optimizeDataPoints,
    formatNumberMobile,
  };
};
