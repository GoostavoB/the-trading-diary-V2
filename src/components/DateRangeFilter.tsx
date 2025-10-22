import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
} | undefined;

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export const DateRangeFilter = ({ dateRange, onDateRangeChange }: DateRangeFilterProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(dateRange);

  const presetRanges = [
    {
      label: t('dateRange.presets.last7Days'),
      getValue: () => ({
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: t('dateRange.presets.last30Days'),
      getValue: () => ({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: t('dateRange.presets.last90Days'),
      getValue: () => ({
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        to: new Date(),
      }),
    },
    {
      label: t('dateRange.presets.thisMonth'),
      getValue: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date(),
        };
      },
    },
  ];

  const handleClear = () => {
    setTempRange(undefined);
    onDateRangeChange(undefined);
    setIsOpen(false);
  };

  const handleApply = () => {
    onDateRangeChange(tempRange);
    setIsOpen(false);
    if (tempRange?.from && tempRange?.to) {
      toast.success(`${t('dateRange.showingData')} ${format(tempRange.from, 'MMM dd')} - ${format(tempRange.to, 'MMM dd, yyyy')}`);
    }
  };

  const handleCancel = () => {
    setTempRange(dateRange);
    setIsOpen(false);
  };

  const handlePresetSelect = (range: DateRange) => {
    setTempRange(range);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} -{' '}
                  {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>{t('dateRange.pickDateRange')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 glass rounded-3xl shadow-xl" align="start">
          <div className="flex flex-col lg:flex-row">
            <div className="border-r border-border/50 p-4 space-y-2 min-w-[140px]">
              <div className="text-sm font-semibold mb-3 text-foreground">{t('dateRange.quickSelect')}</div>
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => handlePresetSelect(preset.getValue())}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="p-4">
              <Calendar
                mode="range"
                selected={tempRange}
                onSelect={(range) => setTempRange(range as DateRange)}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  {t('dateRange.cancel')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={!tempRange?.from || !tempRange?.to}
                >
                  {t('dateRange.apply')}
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {dateRange && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-9 w-9"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
