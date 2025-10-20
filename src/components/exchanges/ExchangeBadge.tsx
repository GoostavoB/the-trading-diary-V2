import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface ExchangeBadgeProps {
  source: string | null;
  syncedAt?: string;
}

export function ExchangeBadge({ source, syncedAt }: ExchangeBadgeProps) {
  if (!source) {
    return (
      <Badge variant="outline" className="text-xs">
        ✍️ Manual
      </Badge>
    );
  }

  const exchangeConfig: Record<string, { icon: string; color: string; name: string }> = {
    bingx: { icon: '🏦', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20', name: 'BingX' },
    binance: { icon: '🟡', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20', name: 'Binance' },
    bybit: { icon: '🟠', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', name: 'Bybit' },
    coinbase: { icon: '🔵', color: 'bg-primary/10 text-primary border-primary/20', name: 'Coinbase' },
  };

  const config = exchangeConfig[source.toLowerCase()] || {
    icon: '🔗',
    color: 'bg-primary/10 text-primary border-primary/20',
    name: source,
  };

  const badge = (
    <Badge variant="outline" className={`text-xs ${config.color}`}>
      {config.icon} {config.name}
    </Badge>
  );

  if (!syncedAt) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>Synced from {config.name} on {format(new Date(syncedAt), 'PPp')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
