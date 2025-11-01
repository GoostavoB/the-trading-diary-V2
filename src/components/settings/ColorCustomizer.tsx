import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useColorSystem, ColorType, hslToHex } from '@/hooks/useColorSystem';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Lock, Palette, Paintbrush, Sparkles, Layout, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { posthog } from '@/lib/posthog';

interface ColorCustomizerProps {
  className?: string;
}

interface ColorSlot {
  id: ColorType;
  label: string;
  description: string;
  unlockRequirement: string;
  icon: typeof Palette;
}

const COLOR_SLOTS: ColorSlot[] = [
  {
    id: 'primary',
    label: 'Primary Color',
    description: 'Main accent and interactive elements',
    unlockRequirement: 'Free: Reach Tier 5 + 30-day streak',
    icon: Palette,
  },
  {
    id: 'secondary',
    label: 'Secondary Color',
    description: 'Secondary accents and highlights',
    unlockRequirement: 'Pro plan required',
    icon: Paintbrush,
  },
  {
    id: 'accent',
    label: 'Accent Color',
    description: 'Special highlights and notifications',
    unlockRequirement: 'Pro plan required',
    icon: Sparkles,
  },
  {
    id: 'background',
    label: 'Background Color',
    description: 'App background and card colors',
    unlockRequirement: 'Elite plan required',
    icon: Layout,
  },
];

const DEFAULT_COLORS = {
  primary: '217 91% 60%',
  secondary: '215 16% 47%',
  accent: '251 100% 77%',
  background: '222 47% 11%',
};

// Helper to convert hex to HSL
function hexToHsl(hex: string): string {
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

export const ColorCustomizer = ({ className }: ColorCustomizerProps) => {
  const { 
    colors, 
    unlockedColors, 
    loading, 
    updateColors, 
    canChangeColor 
  } = useColorSystem();
  
  const { subscription } = useSubscription();
  const [tempColors, setTempColors] = useState(colors);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTempColors(colors);
  }, [colors]);

  useEffect(() => {
    posthog.capture('color_customization_viewed');
  }, []);

  const handleColorChange = (colorType: ColorType, newColor: string) => {
    if (!canChangeColor(colorType)) {
      toast.error(`${colorType} color is locked`, {
        description: 'Unlock this color to customize it'
      });
      posthog.capture('color_locked_clicked', { color_type: colorType });
      return;
    }
    setTempColors({ ...tempColors, [colorType]: newColor });
  };

  const handleApply = async () => {
    setSaving(true);
    
    const changedColors: Partial<typeof colors> = {};
    Object.keys(tempColors).forEach((key) => {
      const colorKey = key as ColorType;
      if (tempColors[colorKey] !== colors[colorKey]) {
        changedColors[colorKey] = tempColors[colorKey];
      }
    });

    await updateColors(tempColors);
    
    toast.success('Colors updated!', {
      description: 'Your theme has been customized'
    });
    
    posthog.capture('color_customization_applied', {
      colors_changed: Object.keys(changedColors),
      plan: subscription?.plan_type || 'free',
    });
    
    setSaving(false);
  };

  const handleReset = () => {
    setTempColors(DEFAULT_COLORS);
    toast.info('Colors reset to defaults');
  };

  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Color Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COLOR_SLOTS.map((slot) => {
          const isLocked = !canChangeColor(slot.id);
          const IconComponent = slot.icon;
          
          return (
            <Card 
              key={slot.id}
              className={cn(
                'p-4 relative transition-all',
                isLocked && 'opacity-60'
              )}
            >
              {/* Lock Overlay */}
              {isLocked && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                  <div className="text-center space-y-2 px-4">
                    <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {slot.unlockRequirement}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Color Picker */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4" />
                  <h4 className="font-medium">{slot.label}</h4>
                  {!isLocked && (
                    <Badge variant="secondary" className="text-xs">
                      Unlocked
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {slot.description}
                </p>
                
                {/* Color Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hslToHex(tempColors[slot.id] || DEFAULT_COLORS[slot.id])}
                    onChange={(e) => handleColorChange(slot.id, hexToHsl(e.target.value))}
                    disabled={isLocked}
                    className="w-12 h-12 rounded cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 border border-border"
                  />
                  <div className="flex-1">
                    <Input
                      value={tempColors[slot.id] || DEFAULT_COLORS[slot.id]}
                      onChange={(e) => handleColorChange(slot.id, e.target.value)}
                      disabled={isLocked}
                      placeholder="H S% L%"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Live Preview Section */}
      <Card className="p-6 space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Live Preview
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Sample */}
          <div 
            className="p-4 rounded-lg border-2 bg-card transition-all"
            style={{ 
              borderColor: `hsl(${tempColors.primary})`,
            }}
          >
            <div className="text-sm font-medium text-muted-foreground">Primary Sample</div>
            <div className="text-2xl font-bold mt-2" style={{ color: `hsl(${tempColors.primary})` }}>
              $1,234.56
            </div>
          </div>
          
          {/* Secondary Sample */}
          <div 
            className="p-4 rounded-lg border-2 bg-card transition-all"
            style={{ borderColor: `hsl(${tempColors.secondary})` }}
          >
            <div className="text-sm font-medium text-muted-foreground">Secondary Sample</div>
            <Badge className="mt-2" style={{ backgroundColor: `hsl(${tempColors.secondary})`, color: 'white' }}>
              Active
            </Badge>
          </div>
          
          {/* Accent Sample */}
          <div 
            className="p-4 rounded-lg border-2 bg-card transition-all"
            style={{ borderColor: `hsl(${tempColors.accent})` }}
          >
            <div className="text-sm font-medium text-muted-foreground">Accent Sample</div>
            <Sparkles className="w-6 h-6 mt-2" style={{ color: `hsl(${tempColors.accent})` }} />
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving}
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={handleApply}
          disabled={saving}
        >
          {saving ? 'Applying...' : 'Apply Changes'}
        </Button>
      </div>
    </div>
  );
};