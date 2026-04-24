import { useState, useEffect } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ChecklistItem {
    id: number;
    text: string;
    checked: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
    { id: 1, text: 'Check daily trend', checked: false },
    { id: 2, text: 'Identify key support/resistance', checked: false },
    { id: 3, text: 'Check news calendar', checked: false },
];

const STORAGE_KEY = 'trading-plan-checklist';

function loadItems(): ChecklistItem[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {
        // ignore parse errors
    }
    return DEFAULT_ITEMS;
}

export const PlanChecklist = () => {
    const [items, setItems] = useState<ChecklistItem[]>(loadItems);
    const [newItem, setNewItem] = useState('');

    // Persist to localStorage whenever items change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const toggleItem = (id: number) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const addItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        setItems([...items, { id: Date.now(), text: newItem.trim(), checked: false }]);
        setNewItem('');
    };

    const deleteItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const resetChecks = () => {
        setItems(items.map(item => ({ ...item, checked: false })));
        toast.success('Checklist reset for today');
    };

    const completedCount = items.filter(i => i.checked).length;

    return (
        <PremiumCard className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Pre-Trade Checklist</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {completedCount}/{items.length} completed
                    </p>
                </div>
                {completedCount > 0 && (
                    <Button variant="outline" size="sm" onClick={resetChecks} className="gap-2 text-muted-foreground">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                    </Button>
                )}
            </div>

            <div className="space-y-3 mb-6">
                {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                        <Checkbox
                            id={`item-${item.id}`}
                            checked={item.checked}
                            onCheckedChange={() => toggleItem(item.id)}
                        />
                        <Label
                            htmlFor={`item-${item.id}`}
                            className={`flex-1 cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                        >
                            {item.text}
                        </Label>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No checklist items yet. Add your first one below.
                    </div>
                )}
            </div>

            <form onSubmit={addItem} className="flex gap-2">
                <Input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Add new checklist item..."
                />
                <Button type="submit" size="icon">
                    <Plus className="h-4 w-4" />
                </Button>
            </form>
        </PremiumCard>
    );
};
