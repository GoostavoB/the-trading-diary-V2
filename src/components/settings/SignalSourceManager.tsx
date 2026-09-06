import { useState } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useSignalSources } from '@/hooks/useSignalSources';
import { toast } from 'sonner';

export const SignalSourceManager = () => {
  const { sources, createSource, renameSource, deleteSource } = useSignalSources();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = await createSource(newName);
    if (created) {
      toast.success('Signal source added');
      setNewName('');
    }
  };

  return (
    <PremiumCard className="p-6 glass">
      <h2 className="text-xl font-semibold mb-2">Signal sources</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Where each trade idea comes from. Trades without a source count as "Meu".
      </p>

      <form onSubmit={handleAdd} className="mb-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New source name..."
          />
          <Button type="submit" disabled={!newName.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No signal sources yet.</p>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-background/40"
            >
              {editingId === source.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={async () => {
                      const ok = await renameSource(source.id, editingName);
                      if (ok) {
                        toast.success('Source renamed');
                        setEditingId(null);
                      }
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{source.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingId(source.id);
                      setEditingName(source.name);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={async () => {
                      const ok = await deleteSource(source.id);
                      if (ok) toast.success('Source deleted');
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </PremiumCard>
  );
};
