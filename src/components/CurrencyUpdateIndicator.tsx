import { RefreshCw } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatDistanceToNow } from 'date-fns';

/**
 * Small indicator showing when currency rates were last updated
 */
export function CurrencyUpdateIndicator() {
  const { lastUpdate, isLoading } = useCurrency();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>Updating rates...</span>
      </div>
    );
  }

  if (!lastUpdate) {
    return null;
  }

  const updateTime = formatDistanceToNow(new Date(lastUpdate), { addSuffix: true });

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <RefreshCw className="h-3 w-3" />
      <span>Rates updated {updateTime}</span>
    </div>
  );
}
