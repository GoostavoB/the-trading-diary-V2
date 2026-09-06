import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TagCategory, TAG_CATEGORY_META, useTradeTags } from '@/hooks/useTradeTags';

interface TagMultiSelectProps {
  category: TagCategory;
  value: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

export const TagMultiSelect = ({ category, value, onChange, className }: TagMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { tagsByCategory, createTag } = useTradeTags();
  const meta = TAG_CATEGORY_META[category];
  const options = tagsByCategory(category);

  const filtered = options.filter(
    (t) => !search || t.name.toLowerCase().includes(search.toLowerCase())
  );
  const exactMatch = options.some((t) => t.name.toLowerCase() === search.trim().toLowerCase());

  const toggle = (name: string) => {
    onChange(value.includes(name) ? value.filter((t) => t !== name) : [...value, name]);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div>
        <Label className="text-sm">{meta.label}</Label>
        <p className="text-xs text-muted-foreground">{meta.description}</p>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            <span className="truncate text-muted-foreground">
              {value.length > 0 ? `${value.length} selected` : meta.placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start" sideOffset={8}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={meta.placeholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filtered.length === 0 && !search && (
                <CommandEmpty>No tags yet. Type to create one.</CommandEmpty>
              )}
              {search.trim() && !exactMatch && (
                <CommandGroup heading="Create new">
                  <CommandItem
                    onSelect={async () => {
                      const created = await createTag(category, search);
                      if (created && !value.includes(created.name)) {
                        onChange([...value, created.name]);
                      }
                      setSearch('');
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create "{search.trim()}"
                  </CommandItem>
                </CommandGroup>
              )}
              {filtered.length > 0 && (
                <CommandGroup heading="Your tags">
                  {filtered.map((tag) => (
                    <CommandItem key={tag.id} value={tag.name} onSelect={() => toggle(tag.name)}>
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value.includes(tag.name) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="outline" className={cn('gap-1', meta.badgeClass)}>
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggle(tag)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
