import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface TradeFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  brokerFilter: string;
  onBrokerFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  availableBrokers: string[];
}

export function TradeFilters({
  searchQuery,
  onSearchChange,
  brokerFilter,
  onBrokerFilterChange,
  statusFilter,
  onStatusFilterChange,
  availableBrokers,
}: TradeFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6B1BB]" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search symbol, broker, notes..."
          className="pl-9 bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11"
        />
      </div>

      <Select value={brokerFilter} onValueChange={onBrokerFilterChange}>
        <SelectTrigger className="w-[180px] bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11">
          <SelectValue placeholder="All brokers" />
        </SelectTrigger>
        <SelectContent className="bg-[#1A1F28] border-[#2A3038]">
          <SelectItem value="all" className="text-[#EAEFF4]">All brokers</SelectItem>
          {availableBrokers.map(broker => (
            <SelectItem key={broker} value={broker} className="text-[#EAEFF4]">
              {broker}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px] bg-[#1A1F28] border-[#2A3038] text-[#EAEFF4] rounded-xl h-11">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent className="bg-[#1A1F28] border-[#2A3038]">
          <SelectItem value="all" className="text-[#EAEFF4]">All status</SelectItem>
          <SelectItem value="needs_fields" className="text-[#EAEFF4]">Needs fields</SelectItem>
          <SelectItem value="ready" className="text-[#EAEFF4]">Ready</SelectItem>
          <SelectItem value="approved" className="text-[#EAEFF4]">Approved</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
