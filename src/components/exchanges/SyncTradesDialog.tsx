import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SyncTradesDialogProps {
  connectionId: string | null;
  exchangeName: string;
  isOpen: boolean;
  onClose: () => void;
  onFetchComplete: () => void;
}

type DateRangePreset = 'last7days' | 'last30days' | 'last90days' | 'custom';

export function SyncTradesDialog({
  connectionId,
  exchangeName,
  isOpen,
  onClose,
  onFetchComplete,
}: SyncTradesDialogProps) {
  const [preset, setPreset] = useState<DateRangePreset>('last30days');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const queryClient = useQueryClient();

  const fetchMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      let start: string | undefined;
      let end: string | undefined;

      const now = new Date();
      
      if (preset === 'custom') {
        if (!startDate || !endDate) {
          throw new Error('Please select both start and end dates');
        }
        start = startDate.toISOString().split('T')[0];
        end = endDate.toISOString().split('T')[0];
      } else {
        end = now.toISOString().split('T')[0];
        
        const daysBack = preset === 'last7days' ? 7 : preset === 'last30days' ? 30 : 90;
        const startTime = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        start = startTime.toISOString().split('T')[0];
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-exchange-trades`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            connectionId,
            mode: 'preview',
            startDate: start,
            endDate: end,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch trades');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Fetched ${data.tradesFetched} trades for review`);
      queryClient.invalidateQueries({ queryKey: ['pending-trades', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['exchange-connections'] });
      onFetchComplete();
      onClose();
    },
    onError: (error: Error) => {
      toast.error(`Failed to fetch trades: ${error.message}`);
    },
  });

  const handleFetch = () => {
    if (preset === 'custom' && (!startDate || !endDate)) {
      toast.error('Please select both start and end dates for custom range');
      return;
    }
    
    if (preset === 'custom' && startDate && endDate && startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }

    fetchMutation.mutate();
  };

  const getDateRangeLabel = () => {
    if (preset === 'custom' && startDate && endDate) {
      return `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;
    }
    
    const now = new Date();
    const daysBack = preset === 'last7days' ? 7 : preset === 'last30days' ? 30 : 90;
    const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    return `${format(start, 'MMM dd, yyyy')} - ${format(now, 'MMM dd, yyyy')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Fetch Trades from {exchangeName}</DialogTitle>
          <DialogDescription>
            Select the time period for trades you want to fetch and review
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Range Preset */}
          <div className="space-y-3">
            <Label>Time Period</Label>
            <RadioGroup value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last7days" id="last7days" />
                <Label htmlFor="last7days" className="font-normal cursor-pointer">
                  Last 7 days
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last30days" id="last30days" />
                <Label htmlFor="last30days" className="font-normal cursor-pointer">
                  Last 30 days (recommended)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last90days" id="last90days" />
                <Label htmlFor="last90days" className="font-normal cursor-pointer">
                  Last 90 days
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="font-normal cursor-pointer">
                  Custom date range
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Date Range Pickers */}
          {preset === 'custom' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'MMM dd, yyyy') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'MMM dd, yyyy') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Selected Range:</span>
              <span className="font-medium">{getDateRangeLabel()}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You'll be able to review and select specific trades before importing
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={fetchMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleFetch} disabled={fetchMutation.isPending}>
            {fetchMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Trades...
              </>
            ) : (
              'Fetch Trades'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
