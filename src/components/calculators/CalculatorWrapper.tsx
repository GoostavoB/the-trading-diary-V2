import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculatorWrapperProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  onCalculate?: () => void;
  calculateLabel?: string;
  isCalculating?: boolean;
  headerActions?: ReactNode;
  className?: string;
}

export function CalculatorWrapper({
  title,
  description,
  icon: Icon,
  children,
  onCalculate,
  calculateLabel = 'Calculate',
  isCalculating = false,
  headerActions,
  className,
}: CalculatorWrapperProps) {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Icon className="h-5 w-5 shrink-0" />
              <span className="break-words">{title}</span>
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm">
              {description}
            </CardDescription>
          </div>
          {headerActions && (
            <div className="shrink-0">{headerActions}</div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        
        {onCalculate && (
          <Button 
            onClick={onCalculate} 
            className="w-full min-h-[48px] touch-manipulation"
            disabled={isCalculating}
          >
            {isCalculating ? 'Calculating...' : calculateLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
