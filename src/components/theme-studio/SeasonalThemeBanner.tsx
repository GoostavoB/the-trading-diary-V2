import { useSeasonalThemes } from '@/hooks/useSeasonalThemes';
import { useThemeMode } from '@/hooks/useThemeMode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock } from 'lucide-react';

export const SeasonalThemeBanner = () => {
  const { activeSeasonalTheme, getDaysUntilExpiration } = useSeasonalThemes();
  const { themeMode, setThemeMode } = useThemeMode();

  if (!activeSeasonalTheme) return null;

  const isActive = themeMode === activeSeasonalTheme.id;
  const daysLeft = getDaysUntilExpiration;

  return (
    <div className="px-4 pb-4">
      <div className="relative p-4 rounded-lg border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <h3 className="font-semibold text-sm">Limited Time</h3>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {daysLeft}d left
              </Badge>
            </div>
            <p className="text-lg font-bold mb-1">{activeSeasonalTheme.name}</p>
            <p className="text-xs text-muted-foreground">{activeSeasonalTheme.description}</p>
          </div>

          <Button
            size="sm"
            variant={isActive ? "secondary" : "default"}
            onClick={() => setThemeMode(activeSeasonalTheme.id)}
            className="shrink-0"
          >
            {isActive ? 'Active' : 'Apply'}
          </Button>
        </div>

        {/* Color Preview */}
        <div className="flex gap-1.5 mt-3">
          <div 
            className="w-6 h-6 rounded-full border-2 border-background"
            style={{ backgroundColor: `hsl(${activeSeasonalTheme.primary})` }}
          />
          <div 
            className="w-6 h-6 rounded-full border-2 border-background"
            style={{ backgroundColor: `hsl(${activeSeasonalTheme.accent})` }}
          />
          <div 
            className="w-6 h-6 rounded-full border-2 border-background"
            style={{ backgroundColor: `hsl(${activeSeasonalTheme.secondary})` }}
          />
        </div>
      </div>
    </div>
  );
};
