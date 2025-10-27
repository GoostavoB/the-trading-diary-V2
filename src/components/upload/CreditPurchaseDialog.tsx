import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUploadCredits } from '@/hooks/useUploadCredits';

interface CreditPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchaseComplete: () => void;
}

interface CreditPackage {
  credits: number;
  price: number;
  elitePrice: number;
  popular?: boolean;
}

const packages: CreditPackage[] = [
  { credits: 10, price: 2, elitePrice: 1 },
  { credits: 20, price: 4, elitePrice: 2, popular: true },
  { credits: 50, price: 10, elitePrice: 5 },
];

export const CreditPurchaseDialog = ({
  open,
  onOpenChange,
  onPurchaseComplete,
}: CreditPurchaseDialogProps) => {
  const { toast } = useToast();
  const { purchaseExtraCredits, balance } = useUploadCredits();
  const [purchasing, setPurchasing] = useState<number | null>(null);
  
  // TODO: Check user subscription tier (Basic/Pro vs Elite)
  const isElite = false; // Replace with actual subscription check

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasing(pkg.credits);
    
    const price = isElite ? pkg.elitePrice : pkg.price;
    const success = await purchaseExtraCredits(pkg.credits, price);
    
    setPurchasing(null);
    
    if (success) {
      toast({
        title: 'Credits Added Successfully',
        description: `${pkg.credits} upload credits have been added to your account.`,
      });
      onPurchaseComplete();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Purchase Upload Credits</DialogTitle>
          <DialogDescription>
            Choose a credit package to continue uploading trades
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Balance</span>
              <span className="text-2xl font-bold">{balance} credits</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => {
              const price = isElite ? pkg.elitePrice : pkg.price;
              const discount = isElite ? '50% OFF' : null;
              
              return (
                <div
                  key={pkg.credits}
                  className={`relative p-6 rounded-lg border-2 transition-all ${
                    pkg.popular
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                        POPULAR
                      </span>
                    </div>
                  )}
                  
                  {discount && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {discount}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold mb-2">{pkg.credits}</div>
                    <div className="text-sm text-muted-foreground">Credits</div>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold">${price}</div>
                    {isElite && (
                      <div className="text-sm text-muted-foreground line-through">
                        ${pkg.price}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      ${(price / pkg.credits).toFixed(2)} per credit
                    </div>
                  </div>

                  <Button
                    onClick={() => handlePurchase(pkg)}
                    disabled={purchasing !== null}
                    variant={pkg.popular ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {purchasing === pkg.credits ? 'Processing...' : 'Purchase'}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              What you get:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>• 1 credit = 1 image analysis</li>
              <li>• Each image can detect up to 10 trades</li>
              <li>• AI-powered trade extraction with 95%+ accuracy</li>
              <li>• Credits never expire</li>
              {isElite && <li className="text-green-600 font-medium">• Elite members get 50% off all packages</li>}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
