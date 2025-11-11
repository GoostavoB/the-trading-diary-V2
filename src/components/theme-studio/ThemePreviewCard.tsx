import { ColorMode } from '@/hooks/useThemeMode';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeTier } from '@/utils/unifiedThemes';

interface ThemePreviewCardProps {
  theme: ColorMode;
  isActive: boolean;
  isLocked?: boolean;
  isPreviewing?: boolean;
  requiredTier?: ThemeTier;
  onHover?: () => void;
  onClick: () => void;
}

export const ThemePreviewCard = ({ 
  theme, 
  isActive, 
  isLocked = false,
  isPreviewing = false,
  requiredTier,
  onHover, 
  onClick 
}: ThemePreviewCardProps) => {
  const tierLabel = requiredTier === 'elite' ? 'Elite' : requiredTier === 'pro' ? 'Pro' : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onMouseEnter={onHover}
            onClick={onClick}
            className={cn(
              "relative group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300",
              "hover:scale-105 hover:shadow-lg cursor-pointer",
              isActive 
                ? "border-primary bg-primary/10 shadow-md" 
                : "border-border/20 hover:border-border/50",
              isPreviewing && "ring-2 ring-primary ring-offset-2"
            )}
          >
            {/* Color Preview Dots */}
            <div className={cn(
              "flex gap-1.5",
              isLocked && "blur-[3px] opacity-70"
            )}>
              <div 
                className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: `hsl(${theme.primary})` }}
              />
              <div 
                className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: `hsl(${theme.accent})` }}
              />
              <div 
                className="w-8 h-8 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: `hsl(${theme.secondary})` }}
              />
            </div>

            {/* Theme Name */}
            <div className="text-center">
              <p className={cn(
                "text-xs font-medium",
                isLocked && "text-muted-foreground"
              )}>
                {theme.name}
              </p>
            </div>

            {/* Lock Overlay */}
            {isLocked && !isPreviewing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm rounded-xl">
                <Lock className="h-5 w-5 text-muted-foreground" />
                {tierLabel && (
                  <Badge variant="secondary" className="text-xs font-medium">
                    {tierLabel}
                  </Badge>
                )}
              </div>
            )}

            {/* Preview Indicator */}
            {isPreviewing && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                <p className="text-xs font-medium">Preview</p>
              </div>
            )}

            {/* Active Indicator */}
            {isActive && !isPreviewing && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
            )}
          </button>
        </TooltipTrigger>
        {isLocked && (
          <TooltipContent>
            <p className="text-xs">This theme requires {tierLabel}. Upgrade to use it.</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};
