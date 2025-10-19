import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useThemeMode, ThemeMode } from '@/hooks/useThemeMode';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const PRESET_COLORS = [
  { name: 'Blue', value: '#4A90E2', hsl: '210 79% 58%' },
  { name: 'Green', value: '#00B87C', hsl: '162 100% 36%' },
  { name: 'Purple', value: '#A18CFF', hsl: '251 100% 77%' },
  { name: 'Orange', value: '#FF6B35', hsl: '14 100% 60%' },
  { name: 'Teal', value: '#2DD4BF', hsl: '172 69% 51%' },
  { name: 'Pink', value: '#EC4899', hsl: '330 81% 60%' },
];

const PRIMARY_COLORS = [
  { name: 'Blue', value: '#4A90E2', hsl: '217 91% 60%' },
  { name: 'Indigo', value: '#6366F1', hsl: '239 84% 67%' },
  { name: 'Violet', value: '#8B5CF6', hsl: '258 90% 66%' },
  { name: 'Cyan', value: '#06B6D4', hsl: '189 94% 43%' },
];

const SECONDARY_COLORS = [
  { name: 'Gray', value: '#64748B', hsl: '215 16% 47%' },
  { name: 'Slate', value: '#475569', hsl: '215 20% 35%' },
  { name: 'Zinc', value: '#71717A', hsl: '240 5% 46%' },
  { name: 'Stone', value: '#78716C', hsl: '25 5% 45%' },
];

