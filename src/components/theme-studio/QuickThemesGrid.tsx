import { useState, useRef, useEffect } from 'react';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ThemePreviewCard } from './ThemePreviewCard';
import { UNIFIED_THEMES } from '@/utils/unifiedThemes';
import { useThemeUnlocks } from '@/hooks/useThemeUnlocks';
import { useThemeGating } from '@/hooks/useThemeGating';
import { toast } from 'sonner';

export const QuickThemesGrid = () => {
  const { themeMode, setThemeMode } = useThemeMode();
  const { themes, activateTheme } = useThemeUnlocks();
  const { canAccessTheme, handleLockedTheme } = useThemeGating();
  const [previewingTheme, setPreviewingTheme] = useState<string | null>(null);
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null);
  const previousThemeRef = useRef<string>(themeMode);

  useEffect(() => {
    return () => {
      if (previewTimer) {
        clearTimeout(previewTimer);
      }
    };
  }, [previewTimer]);

  const handleThemeClick = async (themeId: string) => {
    const theme = UNIFIED_THEMES.find(t => t.id === themeId);
    if (!theme) return;

    // Check if theme is accessible
    if (!canAccessTheme(themeId)) {
      // Start 5-second preview
      previousThemeRef.current = themeMode;
      setPreviewingTheme(themeId);
      setThemeMode(themeId);
      
      toast.info('Preview mode', {
        description: '5 seconds remaining...',
        duration: 5000,
      });

      const timer = setTimeout(() => {
        // Revert to previous theme
        setThemeMode(previousThemeRef.current);
        setPreviewingTheme(null);
        
        // Open upgrade modal
        handleLockedTheme(themeId);
      }, 5000);

      setPreviewTimer(timer);
      return;
    }

    // Clear any active preview
    if (previewTimer) {
      clearTimeout(previewTimer);
      setPreviewTimer(null);
    }
    setPreviewingTheme(null);
    
    // Apply theme permanently
    setThemeMode(themeId);
    await activateTheme(themeId);
    
    console.log('✅ Theme activated:', themeId);
  };

  // Show ALL themes to all users
  const allThemes = UNIFIED_THEMES;
  
  // Map themes with unlock status
  const themesWithStatus = allThemes.map(theme => {
    const unlockStatus = themes.find(t => t.id === theme.id);
    return {
      ...theme,
      isLocked: !unlockStatus?.isUnlocked,
      isPreviewing: previewingTheme === theme.id,
    };
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold px-4">Available Themes</h3>
        <div className="grid grid-cols-2 gap-3 px-4">
          {themesWithStatus.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isActive={themeMode === theme.id && !theme.isPreviewing}
              isLocked={theme.isLocked}
              isPreviewing={theme.isPreviewing}
              requiredTier={theme.requiredTier}
              onClick={() => handleThemeClick(theme.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
