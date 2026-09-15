import { Search, Settings2, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type ColumnKey = 'date' | 'symbol' | 'setup' | 'broker' | 'type' | 'entry' | 'exit' | 'size' | 'pnl' | 'roi' | 'fundingFee' | 'tradingFee' | 'error';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  visible: boolean;
}

interface TradeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'date' | 'pnl' | 'roi' | 'size' | 'fundingFee' | 'tradingFee';
  onSortChange: (value: 'date' | 'pnl' | 'roi' | 'size' | 'fundingFee' | 'tradingFee') => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (value: 'asc' | 'desc') => void;
  filterType: 'all' | 'wins' | 'losses';
  onFilterChange: (value: 'all' | 'wins' | 'losses') => void;
  showDeleted: boolean;
  onShowDeletedChange: (value: boolean) => void;
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
}

export const TradeFilters = ({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
  filterType,
  onFilterChange,
  showDeleted,
  onShowDeletedChange,
  columns,
  onColumnsChange,
}: TradeFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          placeholder="Search by symbol, setup, or broker..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Sort by Date</SelectItem>
          <SelectItem value="pnl">Sort by P&L</SelectItem>
          <SelectItem value="roi">Sort by ROI</SelectItem>
          <SelectItem value="size">Sort by Size</SelectItem>
          <SelectItem value="fundingFee">Sort by Funding Fee</SelectItem>
          <SelectItem value="tradingFee">Sort by Trading Fee</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
        title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      >
        <ArrowUpDown className={`h-4 w-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
      </Button>

      <Select value={filterType} onValueChange={onFilterChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Trades</SelectItem>
          <SelectItem value="wins">Wins Only</SelectItem>
          <SelectItem value="losses">Losses Only</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Customize Columns</h4>
            <div className="space-y-2">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.key}
                    checked={column.visible}
                    onCheckedChange={(checked) => {
                      const newColumns = columns.map(col =>
                        col.key === column.key ? { ...col, visible: !!checked } : col
                      );
                      onColumnsChange(newColumns);
                    }}
                  />
                  <Label htmlFor={column.key}>{column.label}</Label>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showDeleted"
                checked={showDeleted}
                onCheckedChange={(checked) => onShowDeletedChange(!!checked)}
              />
              <Label htmlFor="showDeleted">Show deleted trades</Label>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
