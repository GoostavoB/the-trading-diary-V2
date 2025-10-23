import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { Camera, Download, Share2, Calendar } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html-to-image";

interface PortfolioSnapshotProps {
  portfolioData?: {
    totalValue: number;
    unrealizedPnL: number;
    realizedPnL: number;
    roi: number;
    assets: Array<{
      symbol: string;
      value: number;
      allocation: number;
    }>;
  };
}

export const PortfolioSnapshot = ({ portfolioData }: PortfolioSnapshotProps) => {
  const { t } = useTranslation();
  const [isCapturing, setIsCapturing] = useState(false);

  const captureSnapshot = async () => {
    const element = document.getElementById('portfolio-snapshot-content');
    if (!element) {
      toast.error(t('portfolio.snapshotError'));
      return;
    }

    try {
      setIsCapturing(true);
      
      const dataUrl = await html2canvas.toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `portfolio-snapshot-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();

      toast.success(t('portfolio.snapshotSuccess'));
    } catch (error) {
      console.error('Error capturing snapshot:', error);
      toast.error(t('portfolio.snapshotError'));
    } finally {
      setIsCapturing(false);
    }
  };

  const shareSnapshot = async () => {
    const element = document.getElementById('portfolio-snapshot-content');
    if (!element) return;

    try {
      const dataUrl = await html2canvas.toPng(element);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'portfolio-snapshot.png', { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: t('portfolio.shareTitle'),
          text: t('portfolio.shareText')
        });
      } else {
        toast.info(t('portfolio.shareNotSupported'));
      }
    } catch (error) {
      console.error('Error sharing snapshot:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <CardTitle>{t('portfolio.snapshots')}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date().toLocaleDateString()}
          </Badge>
        </div>
        <CardDescription>
          {t('portfolio.snapshotsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Snapshot Preview */}
        <div
          id="portfolio-snapshot-content"
          className="p-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('portfolio.myPortfolio')}</h3>
              <span className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>

            {portfolioData ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {t('portfolio.totalValue')}
                    </div>
                    <div className="text-2xl font-bold">
                      ${portfolioData.totalValue.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {t('portfolio.totalROI')}
                    </div>
                    <div className={`text-2xl font-bold ${
                      portfolioData.roi > 0 ? 'text-green-600' : 
                      portfolioData.roi < 0 ? 'text-red-600' : 
                      'text-muted-foreground'
                    }`}>
                      {portfolioData.roi > 0 ? '+' : ''}{portfolioData.roi.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    {t('portfolio.topHoldings')}
                  </div>
                  {portfolioData.assets.slice(0, 3).map((asset, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{asset.symbol}</span>
                      <span className="text-muted-foreground">
                        {asset.allocation.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t('portfolio.noData')}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={captureSnapshot}
            disabled={isCapturing}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            {isCapturing ? t('portfolio.capturing') : t('portfolio.download')}
          </Button>
          <Button
            onClick={shareSnapshot}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Share2 className="h-4 w-4" />
            {t('portfolio.share')}
          </Button>
        </div>

        <div className="text-xs text-center text-muted-foreground">
          {t('portfolio.snapshotNote')}
        </div>
      </CardContent>
    </Card>
  );
};
