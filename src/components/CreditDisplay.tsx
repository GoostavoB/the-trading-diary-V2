import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUploadCredits } from '@/hooks/useUploadCredits';
import { useBlur } from '@/contexts/BlurContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CreditDisplayProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export const CreditDisplay = ({ variant = 'default', className }: CreditDisplayProps) => {
  const { balance, limit, isLoading } = useUploadCredits();
  const { isBlurred } = useBlur();
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  const displayValue = isBlurred ? '•••' : balance.toLocaleString();
  const isLowCredits = balance < 5;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (window.location.href = '/#pricing-section')}
            className={cn(
              'gap-2 h-9',
              isLowCredits && 'text-destructive hover:text-destructive',
              className
            )}
          >
            <Coins className="h-4 w-4" />
            {variant === 'default' && (
              <span className="text-sm font-medium">
                {displayValue} / {isBlurred ? '•••' : limit.toLocaleString()}
              </span>
            )}
            {variant === 'compact' && (
              <span className="text-sm font-medium">{displayValue}</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Upload Credits: {balance} / {limit}
            <br />
            {isLowCredits && <span className="text-destructive">Running low! Click to buy more.</span>}
            {!isLowCredits && <span>Click to manage credits</span>}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
