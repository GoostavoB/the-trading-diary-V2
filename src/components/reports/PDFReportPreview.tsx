import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

interface ReportData {
  period: string;
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  winningTrades: number;
  losingTrades: number;
  totalFees: number;
  netPnL: number;
  bestTrade: { symbol: string; pnl: number };
  worstTrade: { symbol: string; pnl: number };
  topAssets: Array<{ symbol: string; pnl: number; trades: number }>;
  monthlyBreakdown?: Array<{ month: string; pnl: number; trades: number }>;
}

interface PDFReportPreviewProps {
  data: ReportData;
  onDownload?: () => void;
  isGenerating?: boolean;
}

export const PDFReportPreview = ({ data, onDownload, isGenerating = false }: PDFReportPreviewProps) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadAsPNG = async () => {
    if (!reportRef.current) return;

    try {
      toast.info('Generating report image...');
      
      const dataUrl = await toPng(reportRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `trading-report-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Report Preview</h3>
        <div className="flex gap-2">
          <Button
            onClick={downloadAsPNG}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download as Image
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div
          ref={reportRef}
          className="bg-white text-black p-8 space-y-6"
          style={{ minHeight: '800px' }}
        >
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Trading Performance Report</h1>
            <p className="text-gray-600 mt-1">{data.period}</p>
            <p className="text-sm text-gray-500">Generated on {format(new Date(), 'PPP')}</p>
          </div>

          {/* Executive Summary */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Executive Summary</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total P&L</p>
                <p className={`text-2xl font-bold ${data.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  ${Math.abs(data.totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.winRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Trades</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.totalTrades}
                </p>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded">
                <p className="text-sm text-gray-600">Winning Trades</p>
                <p className="text-lg font-semibold text-gray-900">{data.winningTrades}</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded">
                <p className="text-sm text-gray-600">Losing Trades</p>
                <p className="text-lg font-semibold text-gray-900">{data.losingTrades}</p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded">
                <p className="text-sm text-gray-600">Average Win</p>
                <p className="text-lg font-semibold text-green-600">
                  ${data.avgWin.toFixed(2)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded">
                <p className="text-sm text-gray-600">Average Loss</p>
                <p className="text-lg font-semibold text-red-600">
                  ${Math.abs(data.avgLoss).toFixed(2)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded">
                <p className="text-sm text-gray-600">Profit Factor</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data.profitFactor.toFixed(2)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded">
                <p className="text-sm text-gray-600">Total Fees</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${data.totalFees.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Notable Trades */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notable Trades</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 p-4 rounded">
                <p className="text-sm text-gray-600 mb-2">Best Trade</p>
                <p className="text-lg font-semibold text-gray-900">{data.bestTrade.symbol}</p>
                <p className="text-xl font-bold text-green-600">
                  +${data.bestTrade.pnl.toFixed(2)}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <p className="text-sm text-gray-600 mb-2">Worst Trade</p>
                <p className="text-lg font-semibold text-gray-900">{data.worstTrade.symbol}</p>
                <p className="text-xl font-bold text-red-600">
                  ${data.worstTrade.pnl.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Top Assets */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performing Assets</h2>
            <div className="space-y-2">
              {data.topAssets.map((asset, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded">
                  <div>
                    <p className="font-semibold text-gray-900">{asset.symbol}</p>
                    <p className="text-sm text-gray-600">{asset.trades} trades</p>
                  </div>
                  <p className={`font-bold ${asset.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {asset.pnl >= 0 ? '+' : ''}${asset.pnl.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Breakdown */}
          {data.monthlyBreakdown && data.monthlyBreakdown.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Breakdown</h2>
              <div className="space-y-2">
                {data.monthlyBreakdown.map((month, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white border border-gray-200 p-3 rounded">
                    <div>
                      <p className="font-semibold text-gray-900">{month.month}</p>
                      <p className="text-sm text-gray-600">{month.trades} trades</p>
                    </div>
                    <p className={`font-bold ${month.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {month.pnl >= 0 ? '+' : ''}${month.pnl.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-800 pt-4 mt-8">
            <p className="text-xs text-gray-500">
              This report is confidential and intended for personal use only. All figures are based on actual trading data.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
