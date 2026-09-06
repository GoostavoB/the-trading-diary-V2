import { TagMultiSelect } from '@/components/trades/TagMultiSelect';

interface TradeTagsFieldsProps {
  setupTags: string[];
  errorTags: string[];
  marketTags: string[];
  onSetupTagsChange: (tags: string[]) => void;
  onErrorTagsChange: (tags: string[]) => void;
  onMarketTagsChange: (tags: string[]) => void;
}

export const TradeTagsFields = ({
  setupTags,
  errorTags,
  marketTags,
  onSetupTagsChange,
  onErrorTagsChange,
  onMarketTagsChange,
}: TradeTagsFieldsProps) => (
  <div className="grid gap-4 md:grid-cols-3">
    <TagMultiSelect category="setup" value={setupTags} onChange={onSetupTagsChange} />
    <TagMultiSelect category="error" value={errorTags} onChange={onErrorTagsChange} />
    <TagMultiSelect category="market" value={marketTags} onChange={onMarketTagsChange} />
  </div>
);
