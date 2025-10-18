import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileJson, FileText } from 'lucide-react';
import { exportToCSV, exportToJSON, exportWithSummary } from '@/utils/exportTrades';
import type { Trade } from '@/types/trade';
import { toast } from 'sonner';

interface ExportTradesDialogProps {
  trades: Trade[];
  trigger?: React.ReactNode;
}

export const ExportTradesDialog = ({ trades, trigger }: ExportTradesDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleExport = (format: 'csv' | 'json' | 'summary') => {
    try {
      switch (format) {
        case 'csv':
          exportToCSV(trades, 'trades');
          toast.success('Trades exported as CSV');
          break;
        case 'json':
          exportToJSON(trades, 'trades');
          toast.success('Trades exported as JSON');
          break;
        case 'summary':
          exportWithSummary(trades, 'trades');
          toast.success('Trades exported with summary');
          break;
      }
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export trades');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Trades</DialogTitle>
          <DialogDescription>
            Choose a format to export your {trades.length} trade{trades.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={() => handleExport('csv')}
          >
            <FileSpreadsheet className="w-5 h-5 text-neon-green" />
            <div className="text-left flex-1">
              <div className="font-semibold">CSV Format</div>
              <div className="text-xs text-muted-foreground">
                Compatible with Excel, Google Sheets, and other spreadsheet tools
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={() => handleExport('summary')}
          >
            <FileText className="w-5 h-5 text-primary" />
            <div className="text-left flex-1">
              <div className="font-semibold">CSV with Summary</div>
              <div className="text-xs text-muted-foreground">
                Includes performance summary at the top
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={() => handleExport('json')}
          >
            <FileJson className="w-5 h-5 text-yellow-500" />
            <div className="text-left flex-1">
              <div className="font-semibold">JSON Format</div>
              <div className="text-xs text-muted-foreground">
                For developers and data analysis tools
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
