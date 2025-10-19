import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderClassName?: string;
  lazy?: boolean;
}

/**
 * Optimized image component with lazy loading and fade-in animation
 * Only loads images when they enter the viewport
 */
const OptimizedImageComponent = ({
  src,
  alt,
  className,
  placeholderClassName,
  lazy = true,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy]);

  return (
    <div className="relative overflow-hidden">
      {!isLoaded && (
        <div
          className={cn(
            'absolute inset-0 animate-pulse bg-muted',
            placeholderClassName
          )}
        />
      )}
      <img
        ref={imgRef}
        src={isInView ? src : undefined}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoad={() => setIsLoaded(true)}
        loading={lazy ? 'lazy' : 'eager'}
        {...props}
      />
    </div>
  );
};

export const OptimizedImage = memo(OptimizedImageComponent);
