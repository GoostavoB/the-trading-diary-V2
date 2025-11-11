import { useState, memo } from 'react';
import { format } from 'date-fns';
import { ChevronDown, Eye, Share2, Pencil, Trash2, Undo, MoreVertical, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trade } from '@/types/trade';
import { TokenIcon } from '@/components/TokenIcon';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';
import { getFinancialColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TradeRowCardProps {
  trade: Trade;
  isSelected: boolean;
  isExpanded: boolean;
  density: 'comfortable' | 'compact';
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onView: (trade: Trade) => void;
  onEdit: (trade: Trade) => void;
  onShare: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onUndelete: (id: string) => void;
}

export const TradeRowCard = memo(({
  trade,
  isSelected,
  isExpanded,
  density,
  onSelect,
  onToggleExpand,
  onView,
  onEdit,
  onShare,
  onDelete,
  onUndelete,
}: TradeRowCardProps) => {
  const isDeleted = !!trade.deleted_at;
  const hasNotes = !!trade.notes;
  
  return (
    <div 
      className={cn(
        "group relative rounded-xl transition-all duration-300",
        "backdrop-blur-[12px] border",
        "shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
        "hover:shadow-[0_8px_28px_rgba(0,0,0,0.35)]",
        isDeleted ? 'opacity-50' : '',
        density === 'compact' ? 'p-3' : 'p-4',
      )}
      style={{
        background: 'white',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      }}
    >
      {/* Main row content */}
      <div className="flex items-center gap-3">
        {/* Select checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(trade.id)}
          className="flex-shrink-0"
        />

        {/* Date block */}
        <div className={cn(
          "flex-shrink-0",
          density === 'compact' ? 'w-16' : 'w-20'
        )}>
          <div className={cn(
            "font-semibold text-foreground",
            density === 'compact' ? 'text-xs' : 'text-sm'
          )}>
            {format(new Date(trade.trade_date), 'MMM dd')}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {format(new Date(trade.trade_date), 'yyyy')}
          </div>
        </div>

        {/* Symbol badge */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <TokenIcon symbol={trade.symbol} size="sm" />
          <div>
            <div className={cn(
              "font-semibold text-foreground",
              density === 'compact' ? 'text-[10px]' : 'text-[11px]'
            )}>
              {trade.symbol}
            </div>
            {/* Summary line: Broker • Setup • Notes icon */}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {trade.broker && <span>{trade.broker}</span>}
              {trade.broker && trade.setup && <span>•</span>}
              {trade.setup && <span>{trade.setup}</span>}
              {hasNotes && (
                <>
                  <span>•</span>
                  <FileText className="h-3 w-3" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Trading data grid */}
        <div className="flex-1 grid grid-cols-4 gap-4 items-center">
          {/* Type pill */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Type</div>
            <Badge 
              variant="outline"
              className={cn(
                "h-6 text-xs font-medium rounded-full",
                trade.side === 'long' 
                  ? 'border-neon-green/50 text-neon-green bg-neon-green/5' 
                  : 'border-neon-red/50 text-neon-red bg-neon-red/5'
              )}
            >
              {trade.side?.toUpperCase() || 'N/A'}
            </Badge>
          </div>

          {/* Entry / Exit / Size */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Entry</div>
            <div className={cn(
              "text-foreground font-medium",
              density === 'compact' ? 'text-xs' : 'text-sm'
            )}>
              <BlurredCurrency amount={trade.entry_price || 0} />
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Exit</div>
            <div className={cn(
              "text-foreground font-medium",
              density === 'compact' ? 'text-xs' : 'text-sm'
            )}>
              <BlurredCurrency amount={trade.exit_price || 0} />
            </div>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">Size</div>
            <div className={cn(
              "text-foreground font-medium",
              density === 'compact' ? 'text-xs' : 'text-sm'
            )}>
              <BlurredCurrency amount={trade.position_size || 0} />
            </div>
          </div>
        </div>

        {/* ROI pill and P&L */}
        <div className="flex items-center gap-3 min-w-[180px]">
          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">ROI</div>
            <Badge 
              className={cn(
                "h-6 rounded-full text-xs font-semibold",
                getFinancialColor(trade.roi || 0) === 'text-neon-green'
                  ? 'bg-neon-green text-background'
                  : getFinancialColor(trade.roi || 0) === 'text-neon-red'
                  ? 'bg-neon-red text-background'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {(trade.roi || 0) > 0 ? '↑' : (trade.roi || 0) < 0 ? '↓' : '–'}{' '}
              <BlurredPercent value={trade.roi || 0} />
            </Badge>
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground mb-0.5">P&L</div>
            <div className={cn(
              "font-semibold text-right",
              getFinancialColor(trade.pnl || 0),
              density === 'compact' ? 'text-sm' : 'text-base'
            )}>
              <BlurredCurrency amount={trade.pnl || 0} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleExpand(trade.id)}
            className="h-8 w-8"
          >
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )} 
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-popover/95 backdrop-blur-sm">
              <DropdownMenuItem onClick={() => onView(trade)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              {!isDeleted && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(trade)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(trade)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(trade.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
              {isDeleted && (
                <DropdownMenuItem onClick={() => onUndelete(trade.id)}>
                  <Undo className="h-4 w-4 mr-2" />
                  Restore
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded panel */}
      {isExpanded && (
        <div 
          className="mt-4 pt-4 space-y-3 animate-in slide-in-from-top-2 duration-200"
          style={{
            borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Broker</div>
              <div className="text-foreground">{trade.broker || '–'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Setup</div>
              <div className="text-foreground">{trade.setup || '–'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Leverage</div>
              <div className="text-foreground">{trade.leverage ? `${trade.leverage}x` : '–'}</div>
            </div>
          </div>

          {trade.notes && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Notes</div>
              <div className="text-sm text-foreground/80 line-clamp-2">
                {trade.notes}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Funding Fee</div>
              <div className={cn("text-foreground", getFinancialColor(trade.funding_fee || 0))}>
                <BlurredCurrency amount={trade.funding_fee || 0} />
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Trading Fee</div>
              <div className={cn("text-foreground", getFinancialColor(trade.trading_fee || 0))}>
                <BlurredCurrency amount={trade.trading_fee || 0} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TradeRowCard.displayName = 'TradeRowCard';
