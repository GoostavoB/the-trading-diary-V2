import { useEffect } from 'react';
import { toast } from 'sonner';
import { Palette, Sparkles } from 'lucide-react';
import { useThemeUnlocks } from '@/hooks/useThemeUnlocks';

export const ThemeUnlockNotification = () => {
  const { newlyUnlockedThemes } = useThemeUnlocks();

  useEffect(() => {
    if (newlyUnlockedThemes.length > 0) {
      newlyUnlockedThemes.forEach((themeId) => {
        toast.success(
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">New Theme Unlocked!</p>
              <p className="text-sm text-muted-foreground">
                {themeId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} theme is now available
              </p>
            </div>
          </div>,
          {
            duration: 5000,
            icon: <Palette className="h-5 w-5" />,
          }
        );
      });
    }
  }, [newlyUnlockedThemes]);

  return null;
};
