import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBlur } from '@/contexts/BlurContext';
import { cn } from '@/lib/utils';

interface BlurToggleProps {
  variant?: 'default' | 'icon' | 'text';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const BlurToggle = ({ 
  variant = 'default', 
  size = 'default',
  className 
}: BlurToggleProps) => {
  const { isBlurred, toggleBlur } = useBlur();

  if (variant === 'icon') {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={toggleBlur}
        className={cn("glass hover:glass-strong", className)}
        title={isBlurred ? "Show sensitive data" : "Hide sensitive data"}
      >
        {isBlurred ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    );
  }

  if (variant === 'text') {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={toggleBlur}
        className={cn("glass hover:glass-strong", className)}
      >
        {isBlurred ? (
          <>
            <EyeOff className="h-4 w-4 mr-2" />
            Show Data
          </>
        ) : (
          <>
            <Eye className="h-4 w-4 mr-2" />
            Hide Data
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={toggleBlur}
      className={cn("glass hover:glass-strong gap-2", className)}
    >
      {isBlurred ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      {isBlurred ? "Blurred" : "Visible"}
    </Button>
  );
};
