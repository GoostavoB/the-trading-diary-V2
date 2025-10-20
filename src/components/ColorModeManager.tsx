import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useThemeMode, hexToHsl, ColorMode } from '@/hooks/useThemeMode';

const PRIMARY_COLORS = [
  { name: 'Blue', value: '#4A90E2', hsl: '217 91% 60%' },
  { name: 'Green', value: '#00B87C', hsl: '162 100% 36%' },
  { name: 'Indigo', value: '#6366F1', hsl: '239 84% 67%' },
  { name: 'Cyan', value: '#06B6D4', hsl: '189 94% 43%' },
];

const SECONDARY_COLORS = [
  { name: 'Gray', value: '#64748B', hsl: '215 16% 47%' },
  { name: 'Red', value: '#EF4444', hsl: '0 91% 61%' },
  { name: 'Slate', value: '#475569', hsl: '215 20% 35%' },
  { name: 'Stone', value: '#78716C', hsl: '25 5% 45%' },
];

export const ColorModeManager = () => {
  const { themeMode, setThemeMode, presetModes, customModes, addCustomMode, deleteCustomMode, updateCustomMode } = useThemeMode();
  const [isCreating, setIsCreating] = useState(false);
  const [editingMode, setEditingMode] = useState<string | null>(null);
  
  // New mode state
  const [newModeName, setNewModeName] = useState('');
  const [newPrimary, setNewPrimary] = useState(PRIMARY_COLORS[0].value);
  const [newSecondary, setNewSecondary] = useState(SECONDARY_COLORS[0].value);
  const [newAccent, setNewAccent] = useState('#A18CFF');
  const [newProfit, setNewProfit] = useState(PRIMARY_COLORS[0].value);
  const [newLoss, setNewLoss] = useState(SECONDARY_COLORS[0].value);

  // Edit mode state
  const [editName, setEditName] = useState('');
  const [editPrimary, setEditPrimary] = useState('');
  const [editSecondary, setEditSecondary] = useState('');
  const [editAccent, setEditAccent] = useState('');
  const [editProfit, setEditProfit] = useState('');
  const [editLoss, setEditLoss] = useState('');

  const primaryColorInputRef = useRef<HTMLInputElement>(null);
  const secondaryColorInputRef = useRef<HTMLInputElement>(null);
  const accentColorInputRef = useRef<HTMLInputElement>(null);
  const profitColorInputRef = useRef<HTMLInputElement>(null);
  const lossColorInputRef = useRef<HTMLInputElement>(null);

  const handleCreateMode = () => {
    if (!newModeName.trim()) {
      toast.error('Please enter a name for the color mode');
      return;
    }

    try {
      const mode = addCustomMode({
        name: newModeName,
        primary: hexToHsl(newPrimary),
        secondary: hexToHsl(newSecondary),
        accent: hexToHsl(newAccent),
        profit: hexToHsl(newProfit),
        loss: hexToHsl(newLoss),
      });

      toast.success(`Color mode "${newModeName}" created!`);
      setIsCreating(false);
      setNewModeName('');
      setThemeMode(mode.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create color mode');
    }
  };

  const handleStartEdit = (mode: ColorMode) => {
    setEditingMode(mode.id);
    setEditName(mode.name);
    setEditPrimary(`#${mode.primary}`);
    setEditSecondary(`#${mode.secondary}`);
    setEditAccent(`#${mode.accent}`);
    setEditProfit(`#${mode.profit}`);
    setEditLoss(`#${mode.loss}`);
  };

  const handleSaveEdit = (modeId: string) => {
    if (!editName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    updateCustomMode(modeId, {
      name: editName,
      primary: hexToHsl(editPrimary),
      secondary: hexToHsl(editSecondary),
      accent: hexToHsl(editAccent),
      profit: hexToHsl(editProfit),
      loss: hexToHsl(editLoss),
    });

    toast.success('Color mode updated!');
    setEditingMode(null);
  };

  const handleDelete = (modeId: string) => {
    if (confirm('Are you sure you want to delete this color mode?')) {
      deleteCustomMode(modeId);
      toast.success('Color mode deleted');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold mb-3">Color Mode</p>
        <RadioGroup value={themeMode} onValueChange={setThemeMode}>
          {presetModes.map((mode) => (
            <div key={mode.id} className="flex items-center space-x-2">
              <RadioGroupItem value={mode.id} id={mode.id} />
              <Label htmlFor={mode.id} className="cursor-pointer text-sm">
                {mode.name}
              </Label>
            </div>
          ))}
          
          {customModes.map((mode) => (
            <div key={mode.id} className="flex items-center justify-between">
              {editingMode === mode.id ? (
                <div className="flex-1 space-y-2 p-2 border border-border rounded-lg">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Mode name"
                    className="h-8"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="color"
                      value={editPrimary}
                      onChange={(e) => setEditPrimary(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Primary"
                    />
                    <input
                      type="color"
                      value={editSecondary}
                      onChange={(e) => setEditSecondary(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Secondary"
                    />
                    <input
                      type="color"
                      value={editAccent}
                      onChange={(e) => setEditAccent(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Accent"
                    />
                    <input
                      type="color"
                      value={editProfit}
                      onChange={(e) => setEditProfit(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Profit"
                    />
                    <input
                      type="color"
                      value={editLoss}
                      onChange={(e) => setEditLoss(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                      title="Loss"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(mode.id)}
                      className="h-7"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingMode(null)}
                      className="h-7"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center space-x-2 flex-1">
                    <RadioGroupItem value={mode.id} id={mode.id} />
                    <Label htmlFor={mode.id} className="cursor-pointer text-sm">
                      {mode.name}
                    </Label>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(mode)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(mode.id)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>

      {customModes.length < 3 && (
        <div className="border-t border-border/20 pt-4">
          {isCreating ? (
            <Card className="p-4 space-y-3">
              <Input
                placeholder="Color mode name"
                value={newModeName}
                onChange={(e) => setNewModeName(e.target.value)}
              />
              
              <div className="space-y-2">
                <Label className="text-xs">Primary Color (Positive)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIMARY_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setNewPrimary(color.value)}
                      className={`w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 ${
                        newPrimary === color.value 
                          ? 'border-foreground scale-110 shadow-lg' 
                          : 'border-border/20'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Secondary Color (Negative)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {SECONDARY_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setNewSecondary(color.value)}
                      className={`w-12 h-12 rounded-xl border-2 transition-all hover:scale-110 ${
                        newSecondary === color.value 
                          ? 'border-foreground scale-110 shadow-lg' 
                          : 'border-border/20'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreateMode} className="flex-1">
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
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsCreating(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Color Mode ({customModes.length}/3)
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
