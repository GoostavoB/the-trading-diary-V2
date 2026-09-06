import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useSignalSources, DEFAULT_SIGNAL_SOURCE } from '@/hooks/useSignalSources';

interface SignalSourceSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SignalSourceSelect = ({ value, onChange, className }: SignalSourceSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { sources, createSource } = useSignalSources();

  const filtered = sources.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase())
  );
  const exactMatch = sources.some((s) => s.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="flex items-center gap-2 truncate">
            <Radio className="h-4 w-4 shrink-0 opacity-60" />
            {value || `${DEFAULT_SIGNAL_SOURCE} (default)`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start" sideOffset={8}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type a new source..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 && !search && (
              <CommandEmpty>No sources yet. Type to create one.</CommandEmpty>
            )}
            {search.trim() && !exactMatch && (
              <CommandGroup heading="Create new">
                <CommandItem
                  onSelect={async () => {
                    const created = await createSource(search);
                    if (created) onChange(created.name);
                    setSearch('');
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{search.trim()}"
                </CommandItem>
              </CommandGroup>
            )}
            {filtered.length > 0 && (
              <CommandGroup heading="Your sources">
                {filtered.map((source) => (
                  <CommandItem
                    key={source.id}
                    value={source.name}
                    onSelect={() => {
                      onChange(source.name);
                      setSearch('');
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === source.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {source.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
