import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAccessibilityMode } from '@/hooks/useAccessibilityMode';
import { Eye, EyeOff, Check, Shield, Palette } from 'lucide-react';
import { toast } from 'sonner';

export function AccessibilitySettings() {
  const {
    presets,
    activePreset,
    setPreset,
    clearPreset,
    showIconsWithColor,
    setShowIconsWithColor,
    linkUnderlines,
    setLinkUnderlines,
  } = useAccessibilityMode();

  const handlePresetSelect = (presetId: string) => {
    if (activePreset === presetId) {
      clearPreset();
      toast.success('Accessibility preset cleared', {
        description: 'Default theme colors restored',
      });
    } else {
      setPreset(presetId as any);
      toast.success('Accessibility preset applied', {
        description: 'Colors optimized for better visibility',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Accessibility</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Optimize colors and contrast for different types of color vision. All presets are free and meet WCAG AA standards.
        </p>
      </div>

      {/* Color Vision Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Color Vision Presets</h3>
          <Badge variant="secondary" className="text-xs">
            Free for Everyone
          </Badge>
        </div>
        
        <div className="grid gap-3 md:grid-cols-2">
          {presets.map((preset) => {
            const isActive = activePreset === preset.id;
            
            return (
              <Card
                key={preset.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isActive ? 'ring-2 ring-primary border-primary' : ''
                }`}
                onClick={() => handlePresetSelect(preset.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{preset.name}</h4>
                        {isActive && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  {/* Color Preview */}
                  <div className="flex gap-2">
                    <div
                      className="h-8 flex-1 rounded border"
                      style={{ backgroundColor: `hsl(${preset.success})` }}
                      title="Success color"
                    />
                    <div
                      className="h-8 flex-1 rounded border"
                      style={{ backgroundColor: `hsl(${preset.warning})` }}
                      title="Warning color"
                    />
                    <div
                      className="h-8 flex-1 rounded border"
                      style={{ backgroundColor: `hsl(${preset.error})` }}
                      title="Error color"
                    />
                    <div
                      className="h-8 flex-1 rounded border"
                      style={{ backgroundColor: `hsl(${preset.info})` }}
                      title="Info color"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Contrast: {preset.contrastRatio}:1
                    </span>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {activePreset && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearPreset}
            className="w-full"
          >
            Clear Accessibility Preset
          </Button>
        )}
      </div>

      {/* Additional Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Settings</h3>
        
        <Card className="p-4 space-y-4">
          {/* Always Show Icons */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label htmlFor="show-icons" className="text-sm font-medium">
                Always Show Icons with Color
              </Label>
              <p className="text-xs text-muted-foreground">
                Display icons alongside colored elements for better recognition
              </p>
            </div>
            <Switch
              id="show-icons"
              checked={showIconsWithColor}
              onCheckedChange={setShowIconsWithColor}
            />
          </div>

          {/* Link Underlines */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label htmlFor="link-underlines" className="text-sm font-medium">
                Underline Links
              </Label>
              <p className="text-xs text-muted-foreground">
                Add underlines to links for better visibility
              </p>
            </div>
            <Switch
              id="link-underlines"
              checked={linkUnderlines}
              onCheckedChange={setLinkUnderlines}
            />
          </div>
        </Card>
      </div>

      {/* Information */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex gap-3">
          <Palette className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Accessibility First</h4>
            <p className="text-xs text-muted-foreground">
              All accessibility features are free for everyone. Color vision presets work alongside your theme choices and can be combined with background lightness adjustments.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
