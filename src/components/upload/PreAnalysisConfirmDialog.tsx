import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Image } from 'lucide-react';

interface PreAnalysisConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageCount: number;
  creditsRequired: number;
  currentBalance: number;
  onConfirm: () => void;
  onPurchaseCredits: () => void;
  isAnalyzing: boolean;
}

export const PreAnalysisConfirmDialog = ({
  open,
  onOpenChange,
  imageCount,
  creditsRequired,
  currentBalance,
  onConfirm,
  onPurchaseCredits,
  isAnalyzing,
}: PreAnalysisConfirmDialogProps) => {
  const hasEnoughCredits = currentBalance >= creditsRequired;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Image Analysis</DialogTitle>
          <DialogDescription>
            Review the cost before proceeding with AI-powered trade extraction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Images to analyze</span>
            </div>
            <span className="text-lg font-bold">{imageCount}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">Credits required</span>
            <span className="text-lg font-bold">{creditsRequired}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">Your current balance</span>
            <span className={`text-lg font-bold ${hasEnoughCredits ? 'text-green-600' : 'text-destructive'}`}>
              {currentBalance}
            </span>
          </div>

          {!hasEnoughCredits && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive mb-1">Insufficient Credits</p>
                <p className="text-muted-foreground">
                  You need {creditsRequired - currentBalance} more credit{creditsRequired - currentBalance !== 1 ? 's' : ''} to proceed.
                  Purchase additional credits to continue.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!hasEnoughCredits && (
            <Button
              onClick={onPurchaseCredits}
              variant="default"
              className="w-full sm:w-auto"
            >
              Purchase Credits
            </Button>
          )}
          <Button
            onClick={onConfirm}
            disabled={!hasEnoughCredits || isAnalyzing}
            variant={hasEnoughCredits ? 'default' : 'secondary'}
            className="w-full sm:w-auto"
          >
            {isAnalyzing ? 'Analyzing...' : 'Proceed with Analysis'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
