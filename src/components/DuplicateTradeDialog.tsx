import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface DuplicateTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  duplicateDate?: string;
  duplicateSymbol?: string;
  duplicatePnl?: number;
}

export function DuplicateTradeDialog({
  open,
  onOpenChange,
  onContinue,
  duplicateDate,
  duplicateSymbol,
  duplicatePnl,
}: DuplicateTradeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Duplicate Trade Detected</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This trade appears identical to one uploaded earlier:
            </p>
            {duplicateDate && (
              <div className="mt-4 p-4 rounded-lg bg-muted space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Symbol:</span>
                  <span className="font-medium text-foreground">{duplicateSymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium text-foreground">
                    {format(new Date(duplicateDate), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">P&L:</span>
                  <span className={`font-medium ${(duplicatePnl || 0) >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    ${duplicatePnl?.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            <p className="mt-4">
              Would you like to save this trade anyway?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>
            Save Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
