import { useThemeMode, ColorMode } from '@/hooks/useThemeMode';
import { ThemePreviewCard } from './ThemePreviewCard';
import { PRESET_THEMES } from '@/utils/themePresets';
import { ALL_ADVANCED_THEMES } from '@/utils/advancedThemePresets';
import { useThemeUnlocks } from '@/hooks/useThemeUnlocks';
import { Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const QuickThemesGrid = () => {
  const { themeMode, setThemeMode } = useThemeMode();
  const { isThemeUnlocked, currentLevel, getNextUnlockLevel } = useThemeUnlocks();

  const handleThemeClick = (theme: ColorMode) => {
    if (isThemeUnlocked(theme.id)) {
      setThemeMode(theme.id);
    }
  };

  const allThemes = [...PRESET_THEMES, ...ALL_ADVANCED_THEMES];
  const unlockedThemes = allThemes.filter(t => isThemeUnlocked(t.id));
  const lockedThemes = allThemes.filter(t => !isThemeUnlocked(t.id));

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold px-4">Available Themes</h3>
        <div className="grid grid-cols-2 gap-3 px-4">
          {unlockedThemes.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isActive={themeMode === theme.id}
              onClick={() => handleThemeClick(theme)}
            />
          ))}
        </div>
      </div>

      {lockedThemes.length > 0 && (
        <div className="space-y-3 border-t border-border/20 pt-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-semibold">Locked Themes</h3>
            <Badge variant="outline" className="text-xs">
              Level {currentLevel}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 px-4">
            {lockedThemes.slice(0, 4).map((theme) => {
              const requiredLevel = ALL_ADVANCED_THEMES.find(t => t.id === theme.id) 
                ? (theme.id.startsWith('wall') || theme.id.startsWith('focus') || theme.id.startsWith('neon') || theme.id.startsWith('forest') ? 3 
                  : theme.id.startsWith('sunset') || theme.id.startsWith('arctic') || theme.id.startsWith('matrix') || theme.id.startsWith('fire') ? 4 
                  : 5)
                : 1;
              
              return (
                <button
                  key={theme.id}
                  className="relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-border/20 opacity-50 cursor-not-allowed"
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
                    <div className="text-center">
                      <Lock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Level {requiredLevel}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-background"
                      style={{ backgroundColor: `hsl(${theme.primary})` }}
                    />
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-background"
                      style={{ backgroundColor: `hsl(${theme.accent})` }}
                    />
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-background"
                      style={{ backgroundColor: `hsl(${theme.secondary})` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium">{theme.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {getNextUnlockLevel(currentLevel) && (
            <p className="text-xs text-center text-muted-foreground px-4">
              Reach level {getNextUnlockLevel(currentLevel)} to unlock more themes
            </p>
          )}
        </div>
      )}
    </div>
  );
};
