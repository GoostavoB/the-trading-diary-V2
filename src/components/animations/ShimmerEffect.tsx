import { ReactNode } from 'react';

interface ShimmerEffectProps {
  children: ReactNode;
  enabled?: boolean;
  className?: string;
}

export const ShimmerEffect = ({ children, enabled = true, className = '' }: ShimmerEffectProps) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="shimmer-effect">
        {children}
      </div>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        .shimmer-effect {
          position: relative;
        }

        .shimmer-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(139, 92, 246, 0.3) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
