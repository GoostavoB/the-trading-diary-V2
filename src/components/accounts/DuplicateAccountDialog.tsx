import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAccount } from '@/contexts/AccountContext';

interface DuplicateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceAccount: {
    id: string;
    name: string;
  };
}

export const DuplicateAccountDialog = ({
  open,
  onOpenChange,
  sourceAccount,
}: DuplicateAccountDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyData, setCopyData] = useState(true);
  const [include, setInclude] = useState({
    trades: true,
    journal: true,
    custom_metrics: true,
  });
  const { refetchAccounts } = useAccount();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `https://qziawervfvptoretkjrn.supabase.co/functions/v1/accounts/${sourceAccount.id}/duplicate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            copy_data: copyData,
            include: copyData ? include : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Account duplication failed: ${response.status}`);
      }

      toast.success('Account duplicated successfully');
      await refetchAccounts();
      onOpenChange(false);
      
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('Error duplicating account:', error);
      toast.error('Failed to duplicate account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Account</DialogTitle>
          <DialogDescription>
            Create a copy of "{sourceAccount.name}". Choose what to copy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="copy-data"
              checked={copyData}
              onCheckedChange={(checked) => setCopyData(checked as boolean)}
            />
            <Label htmlFor="copy-data" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Copy everything
            </Label>
          </div>

          {copyData && (
            <div className="ml-6 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="copy-trades"
                  checked={include.trades}
                  onCheckedChange={(checked) =>
                    setInclude({ ...include, trades: checked as boolean })
                  }
                />
                <Label htmlFor="copy-trades" className="text-sm">
                  Trades
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="copy-journal"
                  checked={include.journal}
                  onCheckedChange={(checked) =>
                    setInclude({ ...include, journal: checked as boolean })
                  }
                />
                <Label htmlFor="copy-journal" className="text-sm">
                  Journal entries
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="copy-metrics"
                  checked={include.custom_metrics}
                  onCheckedChange={(checked) =>
                    setInclude({ ...include, custom_metrics: checked as boolean })
                  }
                />
                <Label htmlFor="copy-metrics" className="text-sm">
                  Custom metrics & widgets
                </Label>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Note: Uploads and monthly counters are not duplicated.
          </p>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Duplicating...' : 'Duplicate Account'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
