import { useBlur } from '@/contexts/BlurContext';
import { cn } from '@/lib/utils';

interface BlurredValueProps {
  children: React.ReactNode;
  className?: string;
  alwaysBlur?: boolean;
}

export const BlurredValue = ({ 
  children, 
  className,
  alwaysBlur = false 
}: BlurredValueProps) => {
  const { isBlurred } = useBlur();
  const shouldBlur = alwaysBlur || isBlurred;

  return (
    <span 
      className={cn(
        "transition-all duration-200",
        shouldBlur && "blur-md select-none",
        className
      )}
    >
      {children}
    </span>
  );
};
