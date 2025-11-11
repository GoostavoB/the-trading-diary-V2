import { useState } from 'react';
import { Pipette, Lock, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useThemeGating } from '@/hooks/useThemeGating';
import { calculateContrast, getContrastDescription } from '@/utils/contrastValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BackgroundColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

export const BackgroundColorPicker = ({
  currentColor,
  onColorChange,
}: BackgroundColorPickerProps) => {
  const { canAccessBackgroundColor, handleLockedBackgroundColor, tier } = useThemeGating();
  const [hexValue, setHexValue] = useState(hslToHex(currentColor));
  const [contrastWarning, setContrastWarning] = useState<string | null>(null);

  const isLocked = !canAccessBackgroundColor();

  const handleColorChange = (hex: string) => {
    setHexValue(hex);
    
    if (!isLocked) {
      const hsl = hexToHsl(hex);
      onColorChange(hsl);

      // Validate contrast with typical text colors
      const lightTextContrast = calculateContrast('0 0% 100%', hsl); // white text
      const darkTextContrast = calculateContrast('0 0% 9%', hsl); // dark text
      
      const bestContrast = Math.max(lightTextContrast, darkTextContrast);
      
      if (bestContrast < 4.5) {
        setContrastWarning(`Low contrast (${bestContrast.toFixed(2)}:1). Text may be hard to read.`);
      } else {
        setContrastWarning(null);
      }
    }
  };

  const handleClick = () => {
    if (isLocked) {
      handleLockedBackgroundColor();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Pipette className="h-4 w-4" />
          Background Color
          {isLocked && (
            <span className="text-xs text-muted-foreground">(Elite only)</span>
          )}
        </Label>
        {isLocked && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <Lock className="h-3 w-3 text-purple-500" />
            <span className="text-xs font-medium text-purple-500">Elite</span>
          </div>
        )}
      </div>

      <div
        className={`relative ${isLocked ? 'cursor-pointer' : ''}`}
        onClick={isLocked ? handleClick : undefined}
      >
        <div className={`flex gap-2 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
          <div
            className="w-12 h-10 rounded-md border-2 border-border shadow-sm"
            style={{ backgroundColor: hexValue }}
          />
          <Input
            type="text"
            value={hexValue}
            onChange={(e) => handleColorChange(e.target.value)}
            placeholder="#000000"
            className="flex-1 font-mono text-sm"
            disabled={isLocked}
          />
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-background/95 backdrop-blur-sm"
              onClick={handleClick}
            >
              <Lock className="h-3 w-3" />
              Unlock with Elite
            </Button>
          </div>
        )}
      </div>

      {!isLocked && contrastWarning && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {contrastWarning}
          </AlertDescription>
        </Alert>
      )}

      {!isLocked && !contrastWarning && (
        <p className="text-xs text-muted-foreground">
          Choose any background color. Ensure good contrast with text.
        </p>
      )}
    </div>
  );
};

// Helper functions
const hexToHsl = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
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

const hslToHex = (hsl: string): string => {
  const parts = hsl.split(' ');
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};
