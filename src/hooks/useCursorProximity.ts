import { useEffect, useState, RefObject } from 'react';

interface CursorPosition {
  x: number;
  y: number;
  isNear: boolean;
}

export const useCursorProximity = (
  ref: RefObject<HTMLElement>,
  threshold: number = 100
): CursorPosition => {
  const [position, setPosition] = useState<CursorPosition>({
    x: 0,
    y: 0,
    isNear: false,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      setPosition({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        isNear: distance < threshold,
      });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0.5, y: 0.5, isNear: false });
    };

    window.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, threshold]);

  return position;
};
