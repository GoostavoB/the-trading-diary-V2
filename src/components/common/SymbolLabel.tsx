import { decodeSymbol } from '@/utils/symbolDisplay';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SymbolLabelProps {
  symbol?: string | null;
  className?: string;
  /** Show the raw technical ticker under the friendly name */
  showRaw?: boolean;
}

/**
 * Renders a human-friendly asset name (decoding BingX synthetic tickers)
 * while keeping the technical symbol available as a tooltip / caption.
 */
export function SymbolLabel({ symbol, className, showRaw = false }: SymbolLabelProps) {
  const decoded = decodeSymbol(symbol);

  if (!decoded.decoded) {
    return <span className={className}>{decoded.label}</span>;
  }

  const content = (
    <span className={cn('inline-flex flex-col leading-tight', className)}>
      <span>{decoded.label}</span>
      {showRaw && (
        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
          {decoded.raw}
        </span>
      )}
    </span>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top">
        <span className="font-mono text-xs">{decoded.raw}</span>
      </TooltipContent>
    </Tooltip>
  );
}
