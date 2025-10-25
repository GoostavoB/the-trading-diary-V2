import { useState } from 'react';
import { useThemeMode, ColorMode, hexToHsl } from '@/hooks/useThemeMode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check, X, Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Helper function to convert HSL to hex
function hslToHex(hsl: string): string {
  const [h, s, l] = hsl.split(' ').map((v, i) => {
    const num = parseFloat(v.replace('%', ''));
    return i === 0 ? num : num / 100;
  });

  const hDecimal = h / 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hDecimal * 6) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;

  if (hDecimal < 1/6) {
    r = c; g = x; b = 0;
  } else if (hDecimal < 2/6) {
    r = x; g = c; b = 0;
  } else if (hDecimal < 3/6) {
    r = 0; g = c; b = x;
  } else if (hDecimal < 4/6) {
    r = 0; g = x; b = c;
  } else if (hDecimal < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// Helper function to generate random hex color
function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export const CustomThemeManager = () => {
  const { themeMode, setThemeMode, customModes, addCustomMode, deleteCustomMode, updateCustomMode } = useThemeMode();
  const [isCreating, setIsCreating] = useState(false);
  const [editingMode, setEditingMode] = useState<string | null>(null);
  
  const [newModeName, setNewModeName] = useState('');
  const [newPrimary, setNewPrimary] = useState('#4A90E2');
  const [newSecondary, setNewSecondary] = useState('#64748B');
  const [newAccent, setNewAccent] = useState('#A18CFF');

  const [editName, setEditName] = useState('');
  const [editPrimary, setEditPrimary] = useState('');
  const [editSecondary, setEditSecondary] = useState('');
  const [editAccent, setEditAccent] = useState('');

  const handleRandomizeNewColors = () => {
    setNewPrimary(generateRandomColor());
    setNewSecondary(generateRandomColor());
    setNewAccent(generateRandomColor());
    toast.success('Random colors generated! 🎲');
  };

  const handleRandomizeEditColors = () => {
    setEditPrimary(generateRandomColor());
    setEditSecondary(generateRandomColor());
    setEditAccent(generateRandomColor());
    toast.success('Random colors generated! 🎲');
  };

  const handleCreateMode = () => {
    if (!newModeName.trim()) {
      toast.error('Please enter a name for the theme');
      return;
    }

    try {
      const primaryHsl = hexToHsl(newPrimary);
      const secondaryHsl = hexToHsl(newSecondary);
      const accentHsl = hexToHsl(newAccent);

      const mode = addCustomMode({
        name: newModeName,
        primary: primaryHsl,
        secondary: secondaryHsl,
        accent: accentHsl,
        profit: primaryHsl,
        loss: secondaryHsl,
      });

      toast.success(`Theme "${newModeName}" created! 🎨`);
      setIsCreating(false);
      setNewModeName('');
      setThemeMode(mode.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create theme');
    }
  };

  const handleStartEdit = (mode: ColorMode) => {
    setEditingMode(mode.id);
    setEditName(mode.name);
    // Convert HSL back to hex for color pickers
    setEditPrimary(hslToHex(mode.primary));
    setEditSecondary(hslToHex(mode.secondary));
    setEditAccent(hslToHex(mode.accent));
  };

  const handleSaveEdit = () => {
    if (!editingMode) return;
    
    if (!editName.trim()) {
      toast.error('Please enter a name for the theme');
      return;
    }

    try {
      const primaryHsl = hexToHsl(editPrimary);
      const secondaryHsl = hexToHsl(editSecondary);
      const accentHsl = hexToHsl(editAccent);

      updateCustomMode(editingMode, {
        name: editName,
        primary: primaryHsl,
        secondary: secondaryHsl,
        accent: accentHsl,
        profit: primaryHsl,
        loss: secondaryHsl,
      });

      toast.success(`Theme "${editName}" updated! 🎨`);
      setEditingMode(null);
      setEditName('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update theme');
    }
  };

  const handleCancelEdit = () => {
    setEditingMode(null);
    setEditName('');
    setEditPrimary('');
    setEditSecondary('');
    setEditAccent('');
  };

  const handleDelete = (modeId: string) => {
    if (confirm('Delete this custom theme?')) {
      deleteCustomMode(modeId);
      toast.success('Theme deleted');
    }
  };

  if (customModes.length === 0 && !isCreating) {
    return (
      <div className="px-4 pb-4">
        <Button
          variant="outline"
          onClick={() => setIsCreating(true)}
          className="w-full"
          disabled={customModes.length >= 3}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Theme (0/3)
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold px-4">Your Custom Themes ({customModes.length}/3)</h3>
      
      <div className="space-y-2 px-4">
        {customModes.map((mode) => {
          const isEditing = editingMode === mode.id;
          
          if (isEditing) {
            return (
              <Card key={mode.id} className="p-4 space-y-3 border-primary/20">
                <Input
                  placeholder="Theme name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Edit colors:</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRandomizeEditColors}
                      className="h-7 text-xs"
                    >
                      <Shuffle className="h-3 w-3 mr-1" />
                      Random
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs">Primary</label>
                      <input
                        type="color"
                        value={editPrimary}
                        onChange={(e) => setEditPrimary(e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs">Secondary</label>
                      <input
                        type="color"
                        value={editSecondary}
                        onChange={(e) => setEditSecondary(e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs">Accent</label>
                      <input
                        type="color"
                        value={editAccent}
                        onChange={(e) => setEditAccent(e.target.value)}
                        className="w-full h-10 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} className="flex-1" size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="flex-1"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </Card>
            );
          }

          return (
            <div
              key={mode.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border-2 transition-colors",
                themeMode === mode.id 
                  ? "border-primary bg-primary/10" 
                  : "border-border/20 hover:border-border/50"
              )}
            >
              <button
                onClick={() => setThemeMode(mode.id)}
                className="flex items-center gap-3 flex-1"
              >
                <div className="flex gap-1">
                  <div 
                    className="w-6 h-6 rounded-full border border-background"
                    style={{ backgroundColor: `hsl(${mode.primary})` }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border border-background"
                    style={{ backgroundColor: `hsl(${mode.secondary})` }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border border-background"
                    style={{ backgroundColor: `hsl(${mode.accent})` }}
                  />
                </div>
                <span className="text-sm font-medium">{mode.name}</span>
              </button>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleStartEdit(mode)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(mode.id)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {isCreating && (
        <Card className="mx-4 p-4 space-y-3 border-primary/20">
          <Input
            placeholder="Theme name (e.g., My Blue)"
            value={newModeName}
            onChange={(e) => setNewModeName(e.target.value)}
          />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Pick your colors:</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRandomizeNewColors}
                className="h-7 text-xs"
              >
                <Shuffle className="h-3 w-3 mr-1" />
                Random
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <label className="text-xs">Primary</label>
                <input
                  type="color"
                  value={newPrimary}
                  onChange={(e) => setNewPrimary(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs">Secondary</label>
                <input
                  type="color"
                  value={newSecondary}
                  onChange={(e) => setNewSecondary(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs">Accent</label>
                <input
                  type="color"
                  value={newAccent}
                  onChange={(e) => setNewAccent(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCreateMode} className="flex-1" size="sm">
              <Check className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setNewModeName('');
              }}
              className="flex-1"
              size="sm"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {!isCreating && customModes.length < 3 && (
        <div className="px-4">
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Theme ({customModes.length}/3)
          </Button>
        </div>
      )}
    </div>
  );
};
