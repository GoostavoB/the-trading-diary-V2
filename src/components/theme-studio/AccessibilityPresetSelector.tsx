import { Shield, Check } from 'lucide-react';
import { useAccessibilityMode } from '@/hooks/useAccessibilityMode';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

export const AccessibilityPresetSelector = () => {
  const {
    settings,
    presets,
    setPreset,
    clearPreset,
    setShowIconsWithColor,
    setLinkUnderlines,
  } = useAccessibilityMode();

  const recommendations: Record<string, string> = {
    deuteranopia: 'Tip: neutral background lightness ~50% improves blue–orange contrast.',
    protanopia: 'Tip: neutral background ~50% keeps purple–orange separation clear.',
    tritanopia: 'Tip: slightly darker background ~45% improves rose/cyan legibility.',
    'high-contrast': 'Tip: very dark background ~12–16% maximizes contrast.',
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
      toast.success(`${name} activated`, {
        description: recommendations[presetId] || 'Preset applied.',
      });
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
