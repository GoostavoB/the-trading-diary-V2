import { ColorMode } from '@/hooks/useThemeMode';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemePreviewCardProps {
  theme: ColorMode;
  isActive: boolean;
  onHover?: () => void;
  onClick: () => void;
}

export const ThemePreviewCard = ({ theme, isActive, onHover, onClick }: ThemePreviewCardProps) => {
  return (
    <button
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        "relative group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300",
        "hover:scale-105 hover:shadow-lg cursor-pointer",
        isActive 
          ? "border-primary bg-primary/10 shadow-md" 
          : "border-border/20 hover:border-border/50"
      )}
    >
      {/* Color Preview Dots */}
      <div className="flex gap-1.5">
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
        <p className="text-xs font-medium">{theme.name}</p>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
};
