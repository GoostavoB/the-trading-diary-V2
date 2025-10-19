import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';
import { toast } from 'sonner';

const PRESET_COLORS = [
  { name: 'Blue', value: '#4A90E2', hsl: '210 79% 58%' },
  { name: 'Green', value: '#00B87C', hsl: '162 100% 36%' },
  { name: 'Purple', value: '#A18CFF', hsl: '251 100% 77%' },
  { name: 'Orange', value: '#FF6B35', hsl: '14 100% 60%' },
  { name: 'Teal', value: '#2DD4BF', hsl: '172 69% 51%' },
  { name: 'Pink', value: '#EC4899', hsl: '330 81% 60%' },
];

export const AccentColorPicker = () => {
  const [accentColor, setAccentColor] = useState(PRESET_COLORS[0].value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme:accent');
    if (saved) {
      const preset = PRESET_COLORS.find(c => c.value === saved);
      if (preset) {
        setAccentColor(preset.value);
        applyAccentColor(preset.value, preset.hsl);
      }
    }
  }, []);

  const applyAccentColor = (color: string, hsl: string) => {
    document.documentElement.style.setProperty('--accent', hsl);
    document.documentElement.style.setProperty('--chart-1', hsl);
    localStorage.setItem('theme:accent', color);
  };

  const handleColorChange = (preset: typeof PRESET_COLORS[0]) => {
    setAccentColor(preset.value);
    applyAccentColor(preset.value, preset.hsl);
    toast.success(`Theme changed to ${preset.name}`);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="glass hover-lift">
          <Palette className="h-4 w-4" style={{ color: accentColor }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto glass-strong backdrop-blur-xl border-accent/20 rounded-2xl">
        <div className="space-y-3">
          <p className="text-sm font-semibold">Accent Color</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleColorChange(preset)}
                className={`group relative w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 ${
                  accentColor === preset.value 
                    ? 'border-foreground scale-110 shadow-lg' 
                    : 'border-border/20 hover:border-foreground/50'
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.name}
              >
                {accentColor === preset.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/20">
            Theme applies globally
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
