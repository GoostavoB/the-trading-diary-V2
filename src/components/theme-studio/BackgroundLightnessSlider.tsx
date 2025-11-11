import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { useUserTier } from '@/hooks/useUserTier';
import { useUpgradeModal } from '@/contexts/UpgradeModalContext';
import { calculateContrast } from '@/utils/contrastValidation';

const LIGHT_MODE_RANGE = { min: 92, max: 100, default: 100 };
const DARK_MODE_RANGE = { min: 2, max: 12, default: 2 };
const MIN_CONTRAST_RATIO = 4.5; // WCAG AA standard

export const BackgroundLightnessSlider = () => {
  const { theme } = useTheme();
  const { isElite } = useUserTier();
  const { openModal } = useUpgradeModal();
  const isDark = theme === 'dark';
  
  const range = isDark ? DARK_MODE_RANGE : LIGHT_MODE_RANGE;
  const storageKey = isDark ? 'theme:lightness-dark' : 'theme:lightness-light';
  
  const [lightness, setLightness] = useState(range.default);
  const [contrastWarning, setContrastWarning] = useState(false);

  // Load saved lightness on mount and theme change
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const value = parseInt(saved, 10);
      if (value >= range.min && value <= range.max) {
        setLightness(value);
        applyLightness(value);
      }
    } else {
      setLightness(range.default);
      applyLightness(range.default);
    }
  }, [theme]);

  const applyLightness = (value: number) => {
    const hslValue = `0 0% ${value}%`;
    const root = document.documentElement;
    
    root.style.setProperty('--background', hslValue);
    root.style.setProperty('--card', hslValue);
    root.style.setProperty('--popover', hslValue);
    
    // Sidebar should be slightly different
    const sidebarLightness = isDark ? Math.min(value + 2, 15) : Math.max(value - 2, 90);
    root.style.setProperty('--sidebar-background', `0 0% ${sidebarLightness}%`);
    
    // Check contrast with foreground
    const foreground = getComputedStyle(root).getPropertyValue('--foreground').trim();
    const contrast = calculateContrast(hslValue, foreground);
    setContrastWarning(contrast < MIN_CONTRAST_RATIO);
  };

  const handleLockedFeature = () => {
    openModal({
      source: 'background_color_locked',
      requiredPlan: 'elite',
      title: 'Background Lightness Control',
      message: 'Customize your background lightness with Elite.',
      illustration: 'palette',
    });
  };

  const handleChange = (values: number[]) => {
    if (!isElite) {
      handleLockedFeature();
      return;
    }

    const value = values[0];
    setLightness(value);
    applyLightness(value);
    localStorage.setItem(storageKey, value.toString());
  };

  const handleReset = () => {
    if (!isElite) {
      handleLockedFeature();
      return;
    }

    setLightness(range.default);
    applyLightness(range.default);
    localStorage.removeItem(storageKey);
  };

  const handleClick = () => {
    if (!isElite) {
      handleLockedFeature();
    }
  };

  return (
    <div className="px-4 py-3 border-b border-border/20" onClick={handleClick}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Background Lightness</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isDark ? 'Adjust darkness' : 'Adjust brightness'} ({lightness}%)
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            disabled={!isElite}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Slider
            value={[lightness]}
            onValueChange={handleChange}
            min={range.min}
            max={range.max}
            step={1}
            disabled={!isElite}
            className={`${!isElite ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          
          {!isElite && (
            <div className="absolute inset-0 cursor-pointer" />
          )}
        </div>

        {contrastWarning && isElite && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Low contrast detected. Text may be hard to read.</p>
          </div>
        )}

        {!isElite && (
          <p className="text-xs text-muted-foreground">
            Elite feature - Customize background lightness
          </p>
        )}
      </div>
    </div>
  );
};
