import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

interface TradeFilterPanelProps {
  filterType: 'all' | 'wins' | 'losses';
  onFilterChange: (value: 'all' | 'wins' | 'losses') => void;
}

export const TradeFilterPanel = ({
  filterType,
  onFilterChange,
}: TradeFilterPanelProps) => {
  const [open, setOpen] = useState(false);
  const activeFiltersCount = filterType !== 'all' ? 1 : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-[400px] sm:w-[540px]"
        style={{
          background: 'rgba(17, 20, 24, 0.95)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <SheetHeader>
          <SheetTitle>Filter Trades</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your trade history
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Type filter */}
          <div className="space-y-2">
            <Label htmlFor="type-filter">Trade Type</Label>
            <Select value={filterType} onValueChange={onFilterChange}>
              <SelectTrigger id="type-filter" className="bg-background/50">
                <SelectValue placeholder="All trades" />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-sm">
                <SelectItem value="all">All Trades</SelectItem>
                <SelectItem value="wins">Wins Only</SelectItem>
                <SelectItem value="losses">Losses Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters summary */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 space-y-2">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filterType !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {filterType}
                    <button
                      onClick={() => onFilterChange('all')}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Clear all filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onFilterChange('all');
              }}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
