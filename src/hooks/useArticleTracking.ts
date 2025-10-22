import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '@/utils/analytics';

interface UseArticleTrackingProps {
  articleSlug: string;
  articleTitle: string;
  category: string;
}

/**
 * Hook to track article reading behavior
 * Tracks view, reading progress, and time spent
 */
export const useArticleTracking = ({ articleSlug, articleTitle, category }: UseArticleTrackingProps) => {
  const progressTracked = useRef<Set<number>>(new Set());
  const startTime = useRef<number>(Date.now());

  // Track article view on mount
  useEffect(() => {
    analytics.trackArticleView(articleSlug, articleTitle, category);
    startTime.current = Date.now();

    // Track time spent when unmounting
    return () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000); // in seconds
      analytics.trackEvent({
        action: 'article_time_spent',
        category: 'content',
        label: articleSlug,
        value: timeSpent,
      });
    };
  }, [articleSlug, articleTitle, category]);

  // Track scroll progress
  const trackProgress = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    const progress = Math.round((scrolled / scrollHeight) * 100);

    // Track at 25%, 50%, 75%, and 100%
    [25, 50, 75, 100].forEach(milestone => {
      if (progress >= milestone && !progressTracked.current.has(milestone)) {
        progressTracked.current.add(milestone);
        analytics.trackArticleProgress(articleSlug, milestone);
      }
    });
  }, [articleSlug]);

  // Set up scroll listener
  useEffect(() => {
    const handleScroll = () => {
      trackProgress();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackProgress]);
};
