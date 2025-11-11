import { Shield, Check } from 'lucide-react';
import { useAccessibilityMode } from '@/hooks/useAccessibilityMode';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Recommended background lightness for each preset
const LIGHTNESS_RECOMMENDATIONS = {
  deuteranopia: { dark: 7, light: 96 },
  protanopia: { dark: 7, light: 96 },
  tritanopia: { dark: 5, light: 94 },
  'high-contrast': { dark: 2, light: 100 },
};

export const AccessibilityPresetSelector = () => {
  const {
    settings,
    presets,
    setPreset,
    clearPreset,
    setShowIconsWithColor,
    setLinkUnderlines,
  } = useAccessibilityMode();
  const { theme } = useTheme();

  const applyRecommendedLightness = (presetId: string) => {
    const isDark = theme === 'dark';
    const storageKey = isDark ? 'theme:lightness-dark' : 'theme:lightness-light';
    const recommendation = LIGHTNESS_RECOMMENDATIONS[presetId as keyof typeof LIGHTNESS_RECOMMENDATIONS];
    
    if (!recommendation) return null;

    const recommendedValue = isDark ? recommendation.dark : recommendation.light;
    const previousValue = localStorage.getItem(storageKey);
    
    // Apply the recommended lightness
    const hslValue = `0 0% ${recommendedValue}%`;
    const root = document.documentElement;
    
    root.style.setProperty('--background', hslValue);
    root.style.setProperty('--card', hslValue);
    root.style.setProperty('--popover', hslValue);
    
    const sidebarLightness = isDark 
      ? Math.min(recommendedValue + 2, 15) 
      : Math.max(recommendedValue - 2, 90);
    root.style.setProperty('--sidebar-background', `0 0% ${sidebarLightness}%`);
    
    localStorage.setItem(storageKey, recommendedValue.toString());
    
    return { previousValue, recommendedValue, storageKey };
  };

  const handlePresetClick = (presetId: string) => {
    if (settings.preset === presetId) {
      clearPreset();
      toast.success('Accessibility preset cleared', {
        description: 'Default theme colors restored.',
      });
    } else {
      setPreset(presetId as any);
      const name = presets.find(p => p.id === presetId)?.name ?? 'Preset';
      const lightnessResult = applyRecommendedLightness(presetId);
      
      if (lightnessResult) {
        const { previousValue, recommendedValue, storageKey } = lightnessResult;
        
        toast.success(`${name} activated`, {
          description: `Background adjusted to ${recommendedValue}% for optimal contrast.`,
          action: previousValue ? {
            label: 'Undo',
            onClick: () => {
              const root = document.documentElement;
              const prevValue = parseInt(previousValue, 10);
              const hslValue = `0 0% ${prevValue}%`;
              
              root.style.setProperty('--background', hslValue);
              root.style.setProperty('--card', hslValue);
              root.style.setProperty('--popover', hslValue);
              
              const isDark = theme === 'dark';
              const sidebarLightness = isDark 
                ? Math.min(prevValue + 2, 15) 
                : Math.max(prevValue - 2, 90);
              root.style.setProperty('--sidebar-background', `0 0% ${sidebarLightness}%`);
              
              localStorage.setItem(storageKey, prevValue.toString());
              toast.success('Background lightness restored');
            },
          } : undefined,
        });
      } else {
        toast.success(`${name} activated`);
      }
    }
  };

  return (
    <div className="px-4 py-3 border-t border-border/20">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Accessibility</h3>
      </div>

      {/* Preset Grid */}
      <TooltipProvider>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {presets.map((preset) => {
            const isActive = settings.preset === preset.id;
            return (
              <Tooltip key={preset.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handlePresetClick(preset.id)}
                    className={`
                      relative p-3 rounded-lg border transition-all
                      hover:border-accent/40 hover:bg-accent/5
                      ${isActive 
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20' 
                        : 'border-border/30 bg-card/50'
                      }
                    `}
                  >
                    {/* Active Checkmark */}
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    )}

                    {/* Preset Name */}
                    <div className="text-left mb-2">
                      <p className="text-xs font-medium text-foreground leading-tight">
                        {preset.name.replace(' Safe', '').replace(' Contrast', '')}
                      </p>
                    </div>

                    {/* Color Preview Dots */}
                    <div className="flex gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: `hsl(${preset.primary})` }}
                      />
                      <div 
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: `hsl(${preset.success})` }}
                      />
                      <div 
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: `hsl(${preset.warning})` }}
                      />
                      <div 
                        className="w-3 h-3 rounded-full border border-border/20"
                        style={{ backgroundColor: `hsl(${preset.error})` }}
                      />
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[200px]">
                  <p className="text-xs">{preset.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Toggle Switches */}
      <div className="space-y-2 pt-2 border-t border-border/10">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-icons-compact" className="text-xs text-muted-foreground cursor-pointer">
            Show Icons
          </Label>
          <Switch
            id="show-icons-compact"
            checked={settings.showIconsWithColor}
            onCheckedChange={setShowIconsWithColor}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="link-underlines-compact" className="text-xs text-muted-foreground cursor-pointer">
            Link Underlines
          </Label>
          <Switch
            id="link-underlines-compact"
            checked={settings.linkUnderlines}
            onCheckedChange={setLinkUnderlines}
          />
        </div>
      </div>
    </div>
  );
};
