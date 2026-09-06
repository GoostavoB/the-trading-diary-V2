import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, X, ImagePlus, Loader2 } from 'lucide-react';
import { TradingSetup, SetupInput, useSignedSetupImages } from '@/hooks/useSetupLibrary';

interface SetupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setup?: TradingSetup | null;
  onSave: (input: SetupInput, id?: string) => Promise<boolean>;
  onUploadImage: (file: File) => Promise<string | null>;
}

const emptyInput: SetupInput = {
  name: '',
  author: '',
  timeframe: '',
  description: '',
  entry_rules: [''],
  indicators: [],
  pitfalls: '',
  image_urls: [],
};

export const SetupForm = ({ open, onOpenChange, setup, onSave, onUploadImage }: SetupFormProps) => {
  const [form, setForm] = useState<SetupInput>(emptyInput);
  const [indicatorDraft, setIndicatorDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const signedUrls = useSignedSetupImages(form.image_urls);

  useEffect(() => {
    if (!open) return;
    setForm(
      setup
        ? {
            name: setup.name,
            author: setup.author || '',
            timeframe: setup.timeframe || '',
            description: setup.description || '',
            entry_rules: setup.entry_rules.length ? setup.entry_rules : [''],
            indicators: setup.indicators || [],
            pitfalls: setup.pitfalls || '',
            image_urls: setup.image_urls || [],
          }
        : emptyInput
    );
    setIndicatorDraft('');
  }, [open, setup]);

  const update = <K extends keyof SetupInput>(key: K, value: SetupInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addIndicator = () => {
    const value = indicatorDraft.trim();
    if (!value || form.indicators.includes(value)) return;
    update('indicators', [...form.indicators, value]);
    setIndicatorDraft('');
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const path = await onUploadImage(file);
      if (path) uploaded.push(path);
    }
    setUploading(false);
    if (uploaded.length) update('image_urls', [...form.image_urls, ...uploaded]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const ok = await onSave(form, setup?.id);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{setup ? 'Edit setup' : 'New setup'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <Label htmlFor="setup-name">Name</Label>
              <Input
                id="setup-name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Repique do Estocástico na Tendência"
                required
              />
            </div>
            <div>
              <Label htmlFor="setup-author">Author</Label>
              <Input
                id="setup-author"
                value={form.author}
                onChange={(e) => update('author', e.target.value)}
                placeholder="You, a mentor or a signal group"
              />
            </div>
            <div>
              <Label htmlFor="setup-tf">Default timeframe</Label>
              <Input
                id="setup-tf"
                value={form.timeframe}
                onChange={(e) => update('timeframe', e.target.value)}
                placeholder="4H"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="setup-desc">Explanation</Label>
            <Textarea
              id="setup-desc"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="How the setup works, market context, invalidation…"
              rows={4}
            />
          </div>

          <div>
            <Label>Entry rules</Label>
            <div className="space-y-2 mt-1">
              {form.entry_rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={rule}
                    onChange={(e) => {
                      const next = [...form.entry_rules];
                      next[index] = e.target.value;
                      update('entry_rules', next);
                    }}
                    placeholder="One rule per bullet"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => update('entry_rules', form.entry_rules.filter((_, i) => i !== index))}
                    aria-label="Remove rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => update('entry_rules', [...form.entry_rules, ''])}
              >
                <Plus className="h-4 w-4" />
                Add rule
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="setup-indicator">Indicators</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="setup-indicator"
                value={indicatorDraft}
                onChange={(e) => setIndicatorDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addIndicator();
                  }
                }}
                placeholder="Stochastic, EMA 100, EMA 200…"
              />
              <Button type="button" variant="outline" onClick={addIndicator}>
                Add
              </Button>
            </div>
            {form.indicators.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.indicators.map((indicator) => (
                  <Badge key={indicator} variant="secondary" className="gap-1">
                    {indicator}
                    <button
                      type="button"
                      onClick={() => update('indicators', form.indicators.filter((i) => i !== indicator))}
                      aria-label={`Remove ${indicator}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="setup-pitfalls">Notes and pitfalls</Label>
            <Textarea
              id="setup-pitfalls"
              value={form.pitfalls}
              onChange={(e) => update('pitfalls', e.target.value)}
              placeholder="What makes this setup fail"
              rows={3}
            />
          </div>

          <div>
            <Label>Example charts</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {form.image_urls.map((path) => (
                <div key={path} className="relative h-24 w-36 rounded-lg overflow-hidden border border-border">
                  {signedUrls[path] ? (
                    <img src={signedUrls[path]} alt="Setup example chart" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-muted animate-pulse" />
                  )}
                  <button
                    type="button"
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-1"
                    onClick={() => update('image_urls', form.image_urls.filter((p) => p !== path))}
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-24 w-36 rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer text-muted-foreground hover:border-primary/40">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span className="text-xs">Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving ? 'Saving…' : setup ? 'Save changes' : 'Create setup'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
