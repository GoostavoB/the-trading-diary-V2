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
import { useTranslation } from '@/hooks/useTranslation';

interface ExportTradesDialogProps {
  trades: Trade[];
  trigger?: React.ReactNode;
}

export const ExportTradesDialog = ({ trades, trigger }: ExportTradesDialogProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleExport = (format: 'csv' | 'json' | 'summary') => {
    try {
      switch (format) {
        case 'csv':
          exportToCSV(trades, 'trades');
          toast.success(t('export.success.csv'));
          break;
        case 'json':
          exportToJSON(trades, 'trades');
          toast.success(t('export.success.json'));
          break;
        case 'summary':
          exportWithSummary(trades, 'trades');
          toast.success(t('export.success.summary'));
          break;
      }
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('export.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            {t('common.export')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('export.title')}</DialogTitle>
          <DialogDescription>
            {t('export.description')} {trades.length} {trades.length !== 1 ? t('export.trades') : t('export.trade')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4 overflow-y-auto">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={() => handleExport('csv')}
          >
            <FileSpreadsheet className="w-5 h-5 text-neon-green flex-shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-sm">{t('export.formats.csv.title')}</div>
              <div className="text-xs text-muted-foreground leading-relaxed break-words overflow-wrap-anywhere">
                {t('export.formats.csv.description')}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={() => handleExport('summary')}
          >
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-sm">{t('export.formats.csvWithSummary.title')}</div>
              <div className="text-xs text-muted-foreground leading-relaxed break-words overflow-wrap-anywhere">
                {t('export.formats.csvWithSummary.description')}
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={() => handleExport('json')}
          >
            <FileJson className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold text-sm">{t('export.formats.json.title')}</div>
              <div className="text-xs text-muted-foreground leading-relaxed break-words overflow-wrap-anywhere">
                {t('export.formats.json.description')}
              </div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
