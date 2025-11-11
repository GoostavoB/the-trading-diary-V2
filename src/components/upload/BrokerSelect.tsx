import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBrokerPreferences } from '@/hooks/useBrokerPreferences';

interface BrokerSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: boolean;
}

export const BrokerSelect = ({ value, onChange, required = false, error = false }: BrokerSelectProps) => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customBroker, setCustomBroker] = useState('');
  const { sortedBrokers, incrementUsage } = useBrokerPreferences();

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === 'add-custom') {
      setOpen(false);
      setDialogOpen(true);
      return;
    }

    onChange(selectedValue);
    incrementUsage(selectedValue);
    setOpen(false);
  };

  const handleCustomBrokerSubmit = () => {
    if (customBroker.trim()) {
      const brokerName = customBroker.trim();
      onChange(brokerName);
      incrementUsage(brokerName);
      setCustomBroker('');
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={error}
            className={cn(
              "w-full justify-between transition-all duration-200",
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive hover:border-destructive/80 shadow-[0_0_0_1px] shadow-destructive/20"
            )}
          >
            {value || "Select broker..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 bg-popover border-border" 
          align="start" 
          style={{ width: 'var(--radix-popover-trigger-width)', minWidth: '300px' }}
        >
          <Command className="bg-popover rounded-lg border-0">
            <CommandInput 
              placeholder="Search broker..." 
              className="h-9 border-0 focus:ring-0 focus:outline-none" 
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No broker found.</CommandEmpty>
              <CommandGroup>
                {sortedBrokers.map((broker) => (
                  <CommandItem
                    key={broker}
                    value={broker}
                    onSelect={() => handleSelect(broker)}
                    className="cursor-pointer"
                  >
                    {broker}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === broker ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value="add-custom"
                  onSelect={() => handleSelect('add-custom')}
                  className="cursor-pointer text-accent"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Broker
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Add Custom Broker</DialogTitle>
            <DialogDescription>
              Enter the name of your broker. It will be saved for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-broker">Broker Name</Label>
              <Input
                id="custom-broker"
                placeholder="e.g., My Custom Broker"
                value={customBroker}
                onChange={(e) => setCustomBroker(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomBrokerSubmit()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomBrokerSubmit} disabled={!customBroker.trim()}>
              Add Broker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
