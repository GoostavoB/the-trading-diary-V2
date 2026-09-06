import { useState } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TagCategory, TAG_CATEGORY_META, useTradeTags } from '@/hooks/useTradeTags';

const CATEGORIES: TagCategory[] = ['setup', 'error', 'market'];

export const TradeTagManager = () => {
  const { tagsByCategory, createTag, renameTag, deleteTag } = useTradeTags();
  const [newName, setNewName] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  return (
    <PremiumCard className="p-6 glass">
      <h2 className="text-xl font-semibold mb-2">Trade tags</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Your own tags for setups, errors/lessons and market rules. Create, rename or delete any of
        them — nothing here is fixed. You can also create tags on the fly while logging a trade.
      </p>

      <div className="space-y-6">
        {CATEGORIES.map((category) => {
          const meta = TAG_CATEGORY_META[category];
          const tags = tagsByCategory(category);
          return (
            <div key={category}>
              <div className="mb-2">
                <h3 className="text-sm font-semibold">{meta.label}</h3>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>

              <form
                className="flex gap-2 mb-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const name = (newName[category] || '').trim();
                  if (!name) return;
                  const created = await createTag(category, name);
                  if (created) {
                    toast.success('Tag added');
                    setNewName((prev) => ({ ...prev, [category]: '' }));
                  }
                }}
              >
                <Input
                  value={newName[category] || ''}
                  onChange={(e) => setNewName((prev) => ({ ...prev, [category]: e.target.value }))}
                  placeholder={`New ${meta.label.toLowerCase()} tag...`}
                />
                <Button type="submit" disabled={!(newName[category] || '').trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </form>

              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No tags in this category yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) =>
                    editingId === tag.id ? (
                      <div key={tag.id} className="flex items-center gap-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 w-44"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={async () => {
                            const ok = await renameTag(tag.id, editingName);
                            if (ok) {
                              toast.success('Tag renamed');
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
                      </div>
                    ) : (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className={cn('h-8 gap-1 pl-3 pr-1 text-xs', meta.badgeClass)}
                      >
                        {tag.name}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingId(tag.id);
                            setEditingName(tag.name);
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={async () => {
                            const ok = await deleteTag(tag.id);
                            if (ok) toast.success('Tag deleted');
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </Badge>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PremiumCard>
  );
};
