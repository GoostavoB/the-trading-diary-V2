import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload as UploadIcon, X, Sparkles, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExtractedTrade {
  asset: string;
  entry_price: number;
  exit_price: number;
  position_size: number;
  position_type: 'long' | 'short';
  profit_loss: number;
  funding_fee: number;
  trading_fee: number;
  roi: number;
  margin: number;
  opened_at: string;
  closed_at: string;
  period_of_day: 'morning' | 'afternoon' | 'night';
  duration_days: number;
  duration_hours: number;
  duration_minutes: number;
}

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [extractionImage, setExtractionImage] = useState<File | null>(null);
  const [extractionPreview, setExtractionPreview] = useState<string | null>(null);
  const [extractedTrades, setExtractedTrades] = useState<ExtractedTrade[]>([]);
  const [savingTrades, setSavingTrades] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  
  const [formData, setFormData] = useState({
    asset: '',
    setup: '',
    broker: '',
    entry_price: '',
    exit_price: '',
    position_size: '',
    position_type: 'long' as 'long' | 'short',
    funding_fee: '',
    trading_fee: '',
    margin: '',
    opened_at: '',
    closed_at: '',
    period_of_day: 'morning' as 'morning' | 'afternoon' | 'night',
    emotional_tag: '',
    notes: '',
    duration_minutes: ''
  });

  useEffect(() => {
    if (editId) {
      fetchTrade(editId);
    }
  }, [editId]);

  const fetchTrade = async (id: string) => {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load trade');
      return;
    }

    if (data) {
      setFormData({
        asset: data.asset,
        setup: data.setup || '',
        broker: data.broker || '',
        entry_price: data.entry_price.toString(),
        exit_price: data.exit_price.toString(),
        position_size: data.position_size.toString(),
        position_type: (data.position_type as 'long' | 'short') || 'long',
        funding_fee: data.funding_fee?.toString() || '',
        trading_fee: data.trading_fee?.toString() || '',
        margin: data.margin?.toString() || '',
        opened_at: data.opened_at || '',
        closed_at: data.closed_at || '',
        period_of_day: (data.period_of_day as 'morning' | 'afternoon' | 'night') || 'morning',
        emotional_tag: data.emotional_tag || '',
        notes: data.notes || '',
        duration_minutes: data.duration_minutes?.toString() || ''
      });
      if (data.screenshot_url) {
        setScreenshotPreview(data.screenshot_url);
      }
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Screenshot must be less than 5MB');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }
    setExtractionImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setExtractionPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    } else {
      toast.error('Please drop an image file');
    }
  };

  const handleConfirmExtraction = async () => {
    if (!extractionImage) return;
    await extractTradeInfo(extractionImage);
  };

  const extractTradeInfo = async (file: File) => {
    setExtracting(true);
    setExtractedTrades([]);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        const { data, error } = await supabase.functions.invoke('extract-trade-info', {
          body: { imageBase64: base64Image }
        });

        if (error) {
          console.error('Extraction error:', error);
          toast.error('Failed to extract trade information');
          return;
        }

        if (data?.trades && data.trades.length > 0) {
          setExtractedTrades(data.trades);
          toast.success(`Extracted ${data.trades.length} trade(s) from image!`);
        } else {
          toast.error('No trades found in the image');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error extracting trade info:', error);
      toast.error('Failed to extract trade information');
    } finally {
      setExtracting(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const removeExtractionImage = () => {
    setExtractionImage(null);
    setExtractionPreview(null);
    setExtractedTrades([]);
  };

  const uploadScreenshot = async (tradeId: string): Promise<string | null> => {
    if (!screenshot || !user) return null;

    const fileExt = screenshot.name.split('.').pop();
    const fileName = `${user.id}/${tradeId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('trade-screenshots')
      .upload(fileName, screenshot, { upsert: true });

    if (uploadError) {
      console.error('Screenshot upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('trade-screenshots')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const saveExtractedTrade = async (trade: ExtractedTrade, index: number) => {
    if (!user) return;

    setSavingTrades(prev => new Set(prev).add(index));

    try {
      const tradeData = {
        user_id: user.id,
        asset: trade.asset,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        position_size: trade.position_size,
        position_type: trade.position_type,
        profit_loss: trade.profit_loss,
        funding_fee: trade.funding_fee,
        trading_fee: trade.trading_fee,
        roi: trade.roi,
        margin: trade.margin,
        opened_at: trade.opened_at,
        closed_at: trade.closed_at,
        period_of_day: trade.period_of_day,
        duration_days: trade.duration_days,
        duration_hours: trade.duration_hours,
        duration_minutes: trade.duration_minutes,
        pnl: trade.profit_loss,
        trade_date: trade.opened_at
      };

      const { error } = await supabase
        .from('trades')
        .insert(tradeData);

      if (error) {
        toast.error(`Failed to save trade ${index + 1}`);
      } else {
        toast.success(`Trade ${index + 1} saved successfully!`);
        // Remove the saved trade from the list
        setExtractedTrades(prev => prev.filter((_, i) => i !== index));
      }
    } catch (error) {
      console.error('Error saving trade:', error);
      toast.error(`Failed to save trade ${index + 1}`);
    } finally {
      setSavingTrades(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const saveAllExtractedTrades = async () => {
    if (!user || extractedTrades.length === 0) return;

    setLoading(true);

    try {
      const tradesData = extractedTrades.map(trade => ({
        user_id: user.id,
        asset: trade.asset,
        entry_price: trade.entry_price,
        exit_price: trade.exit_price,
        position_size: trade.position_size,
        position_type: trade.position_type,
        profit_loss: trade.profit_loss,
        funding_fee: trade.funding_fee,
        trading_fee: trade.trading_fee,
        roi: trade.roi,
        margin: trade.margin,
        opened_at: trade.opened_at,
        closed_at: trade.closed_at,
        period_of_day: trade.period_of_day,
        duration_days: trade.duration_days,
        duration_hours: trade.duration_hours,
        duration_minutes: trade.duration_minutes,
        pnl: trade.profit_loss,
        trade_date: trade.opened_at
      }));

      const { error } = await supabase
        .from('trades')
        .insert(tradesData);

      if (error) {
        toast.error('Failed to save trades');
      } else {
        toast.success(`All ${extractedTrades.length} trades saved successfully!`);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving trades:', error);
      toast.error('Failed to save trades');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const entry = parseFloat(formData.entry_price);
    const exit = parseFloat(formData.exit_price);
    const size = parseFloat(formData.position_size);
    
    const pnl = (exit - entry) * size;
    const roi = ((exit - entry) / entry) * 100;

    const tradeData = {
      user_id: user.id,
      asset: formData.asset,
      setup: formData.setup,
      broker: formData.broker,
      entry_price: entry,
      exit_price: exit,
      position_size: size,
      position_type: formData.position_type,
      funding_fee: parseFloat(formData.funding_fee) || 0,
      trading_fee: parseFloat(formData.trading_fee) || 0,
      margin: parseFloat(formData.margin) || null,
      opened_at: formData.opened_at || null,
      closed_at: formData.closed_at || null,
      period_of_day: formData.period_of_day,
      pnl: pnl,
      roi: roi,
      profit_loss: pnl,
      emotional_tag: formData.emotional_tag,
      notes: formData.notes,
      duration_minutes: parseInt(formData.duration_minutes) || 0,
      trade_date: formData.opened_at || new Date().toISOString()
    };

    let error;
    let tradeId = editId;

    if (editId) {
      const { error: updateError } = await supabase
        .from('trades')
        .update(tradeData)
        .eq('id', editId);
      error = updateError;
    } else {
      const { data, error: insertError } = await supabase
        .from('trades')
        .insert(tradeData)
        .select()
        .single();
      error = insertError;
      tradeId = data?.id;
    }

    if (screenshot && tradeId) {
      const screenshotUrl = await uploadScreenshot(tradeId);
      if (screenshotUrl) {
        await supabase
          .from('trades')
          .update({ screenshot_url: screenshotUrl })
          .eq('id', tradeId);
      }
    }

    setLoading(false);

    if (error) {
      toast.error('Failed to save trade');
    } else {
      toast.success(editId ? 'Trade updated successfully!' : 'Trade added successfully!');
      navigate('/dashboard');
    }
  };

  const formatDuration = (days: number, hours: number, minutes: number) => {
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.join(' ') || '0m';
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{editId ? 'Edit Trade' : 'Upload Trade'}</h1>
          <p className="text-muted-foreground">Record your trading activity manually or extract from image</p>
        </div>

        <Tabs defaultValue="ai-extract" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-extract">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Extract from Image
            </TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-extract" className="space-y-6">
            <Card className="p-6 bg-card border-border">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="extraction-image">Upload Trade Screenshot</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a screenshot containing your trade information. The AI will automatically extract all trades.
                  </p>
                  <div className="mt-2">
                    {extractionPreview ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={extractionPreview}
                            alt="Extraction preview"
                            className="w-full h-64 object-contain rounded-md border border-border bg-muted"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={removeExtractionImage}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                        {extractedTrades.length === 0 && (
                          <Button
                            onClick={handleConfirmExtraction}
                            className="w-full bg-primary text-primary-foreground"
                            disabled={extracting}
                          >
                            {extracting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Extracting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Confirm & Extract Trade Information
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                          isDragging 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-foreground/50'
                        }`}
                      >
                        <label
                          htmlFor="extraction-image"
                          className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
                        >
                          <UploadIcon className="w-12 h-12 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-1">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supports PNG, JPG, WEBP (max 10MB)
                          </p>
                          <Input
                            id="extraction-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleExtractionImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {extracting && (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <Sparkles className="w-12 h-12 animate-pulse text-primary" />
                        <div className="absolute inset-0 animate-ping">
                          <Sparkles className="w-12 h-12 text-primary/30" />
                        </div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-base font-medium">Analyzing your trade screenshot...</p>
                        <p className="text-sm text-muted-foreground">AI is extracting trade information</p>
                      </div>
                    </div>
                  </div>
                )}

                {extractedTrades.length > 0 && !extracting && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Extracted Trades ({extractedTrades.length})</h3>
                      <Button
                        onClick={saveAllExtractedTrades}
                        disabled={loading}
                        className="bg-primary text-primary-foreground"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving All...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Save All Trades
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {extractedTrades.map((trade, index) => (
                        <Card key={index} className="p-4 bg-muted/50 border-border">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Asset:</span>
                              <p className="font-medium">{trade.asset}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Position:</span>
                              <p className="font-medium capitalize">{trade.position_type}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Entry:</span>
                              <p className="font-medium">{trade.entry_price.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Exit:</span>
                              <p className="font-medium">{trade.exit_price.toFixed(2)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Size:</span>
                              <p className="font-medium">{trade.position_size}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">P&L:</span>
                              <p className={`font-medium ${trade.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.profit_loss >= 0 ? '+' : ''}{trade.profit_loss.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">ROI:</span>
                              <p className={`font-medium ${trade.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trade.roi >= 0 ? '+' : ''}{trade.roi.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duration:</span>
                              <p className="font-medium">
                                {formatDuration(trade.duration_days, trade.duration_hours, trade.duration_minutes)}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Period:</span>
                              <p className="font-medium capitalize">{trade.period_of_day}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-border">
                            <Button
                              onClick={() => saveExtractedTrade(trade, index)}
                              disabled={savingTrades.has(index)}
                              size="sm"
                              className="w-full"
                            >
                              {savingTrades.has(index) ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Saving...
                                </>
                              ) : (
                                'Save This Trade'
                              )}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card className="p-6 bg-card border-border">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Asset</label>
                    <Input
                      value={formData.asset}
                      onChange={(e) => setFormData({...formData, asset: e.target.value})}
                      placeholder="BTC/USD"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Setup</label>
                    <Input
                      value={formData.setup}
                      onChange={(e) => setFormData({...formData, setup: e.target.value})}
                      placeholder="Breakout, Reversal..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Broker</label>
                    <Input
                      value={formData.broker}
                      onChange={(e) => setFormData({...formData, broker: e.target.value})}
                      placeholder="Your broker"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Emotional Tag</label>
                    <Input
                      value={formData.emotional_tag}
                      onChange={(e) => setFormData({...formData, emotional_tag: e.target.value})}
                      placeholder="Confident, Fearful..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Entry Price</label>
                    <Input
                      type="number"
                      step="0.00000001"
                      value={formData.entry_price}
                      onChange={(e) => setFormData({...formData, entry_price: e.target.value})}
                      placeholder="0.00"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Exit Price</label>
                    <Input
                      type="number"
                      step="0.00000001"
                      value={formData.exit_price}
                      onChange={(e) => setFormData({...formData, exit_price: e.target.value})}
                      placeholder="0.00"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Position Size</label>
                    <Input
                      type="number"
                      step="0.00000001"
                      value={formData.position_size}
                      onChange={(e) => setFormData({...formData, position_size: e.target.value})}
                      placeholder="0.00"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Position Type</label>
                    <select
                      value={formData.position_type}
                      onChange={(e) => setFormData({...formData, position_type: e.target.value as 'long' | 'short'})}
                      className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="long">Long</option>
                      <option value="short">Short</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Period of Day</label>
                    <select
                      value={formData.period_of_day}
                      onChange={(e) => setFormData({...formData, period_of_day: e.target.value as 'morning' | 'afternoon' | 'night'})}
                      className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background"
                    >
                      <option value="morning">Morning (before 12:00)</option>
                      <option value="afternoon">Afternoon (12:00 - 18:00)</option>
                      <option value="night">Night (after 18:00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Funding Fee</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.funding_fee}
                      onChange={(e) => setFormData({...formData, funding_fee: e.target.value})}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Trading Fee</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.trading_fee}
                      onChange={(e) => setFormData({...formData, trading_fee: e.target.value})}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Margin</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.margin}
                      onChange={(e) => setFormData({...formData, margin: e.target.value})}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Opened At</label>
                    <Input
                      type="datetime-local"
                      value={formData.opened_at}
                      onChange={(e) => setFormData({...formData, opened_at: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Closed At</label>
                    <Input
                      type="datetime-local"
                      value={formData.closed_at}
                      onChange={(e) => setFormData({...formData, closed_at: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <Input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                      placeholder="30"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Trade notes, observations..."
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="screenshot">Trade Screenshot (Optional)</Label>
                  <div className="mt-2">
                    {screenshotPreview ? (
                      <div className="relative">
                        <img
                          src={screenshotPreview}
                          alt="Screenshot preview"
                          className="w-full h-48 object-cover rounded-md border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={removeScreenshot}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="screenshot"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-foreground/50 transition-colors"
                      >
                        <UploadIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload screenshot (max 5MB)
                        </p>
                        <Input
                          id="screenshot"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleScreenshotChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    editId ? 'Update Trade' : 'Save Trade'
                  )}
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Upload;
