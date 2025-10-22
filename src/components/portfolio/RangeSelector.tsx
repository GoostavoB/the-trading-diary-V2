import { memo } from 'react';
import { Button } from '@/components/ui/button';
import type { TimeRange } from '@/utils/timeframeReturns';

interface RangeSelectorProps {
  selected: TimeRange;
  onChange: (range: TimeRange) => void;
  className?: string;
}

const RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: '1H', label: '1H' },
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '6M', label: '6M' },
  { value: '12M', label: '1Y' },
  { value: 'YTD', label: 'YTD' },
  { value: 'All', label: 'All' },
];

export const RangeSelector = memo(({ selected, onChange, className }: RangeSelectorProps) => {
  return (
    <div className={`inline-flex gap-1 rounded-lg bg-muted/50 p-1 ${className || ''}`}>
      {RANGES.map(({ value, label }) => (
        <Button
          key={value}
          variant={selected === value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(value)}
          className="h-8 px-3 text-xs font-medium"
        >
          {label}
        </Button>
      ))}
    </div>
  );
});

RangeSelector.displayName = 'RangeSelector';
