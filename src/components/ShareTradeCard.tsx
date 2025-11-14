import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import bullNeon from '@/assets/bull-neon.png';
import bearNeon from '@/assets/bear-neon.png';
import { format } from 'date-fns';
import { BlurredCurrency, BlurredPercent } from '@/components/ui/BlurredValue';

interface Trade {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  leverage?: number;
  roi?: number;
  profit_loss?: number;
  entry_price?: number;
  exit_price?: number;
  trade_date?: string;
  opened_at?: string | null;
  broker?: string;
}

interface ShareTradeCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade: Trade | null;
}

export function ShareTradeCard({ open, onOpenChange, trade }: ShareTradeCardProps) {
  const [mode, setMode] = useState<'roi' | 'profit'>('roi');
  const [selectedBg, setSelectedBg] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!trade) return null;

  const isLong = trade.side === 'long';
  const backgrounds = isLong 
    ? [bullNeon, bullNeon, bullNeon] // You can add more bull images here
    : [bearNeon, bearNeon, bearNeon]; // You can add more bear images here

  const value = mode === 'roi' ? trade.roi : trade.profit_loss;
  const isProfit = (value || 0) > 0;

  const handleDownload = async () => {
    const cardElement = document.getElementById('share-card-preview');
    if (!cardElement) return;

    setDownloading(true);
    try {
      const dataUrl = await toPng(cardElement, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#000000'
      });
      
      const link = document.createElement('a');
      link.download = `${trade.symbol}-trade-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Card downloaded!');
    } catch (error) {
      console.error('Error downloading card:', error);
      toast.error('Failed to download card');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dashboard`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: 'twitter' | 'telegram' | 'whatsapp') => {
    const text = `Just ${isProfit ? 'closed a winning' : 'logged a'} ${isLong ? 'LONG' : 'SHORT'} on ${trade.symbol} with ${trade.leverage}x leverage. ${mode === 'roi' ? `ROI: ${value?.toFixed(2)}%` : `P&L: $${value?.toFixed(2)}`}`;
    const url = window.location.origin;
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };

    window.open(urls[platform], '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Trade Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
            <div className="flex items-center gap-4">
              <Label htmlFor="mode-toggle" className="text-sm font-medium">
                Display Mode:
              </Label>
              <div className="flex items-center gap-2">
                <span className={mode === 'roi' ? 'font-semibold' : 'text-muted-foreground'}>ROI %</span>
                <Switch
                  id="mode-toggle"
                  checked={mode === 'profit'}
                  onCheckedChange={(checked) => setMode(checked ? 'profit' : 'roi')}
                />
                <span className={mode === 'profit' ? 'font-semibold' : 'text-muted-foreground'}>Profit $</span>
              </div>
            </div>
          </div>

          {/* Background Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose Background</Label>
            <div className="grid grid-cols-3 gap-3">
              {backgrounds.map((bg, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedBg(index)}
                  className={`relative h-24 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedBg === index ? 'border-accent scale-105' : 'border-border hover:border-accent/50'
                  }`}
                >
                  <img src={bg} alt={`Background ${index + 1}`} className="w-full h-full object-cover opacity-60" />
                  {selectedBg === index && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Check className="w-8 h-8 text-accent" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Card Preview */}
          <div id="share-card-preview" className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
            {/* Background */}
            <img
              src={backgrounds[selectedBg]}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-between text-foreground">
              {/* Top Section */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-4xl font-bold mb-2">{trade.symbol}</h2>
                  <Badge
                    className={`text-lg px-3 py-1 ${
                      isLong
                        ? 'bg-neon-green/20 text-neon-green border-neon-green'
                        : 'bg-neon-red/20 text-neon-red border-neon-red'
                    }`}
                  >
                    {isLong ? 'LONG' : 'SHORT'} {trade.leverage}x
                  </Badge>
                </div>
              </div>

              {/* Main Value */}
              <div className="text-center">
                <div className={`text-7xl font-bold ${isProfit ? 'text-neon-green' : 'text-neon-red'}`}>
                  {mode === 'roi' ? (
                    <BlurredPercent value={value || 0} className="inline" />
                  ) : (
                    <BlurredCurrency amount={value || 0} className="inline" />
                  )}
                </div>
                <div className="text-xl text-foreground/70 mt-2">
                  {mode === 'roi' ? 'Return on Investment' : 'Profit & Loss'}
                </div>
              </div>

              {/* Bottom Section */}
              <div className="flex justify-between items-end">
                <div className="space-y-1 text-sm">
                  <div className="flex gap-4">
                    <div>
                      <span className="text-foreground/60">Entry: </span>
                      <span className="font-semibold"><BlurredCurrency amount={trade.entry_price || 0} className="inline" /></span>
                    </div>
                    <div>
                      <span className="text-foreground/60">Exit: </span>
                      <span className="font-semibold"><BlurredCurrency amount={trade.exit_price || 0} className="inline" /></span>
                    </div>
                  </div>
                  <div className="text-foreground/60">
                    {trade.opened_at && format(new Date(trade.opened_at), 'MMM dd, yyyy')} • {trade.broker || 'Trading'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-foreground/50">Generated by</div>
                  <div className="font-semibold">TheTradingDiary.com</div>
                  <div className="text-xs text-foreground/60">Track your performance. Try it free.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full"
              variant="default"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Downloading...' : 'Download Image'}
            </Button>
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Twitter
            </Button>
            <Button
              onClick={() => handleShare('telegram')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Telegram
            </Button>
            <Button
              onClick={() => handleShare('whatsapp')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
