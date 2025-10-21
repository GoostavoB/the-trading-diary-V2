import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload as UploadIcon } from 'lucide-react';
import { isValidDecimal } from '@/utils/numberFormatting';

interface ManualTradeFormProps {
  formData: any;
  onFormChange: (field: string, value: any) => void;
  onSubmit: () => void;
  loading: boolean;
  brokerOptions: React.ReactNode;
  setupOptions: React.ReactNode;
}

export const ManualTradeForm = memo(({
  formData,
  onFormChange,
  onSubmit,
  loading,
  brokerOptions,
  setupOptions,
}: ManualTradeFormProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="symbol">Symbol *</Label>
            <Input
              id="symbol"
              placeholder="e.g., BTCUSDT"
              value={formData.symbol || ''}
              onChange={(e) => onFormChange('symbol', e.target.value.toUpperCase())}
            />
          </div>

          <div>
            <Label>Broker</Label>
            {brokerOptions}
          </div>

          <div>
            <Label>Setup</Label>
            {setupOptions}
          </div>

          <div>
            <Label htmlFor="side">Side *</Label>
            <select
              id="side"
              className="w-full p-2 border rounded-md bg-background"
              value={formData.side || 'long'}
              onChange={(e) => onFormChange('side', e.target.value)}
            >
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>

          <div>
            <Label htmlFor="entry_price">Entry Price *</Label>
            <Input
              id="entry_price"
              type="text"
              inputMode="decimal"
              placeholder="Entry price"
              value={formData.entry_price || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (isValidDecimal(value)) {
                  onFormChange('entry_price', value);
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="exit_price">Exit Price *</Label>
            <Input
              id="exit_price"
              type="text"
              inputMode="decimal"
              placeholder="Exit price"
              value={formData.exit_price || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (isValidDecimal(value)) {
                  onFormChange('exit_price', value);
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="position_size">Position Size *</Label>
            <Input
              id="position_size"
              type="text"
              inputMode="decimal"
              placeholder="Position size"
              value={formData.position_size || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (isValidDecimal(value)) {
                  onFormChange('position_size', value);
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="leverage">Leverage</Label>
            <Input
              id="leverage"
              type="text"
              inputMode="decimal"
              placeholder="Leverage (default: 1)"
              value={formData.leverage || 1}
              onChange={(e) => {
                const value = e.target.value;
                if (isValidDecimal(value)) {
                  onFormChange('leverage', value);
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="opened_at">Opened At</Label>
            <Input
              id="opened_at"
              type="datetime-local"
              value={formData.opened_at || ''}
              onChange={(e) => onFormChange('opened_at', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="closed_at">Closed At</Label>
            <Input
              id="closed_at"
              type="datetime-local"
              value={formData.closed_at || ''}
              onChange={(e) => onFormChange('closed_at', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="funding_fee">Funding Fee</Label>
            <Input
              id="funding_fee"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.funding_fee || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (isValidDecimal(value)) {
                  onFormChange('funding_fee', value);
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="trading_fee">Trading Fee</Label>
            <Input
              id="trading_fee"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.trading_fee || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (isValidDecimal(value)) {
                  onFormChange('trading_fee', value);
                }
              }}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any notes about this trade..."
            value={formData.notes || ''}
            onChange={(e) => onFormChange('notes', e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={onSubmit}
          disabled={loading}
          className="w-full"
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          {loading ? 'Uploading...' : 'Upload Trade'}
        </Button>
      </div>
    </Card>
  );
});

ManualTradeForm.displayName = 'ManualTradeForm';
