import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
}

export const GlassCard = ({ children, className = '', elevated = false, interactive = true }: GlassCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!interactive) return;

    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePosition({ x, y });
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      setMousePosition({ x: 0.5, y: 0.5 });
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactive]);

  const tiltX = interactive && isHovered ? (mousePosition.y - 0.5) * -4 : 0;
  const tiltY = interactive && isHovered ? (mousePosition.x - 0.5) * 4 : 0;

  return (
    <motion.div
      ref={cardRef}
      className={`glass-card relative overflow-hidden ${elevated ? 'elevated' : ''} ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {/* Cursor proximity lighting */}
      {interactive && isHovered && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)`,
          }}
        />
      )}

      {/* Rim light */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none">
        <div className="absolute inset-[0] rounded-2xl border border-white/[0.08]" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
