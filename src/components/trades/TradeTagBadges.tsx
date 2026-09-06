import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trade } from '@/types/trade';
import { TAG_CATEGORY_META, EMOTIONAL_TAG_BADGE_CLASS } from '@/hooks/useTradeTags';

interface TradeTagBadgesProps {
  trade: Trade;
  className?: string;
}

/** Renders setup / error / market tags plus the emotional tag as colored badges. */
export const TradeTagBadges = ({ trade, className }: TradeTagBadgesProps) => {
  const groups: { tags: string[]; badgeClass: string }[] = [
    { tags: trade.setup_tags || [], badgeClass: TAG_CATEGORY_META.setup.badgeClass },
    { tags: trade.error_tags || [], badgeClass: TAG_CATEGORY_META.error.badgeClass },
    { tags: trade.market_tags || [], badgeClass: TAG_CATEGORY_META.market.badgeClass },
  ];

  const emotional = (trade.emotional_tag || '').trim();
  const hasAny = groups.some((g) => g.tags.length > 0) || !!emotional;
  if (!hasAny) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {groups.flatMap((group) =>
        group.tags.map((tag) => (
          <Badge
            key={`${group.badgeClass}-${tag}`}
            variant="outline"
            className={cn('h-5 rounded-full text-[11px] font-medium', group.badgeClass)}
          >
            {tag}
          </Badge>
        ))
      )}
      {emotional && (
        <Badge
          variant="outline"
          className={cn('h-5 rounded-full text-[11px] font-medium', EMOTIONAL_TAG_BADGE_CLASS)}
        >
          {emotional}
        </Badge>
      )}
    </div>
  );
};