export const AccentColorPicker = () => {
  const [accentColor, setAccentColor] = useState(PRESET_COLORS[2].value); // Purple default
  const [primaryColor, setPrimaryColor] = useState(PRIMARY_COLORS[0].value); // Blue default
  const [secondaryColor, setSecondaryColor] = useState(SECONDARY_COLORS[0].value); // Gray default
  const [isOpen, setIsOpen] = useState(false);
  const { themeMode, setThemeMode } = useThemeMode();
  
  // Refs for color inputs
  const primaryColorInputRef = useRef<HTMLInputElement>(null);
  const secondaryColorInputRef = useRef<HTMLInputElement>(null);
  const accentColorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedAccent = localStorage.getItem('theme:accent');
    const savedPrimary = localStorage.getItem('theme:primary');
    const savedSecondary = localStorage.getItem('theme:secondary');
    
    if (savedAccent) {
      const preset = PRESET_COLORS.find(c => c.value === savedAccent);
      if (preset) {
        setAccentColor(preset.value);
        applyAccentColor(preset.value, preset.hsl);
      }
    }
    
    if (savedPrimary) {
      const preset = PRIMARY_COLORS.find(c => c.value === savedPrimary);
      if (preset) {
        setPrimaryColor(preset.value);
        applyPrimaryColor(preset.value, preset.hsl);
      }
    }
    
    if (savedSecondary) {
      const preset = SECONDARY_COLORS.find(c => c.value === savedSecondary);
      if (preset) {
        setSecondaryColor(preset.value);
        applySecondaryColor(preset.value, preset.hsl);
      }
    }
  }, []);

  // Helper to convert hex to HSL
  const hexToHsl = (hex: string): string => {
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
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const applyAccentColor = (color: string, hsl?: string) => {
    const hslValue = hsl || hexToHsl(color);
    document.documentElement.style.setProperty('--accent', hslValue);
    document.documentElement.style.setProperty('--chart-1', hslValue);
    localStorage.setItem('theme:accent', color);
  };

  const applyPrimaryColor = (color: string, hsl?: string) => {
    const hslValue = hsl || hexToHsl(color);
    document.documentElement.style.setProperty('--primary', hslValue);
    document.documentElement.style.setProperty('--chart-2', hslValue);
    localStorage.setItem('theme:primary', color);
  };

  const applySecondaryColor = (color: string, hsl?: string) => {
    const hslValue = hsl || hexToHsl(color);
    document.documentElement.style.setProperty('--secondary', hslValue);
    document.documentElement.style.setProperty('--chart-3', hslValue);
    localStorage.setItem('theme:secondary', color);
  };

  const handleAccentChange = (preset: typeof PRESET_COLORS[0]) => {
    setAccentColor(preset.value);
    applyAccentColor(preset.value, preset.hsl);
    toast.success(`Accent color changed to ${preset.name}`);
  };

  const handlePrimaryChange = (preset: typeof PRIMARY_COLORS[0]) => {
    setPrimaryColor(preset.value);
    applyPrimaryColor(preset.value, preset.hsl);
    toast.success(`Primary color changed to ${preset.name}`);
  };

  const handleSecondaryChange = (preset: typeof SECONDARY_COLORS[0]) => {
    setSecondaryColor(preset.value);
    applySecondaryColor(preset.value, preset.hsl);
    toast.success(`Secondary color changed to ${preset.name}`);
  };

  // Custom color handlers
  const handleCustomPrimary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setPrimaryColor(color);
    applyPrimaryColor(color);
    toast.success('Custom primary color applied');
  };

  const handleCustomSecondary = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setSecondaryColor(color);
    applySecondaryColor(color);
    toast.success('Custom secondary color applied');
  };

  const handleCustomAccent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setAccentColor(color);
    applyAccentColor(color);
    toast.success('Custom accent color applied');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="glass hover-lift">
          <Palette className="h-4 w-4" style={{ color: accentColor }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 glass-strong backdrop-blur-xl border-accent/20 rounded-2xl max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Color Mode</p>
            <RadioGroup value={themeMode} onValueChange={(value) => setThemeMode(value as ThemeMode)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="default" id="default" />
                <Label htmlFor="default" className="cursor-pointer text-sm">
                  Blue vs Gray (Default)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="classic" id="classic" />
                <Label htmlFor="classic" className="cursor-pointer text-sm">
                  Classic P&L (Green vs Red)
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="border-t border-border/20 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Primary Color</p>
                <p className="text-xs text-muted-foreground">Main UI and positive values</p>
              </div>
              <button
                onClick={() => primaryColorInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                title="Choose custom color"
              >
                <Plus className="h-3 w-3" />
                Custom
              </button>
              <input
                ref={primaryColorInputRef}
                type="color"
                value={primaryColor}
                onChange={handleCustomPrimary}
                className="sr-only"
                aria-label="Choose custom primary color"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
            {PRIMARY_COLORS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handlePrimaryChange(preset)}
                className={`group relative w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 ${
                  primaryColor === preset.value 
                    ? 'border-foreground scale-110 shadow-lg' 
                    : 'border-border/20 hover:border-foreground/50'
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
                aria-label={`Select ${preset.name} as primary color`}
              >
                {primaryColor === preset.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full shadow-md" />
                  </div>
                )}
              </button>
            ))}
            </div>
          </div>

          <div className="border-t border-border/20 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Secondary Color</p>
                <p className="text-xs text-muted-foreground">Subtle elements and negative values</p>
              </div>
              <button
                onClick={() => secondaryColorInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors"
                title="Choose custom color"
              >
                <Plus className="h-3 w-3" />
                Custom
              </button>
              <input
                ref={secondaryColorInputRef}
                type="color"
                value={secondaryColor}
                onChange={handleCustomSecondary}
                className="sr-only"
                aria-label="Choose custom secondary color"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
            {SECONDARY_COLORS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSecondaryChange(preset)}
                className={`group relative w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 ${
                  secondaryColor === preset.value 
                    ? 'border-foreground scale-110 shadow-lg' 
                    : 'border-border/20 hover:border-foreground/50'
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
                aria-label={`Select ${preset.name} as secondary color`}
              >
                {secondaryColor === preset.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full shadow-md" />
                  </div>
                )}
              </button>
            ))}
            </div>
          </div>
          
          <div className="border-t border-border/20 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Accent Color</p>
                <p className="text-xs text-muted-foreground">Highlights and interactive elements</p>
              </div>
              <button
                onClick={() => accentColorInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 hover:bg-accent/20 text-accent transition-colors"
                title="Choose custom color"
              >
                <Plus className="h-3 w-3" />
                Custom
              </button>
              <input
                ref={accentColorInputRef}
                type="color"
                value={accentColor}
                onChange={handleCustomAccent}
                className="sr-only"
                aria-label="Choose custom accent color"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleAccentChange(preset)}
                className={`group relative w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 ${
                  accentColor === preset.value 
                    ? 'border-foreground scale-110 shadow-lg' 
                    : 'border-border/20 hover:border-foreground/50'
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
                aria-label={`Select ${preset.name} as accent color`}
              >
                {accentColor === preset.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full shadow-md" />
                  </div>
                )}
              </button>
            ))}
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/20">
              <Palette className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground text-center">
                Click <span className="font-semibold text-primary">+ Custom</span> to choose any color
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
