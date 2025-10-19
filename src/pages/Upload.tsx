import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload as UploadIcon, X, Sparkles, Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from "@/lib/utils";
import { UploadHistory } from '@/components/UploadHistory';
import { UploadProgress, getRandomThinkingPhrase } from '@/components/UploadProgress';
import { DuplicateTradeDialog } from '@/components/DuplicateTradeDialog';
import { SuccessFeedback } from '@/components/SuccessFeedback';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ExtractedTrade {
  symbol: string;
  broker?: string;
  setup?: string;
  emotional_tag?: string;
  entry_price: number;
  exit_price: number;
  position_size: number;
  side: 'long' | 'short';
  leverage: number;
  funding_fee: number;
  trading_fee: number;
  margin: number;
  opened_at: string;
  closed_at: string;
  period_of_day: 'morning' | 'afternoon' | 'night';
  profit_loss: number;
  roi: number;
  duration_days: number;
  duration_hours: number;
  duration_minutes: number;
  notes?: string;
}

const BROKERS = [
  "AJ Bell YouInvest",
  "Binance",
  "BingX",
  "Bithumb",
  "Bitfinex",
  "Bitget",
  "Bitstamp",
  "Bybit",
  "Capital.com",
  "Charles Schwab",
  "CoinMENA",
  "Coinbase",
  "Crypto.com Exchange",
  "E*TRADE (Morgan Stanley)",
  "Fidelity Investments",
  "Gate.io",
  "Gemini",
  "Hargreaves Lansdown",
  "HSBC InvestDirect",
  "Huobi",
  "IG",
  "Interactive Brokers",
  "J.P. Morgan (Self-Directed Investing)",
  "Jupiter",
  "KGI Securities",
  "Kraken",
  "KuCoin",
  "Lim & Tan",
  "MEXC",
  "Merrill Edge",
  "Moomoo",
  "OANDA",
  "Plus500",
  "Saxo Bank / Saxo Markets",
  "Swissquote",
  "TradeStation",
  "Uniswap",
  "Vanguard",
  "eToro",
  "No Broker",
  "Other"
].sort();

const Upload = () => {
  useKeyboardShortcuts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3 | 4>(1);
  const [processingMessage, setProcessingMessage] = useState('');
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    trade?: ExtractedTrade & { existingDate?: string; existingSymbol?: string; existingPnl?: number };
    index?: number;
  }>({ open: false });
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedTradesCount, setSavedTradesCount] = useState(0);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [extractionImage, setExtractionImage] = useState<File | null>(null);
  const [extractionPreview, setExtractionPreview] = useState<string | null>(null);
  const [extractedTrades, setExtractedTrades] = useState<ExtractedTrade[]>([]);
  const [savingTrades, setSavingTrades] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [tradeEdits, setTradeEdits] = useState<Record<number, Partial<ExtractedTrade>>>({});
  const [openBroker, setOpenBroker] = useState(false);
  const [openExtractedBroker, setOpenExtractedBroker] = useState<number | null>(null);
  const [userSetups, setUserSetups] = useState<{ id: string; name: string }[]>([]);
  const [openSetup, setOpenSetup] = useState(false);
  const [openExtractedSetup, setOpenExtractedSetup] = useState<number | null>(null);
  const [setupSearch, setSetupSearch] = useState('');
  const [extractedSetupSearches, setExtractedSetupSearches] = useState<Record<number, string>>({});
  
  const [formData, setFormData] = useState({
    symbol: '',
    setup: '',
    broker: '',
    entry_price: '',
    exit_price: '',
    position_size: '',
    side: 'long' as 'long' | 'short',
    leverage: '1',
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

  // Rotating quotes shown during analysis
  const quotes = [
    { text: "The stock market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
    { text: "Profits take time to develop.", author: "Jesse Livermore" },
    { text: "You need patience to wait for the right trade and courage to take it when it comes.", author: "Paul Tudor Jones" },
    { text: "Patience and conviction are equally important.", author: "Stanley Druckenmiller" },
  ];
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    if (extracting) {
      const id = setInterval(() => {
        setQuoteIndex((i) => (i + 1) % quotes.length);
      }, 4000);
      return () => clearInterval(id);
    } else {
      setQuoteIndex(0);
    }
  }, [extracting]);

  useEffect(() => {
    if (editId) {
      fetchTrade(editId);
    }
    fetchUserSetups();
  }, [editId]);

  const fetchTrade = async (id: string) => {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      toast.error('Failed to load trade');
      return;
    }

    if (data) {
      setFormData({
        symbol: data.symbol,
        setup: data.setup || '',
        broker: data.broker || '',
        entry_price: data.entry_price.toString(),
        exit_price: data.exit_price.toString(),
        position_size: data.position_size.toString(),
        side: (data.side as 'long' | 'short') || 'long',
        leverage: data.leverage?.toString() || '1',
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

  const fetchUserSetups = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_setups')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (data) {
      setUserSetups(data);
    }
  };

  const handleCreateSetup = async (name: string) => {
    if (!user || !name.trim()) return null;

    const { data, error } = await supabase
      .from('user_setups')
      .insert({ user_id: user.id, name: name.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.error('This setup already exists');
      } else {
        toast.error('Failed to create setup');
      }
      return null;
    }

    toast.success('Setup created!');
    fetchUserSetups();
    return data;
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

  const compressAndResizeImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          // Calculate new dimensions (max 1920px on longest side)
          let width = img.width;
          let height = img.height;
          const maxSize = 1920;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality compression (JPEG at 85% quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const processImageFile = async (file: File) => {
    // Check file size (20MB limit before compression)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image file is too large', {
        description: 'Please upload an image smaller than 20MB'
      });
      return;
    }

    try {
      toast.info('Processing image...', { duration: 1000 });
      
      // Compress and resize the image
      const compressedBase64 = await compressAndResizeImage(file);
      
      setExtractionImage(file);
      setExtractionPreview(compressedBase64);
      
      toast.success('Image ready for extraction!');
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error('Failed to process image', {
        description: 'Please try with a different image'
      });
    }
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
    if (!extractionPreview || extracting) return;
    setExtracting(true);
    setUploadStep(1);
    setProcessingMessage(getRandomThinkingPhrase());
    
    toast.info('🔍 Starting AI extraction...', {
      description: 'Analyzing your trade screenshot',
      duration: 2000
    });
    
    try {
      await extractTradeInfo();
    } catch (error) {
      console.error('Error in extraction:', error);
      setExtracting(false);
    }
  };

  const extractTradeInfo = async () => {
    setExtractedTrades([]);

    try {
      // Step 1: Uploading
      setUploadStep(1);
      setProcessingMessage('Preparing your image...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Extracting data
      setUploadStep(2);
      setProcessingMessage(getRandomThinkingPhrase());
      
      const { data, error } = await supabase.functions.invoke('extract-trade-info', {
        body: { imageBase64: extractionPreview }
      });

      if (error) {
        console.error('Extraction error:', error);
        const status = (error as any)?.status || (error as any)?.cause?.status;
        const errMsg = (data as any)?.error || (error as any)?.message || 'Failed to extract trade information';
        const isCredits = status === 402 || /credit/i.test(errMsg);
        const isRateLimited = status === 429 || /rate limit/i.test(errMsg);
        toast.error(isCredits ? 'AI credits exhausted' : isRateLimited ? 'Too many requests' : errMsg, {
          description: isCredits
            ? 'Please try again later.'
            : isRateLimited
              ? 'Please slow down and retry in a minute.'
              : 'Please try again or enter manually',
        });
        return;
      }

      if (data?.trades && data.trades.length > 0) {
        // Step 3: Checking duplicates
        setUploadStep(3);
        setProcessingMessage('Scanning for duplicate trades...');
        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 4: Complete
        setUploadStep(4);
        setProcessingMessage('Trade extraction complete!');
        
        setExtractedTrades(data.trades);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.success(`✅ Extracted ${data.trades.length} trade(s) from image!`, {
          description: 'Review and save your trades below'
        });
      } else {
        toast.error('No trades found in the image', {
          description: 'Please check if the image is clear and contains trade information'
        });
      }
    } catch (error) {
      console.error('Error extracting trade info:', error);
      toast.error('Failed to extract trade information', {
        description: 'An unexpected error occurred'
      });
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

    // Create signed URL with 24-hour expiry
    const { data, error: signedUrlError } = await supabase.storage
      .from('trade-screenshots')
      .createSignedUrl(fileName, 86400); // 24 hours

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return null;
    }

    return data.signedUrl;
  };

  const updateTradeField = (index: number, field: keyof ExtractedTrade, value: string | number) => {
    setTradeEdits(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value
      }
    }));
  };

  const removeExtractedTrade = (index: number) => {
    setExtractedTrades(prev => prev.filter((_, i) => i !== index));
    // Clean up any edits for this trade
    setTradeEdits(prev => {
      const newEdits = { ...prev };
      delete newEdits[index];
      // Reindex remaining edits
      const reindexed: Record<number, Partial<ExtractedTrade>> = {};
      Object.keys(newEdits).forEach(key => {
        const oldIndex = parseInt(key);
        const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
        reindexed[newIndex] = newEdits[oldIndex];
      });
      return reindexed;
    });
    toast.info('Trade removed from batch');
  };

  const saveExtractedTrade = async (trade: ExtractedTrade, index: number) => {
    // This function is no longer needed as we only save all trades at once
  };

  const saveAllExtractedTrades = async () => {
    if (!user || extractedTrades.length === 0) return;

    setLoading(true);

    try {
      // Check for duplicates before saving
      const tradesData = extractedTrades.map((trade, index) => {
        const edits = tradeEdits[index] || {};
        const finalTrade = { ...trade, ...edits };
        
        // Create trade hash for duplicate detection
        const tradeHash = `${finalTrade.symbol}_${finalTrade.opened_at}_${finalTrade.roi}_${finalTrade.profit_loss}`;
        
        return {
          user_id: user.id,
          symbol: finalTrade.symbol,
          symbol_temp: finalTrade.symbol,
          broker: finalTrade.broker || null,
          setup: finalTrade.setup || null,
          emotional_tag: finalTrade.emotional_tag || null,
          entry_price: finalTrade.entry_price,
          exit_price: finalTrade.exit_price,
          position_size: finalTrade.position_size,
          side: finalTrade.side,
          side_temp: finalTrade.side,
          leverage: finalTrade.leverage || 1,
          profit_loss: finalTrade.profit_loss,
          funding_fee: finalTrade.funding_fee,
          trading_fee: finalTrade.trading_fee,
          roi: finalTrade.roi,
          margin: finalTrade.margin,
          opened_at: finalTrade.opened_at,
          closed_at: finalTrade.closed_at,
          period_of_day: finalTrade.period_of_day,
          duration_days: finalTrade.duration_days,
          duration_hours: finalTrade.duration_hours,
          duration_minutes: finalTrade.duration_minutes,
          pnl: finalTrade.profit_loss,
          trade_date: finalTrade.opened_at,
          notes: finalTrade.notes || null,
          trade_hash: tradeHash
        };
      });

      // Check for duplicates
      const hashes = tradesData.map(t => t.trade_hash);
      const { data: existingTrades } = await supabase
        .from('trades')
        .select('trade_hash, symbol, trade_date, pnl')
        .eq('user_id', user.id)
        .in('trade_hash', hashes);

      if (existingTrades && existingTrades.length > 0) {
        // Found duplicates - show dialog
        const firstDuplicate = existingTrades[0];
        const duplicateTradeIndex = tradesData.findIndex(t => t.trade_hash === firstDuplicate.trade_hash);
        
        setDuplicateDialog({
          open: true,
          trade: {
            ...extractedTrades[duplicateTradeIndex],
            existingDate: firstDuplicate.trade_date,
            existingSymbol: firstDuplicate.symbol,
            existingPnl: firstDuplicate.pnl
          },
          index: duplicateTradeIndex
        });
        
        setLoading(false);
        return;
      }

      // No duplicates, proceed with save
      const { data: insertedTrades, error } = await supabase
        .from('trades')
        .insert(tradesData)
        .select('id, symbol, profit_loss');

      if (error) {
        toast.error('Failed to save trades');
      } else {
        // Create upload batch record
        const assets = [...new Set(tradesData.map(t => t.symbol))];
        const totalEntryValue = tradesData.reduce((sum, t) => sum + (t.entry_price * t.position_size), 0);
        const mostRecentTrade = insertedTrades?.[0];

        const { error: batchError } = await supabase.from('upload_batches').insert({
          user_id: user.id,
          trade_count: extractedTrades.length,
          assets: assets,
          total_entry_value: totalEntryValue,
          most_recent_trade_id: mostRecentTrade?.id,
          most_recent_trade_asset: mostRecentTrade?.symbol,
          most_recent_trade_value: mostRecentTrade?.profit_loss
        });

        if (batchError) {
          console.error('Batch creation error:', batchError);
        }

        // Show success feedback
        setSavedTradesCount(extractedTrades.length);
        setShowSuccess(true);
        
        toast.success(`Successfully saved ${extractedTrades.length} trade(s)!`);
        
        // Wait for success animation then navigate
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
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
      symbol: formData.symbol,
      symbol_temp: formData.symbol,
      setup: formData.setup,
      broker: formData.broker,
      entry_price: entry,
      exit_price: exit,
      position_size: size,
      side: formData.side,
      side_temp: formData.side,
      leverage: parseFloat(formData.leverage) || 1,
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
                          <>
                            <Button
                              onClick={handleConfirmExtraction}
                              className={cn(
                                "w-full transition-all duration-200",
                                extracting
                                  ? "bg-muted text-muted-foreground cursor-not-allowed border border-border hover:scale-100 active:scale-100"
                                  : "bg-primary text-primary-foreground active:scale-95 hover:scale-[1.02]"
                              )}
                              disabled={extracting}
                              size="lg"
                              aria-disabled={extracting}
                              aria-busy={extracting}
                            >
                              {extracting ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span className="font-medium">Loading...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  <span className="font-medium">Confirm & Extract Trade Information</span>
                                </>
                              )}
                            </Button>

                            {extracting && (
                              <div className="mt-6 space-y-6">
                                <UploadProgress step={uploadStep} processingMessage={processingMessage} />
                                <div className="text-center max-w-2xl mx-auto">
                                  <p className="text-sm md:text-base font-medium">"{quotes[quoteIndex].text}"</p>
                                  <p className="text-xs md:text-sm text-muted-foreground mt-1">— {quotes[quoteIndex].author}</p>
                                </div>
                              </div>
                            )}
                          </>
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


                {extractedTrades.length > 0 && !extracting && !showSuccess && (
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
                      {extractedTrades.map((trade, index) => {
                        const edits = tradeEdits[index] || {};
                        return (
                          <Card key={index} className="p-4 bg-muted/50 border-border space-y-4">
                            <div className="mb-3 pb-2 border-b border-border flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-sm">Trade #{index + 1} - Review & Edit</h4>
                                <p className="text-xs text-muted-foreground">AI extracted this data. Please verify and correct if needed.</p>
                              </div>
                              <Button
                                onClick={() => removeExtractedTrade(index)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Symbol *</Label>
                                <Input
                                  value={edits.symbol ?? trade.symbol}
                                  onChange={(e) => updateTradeField(index, 'symbol', e.target.value)}
                                  className="mt-1 h-8 text-sm"
                                  placeholder="BTC/USDT"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Position Type *</Label>
                                <select
                                  value={edits.side ?? trade.side}
                                  onChange={(e) => updateTradeField(index, 'side', e.target.value as 'long' | 'short')}
                                  className="mt-1 w-full h-8 px-2 text-sm border border-border rounded-md bg-background"
                                >
                                  <option value="long">Long</option>
                                  <option value="short">Short</option>
                                </select>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Entry Price *</Label>
                                <Input
                                  type="number"
                                  step="0.00000001"
                                  value={edits.entry_price ?? trade.entry_price}
                                  onChange={(e) => updateTradeField(index, 'entry_price', parseFloat(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Exit Price *</Label>
                                <Input
                                  type="number"
                                  step="0.00000001"
                                  value={edits.exit_price ?? trade.exit_price}
                                  onChange={(e) => updateTradeField(index, 'exit_price', parseFloat(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Position Size *</Label>
                                <Input
                                  type="number"
                                  step="0.00000001"
                                  value={edits.position_size ?? trade.position_size}
                                  onChange={(e) => updateTradeField(index, 'position_size', parseFloat(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Leverage</Label>
                                <Input
                                  type="number"
                                  step="1"
                                  value={edits.leverage ?? trade.leverage}
                                  onChange={(e) => updateTradeField(index, 'leverage', parseFloat(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">P&L *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={edits.profit_loss ?? trade.profit_loss}
                                  onChange={(e) => updateTradeField(index, 'profit_loss', parseFloat(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">ROI % *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={edits.roi ?? trade.roi}
                                  onChange={(e) => updateTradeField(index, 'roi', parseFloat(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Funding Fee</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={edits.funding_fee ?? trade.funding_fee}
                                  onChange={(e) => updateTradeField(index, 'funding_fee', parseFloat(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Trading Fee</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={edits.trading_fee ?? trade.trading_fee}
                                  onChange={(e) => updateTradeField(index, 'trading_fee', parseFloat(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Period of Day</Label>
                                <select
                                  value={edits.period_of_day ?? trade.period_of_day}
                                  onChange={(e) => updateTradeField(index, 'period_of_day', e.target.value as 'morning' | 'afternoon' | 'night')}
                                  className="mt-1 w-full h-8 px-2 text-sm border border-border rounded-md bg-background"
                                >
                                  <option value="morning">Morning</option>
                                  <option value="afternoon">Afternoon</option>
                                  <option value="night">Night</option>
                                </select>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-muted-foreground">Margin</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={edits.margin ?? trade.margin ?? 0}
                                  onChange={(e) => updateTradeField(index, 'margin', parseFloat(e.target.value))}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Broker</Label>
                                <Popover open={openExtractedBroker === index} onOpenChange={(open) => setOpenExtractedBroker(open ? index : null)}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openExtractedBroker === index}
                                      className="w-full justify-between mt-1 h-8 text-sm"
                                    >
                                      {(edits.broker ?? trade.broker) || "Select broker..."}
                                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0 bg-popover z-50" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search broker..." />
                                      <CommandList>
                                        <CommandEmpty>No broker found.</CommandEmpty>
                                        <CommandGroup>
                                          {BROKERS.map((broker) => (
                                            <CommandItem
                                              key={broker}
                                              value={broker}
                                              onSelect={() => {
                                                if (broker === "Other") {
                                                  const custom = prompt("Enter broker name:");
                                                  if (custom && custom.trim()) {
                                                    updateTradeField(index, 'broker', custom.trim());
                                                  }
                                                } else {
                                                  updateTradeField(index, 'broker', broker);
                                                }
                                                setOpenExtractedBroker(null);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  (edits.broker ?? trade.broker) === broker ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              {broker}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Setup</Label>
                                <Popover open={openExtractedSetup === index} onOpenChange={(open) => setOpenExtractedSetup(open ? index : null)}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openExtractedSetup === index}
                                      className="w-full justify-between mt-1 h-8 text-sm"
                                    >
                                      {(edits.setup ?? trade.setup) || "Select or create setup..."}
                                      <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0 bg-popover z-50" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput 
                                        placeholder="Search or type new setup..." 
                                        value={extractedSetupSearches[index] || ''}
                                        onValueChange={(value) => setExtractedSetupSearches(prev => ({ ...prev, [index]: value }))}
                                      />
                                      <CommandList>
                                        <CommandEmpty>Type to create your first setup.</CommandEmpty>
                                        {extractedSetupSearches[index] && !userSetups.some(s => s.name.toLowerCase() === extractedSetupSearches[index].toLowerCase()) && (
                                          <CommandGroup heading="Create New">
                                            <CommandItem
                                              onSelect={async () => {
                                                const newSetup = await handleCreateSetup(extractedSetupSearches[index]);
                                                if (newSetup) {
                                                  updateTradeField(index, 'setup', newSetup.name);
                                                }
                                                setExtractedSetupSearches(prev => ({ ...prev, [index]: '' }));
                                                setOpenExtractedSetup(null);
                                              }}
                                            >
                                              <Plus className="mr-2 h-4 w-4" />
                                              Add "{extractedSetupSearches[index]}"
                                            </CommandItem>
                                          </CommandGroup>
                                        )}
                                        {userSetups.filter(setup => 
                                          !extractedSetupSearches[index] || 
                                          setup.name.toLowerCase().includes(extractedSetupSearches[index].toLowerCase())
                                        ).length > 0 && (
                                          <CommandGroup heading="Existing Setups">
                                            {userSetups
                                              .filter(setup => 
                                                !extractedSetupSearches[index] || 
                                                setup.name.toLowerCase().includes(extractedSetupSearches[index].toLowerCase())
                                              )
                                              .map((setup) => (
                                                <CommandItem
                                                  key={setup.id}
                                                  value={setup.name}
                                                  onSelect={() => {
                                                    updateTradeField(index, 'setup', setup.name);
                                                    setExtractedSetupSearches(prev => ({ ...prev, [index]: '' }));
                                                    setOpenExtractedSetup(null);
                                                  }}
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      (edits.setup ?? trade.setup) === setup.name ? "opacity-100" : "opacity-0"
                                                    )}
                                                  />
                                                  {setup.name}
                                                </CommandItem>
                                              ))}
                                          </CommandGroup>
                                        )}
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Emotional Tag</Label>
                                {(edits.emotional_tag ?? trade.emotional_tag) ? (
                                  <div className="mt-1 flex items-center gap-2">
                                    <Badge variant="secondary" className="h-8 text-sm">
                                      {edits.emotional_tag ?? trade.emotional_tag}
                                      <X 
                                        className="ml-2 h-3 w-3 cursor-pointer hover:text-destructive" 
                                        onClick={() => updateTradeField(index, 'emotional_tag', '')}
                                      />
                                    </Badge>
                                  </div>
                                ) : (
                                  <Input
                                    placeholder="Type and press Enter..."
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        updateTradeField(index, 'emotional_tag', e.currentTarget.value.trim());
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                    className="mt-1 h-8 text-sm"
                                  />
                                )}
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Notes</Label>
                                <Input
                                  placeholder="Trade observations..."
                                  value={edits.notes ?? trade.notes ?? ''}
                                  onChange={(e) => updateTradeField(index, 'notes', e.target.value)}
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Success Feedback */}
                {showSuccess && (
                  <SuccessFeedback
                    tradesCount={savedTradesCount}
                    onViewDashboard={() => navigate('/dashboard')}
                    onViewHistory={() => {
                      setShowSuccess(false);
                      navigate('/dashboard?tab=history');
                    }}
                  />
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
                      value={formData.symbol}
                      onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                      placeholder="BTC/USD"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Setup</label>
                    <Popover open={openSetup} onOpenChange={setOpenSetup}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openSetup}
                          className="w-full justify-between mt-1"
                        >
                          {formData.setup || "Select or create setup..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Search or type new setup..." 
                            value={setupSearch}
                            onValueChange={setSetupSearch}
                          />
                          <CommandList>
                            {userSetups.length === 0 && !setupSearch ? (
                              <CommandEmpty>No setups yet. Type to create one.</CommandEmpty>
                            ) : (
                              <>
                                {setupSearch && !userSetups.some(s => s.name.toLowerCase() === setupSearch.toLowerCase()) && (
                                  <CommandGroup heading="Create New">
                                    <CommandItem
                                      onSelect={async () => {
                                        const newSetup = await handleCreateSetup(setupSearch);
                                        if (newSetup) {
                                          setFormData({...formData, setup: newSetup.name});
                                        }
                                        setSetupSearch('');
                                        setOpenSetup(false);
                                      }}
                                    >
                                      <Plus className="mr-2 h-4 w-4" />
                                      Create "{setupSearch}"
                                    </CommandItem>
                                  </CommandGroup>
                                )}
                                {userSetups.filter(s => !setupSearch || s.name.toLowerCase().includes(setupSearch.toLowerCase())).length > 0 && (
                                  <CommandGroup heading="Your Setups">
                                    {userSetups
                                      .filter(s => !setupSearch || s.name.toLowerCase().includes(setupSearch.toLowerCase()))
                                      .map((setup) => (
                                        <CommandItem
                                          key={setup.id}
                                          value={setup.name}
                                          onSelect={() => {
                                            setFormData({...formData, setup: setup.name});
                                            setSetupSearch('');
                                            setOpenSetup(false);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.setup === setup.name ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {setup.name}
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                )}
                              </>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Broker</label>
                    <Popover open={openBroker} onOpenChange={setOpenBroker}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openBroker}
                          className="w-full justify-between mt-1"
                        >
                          {formData.broker || "Select broker..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search broker..." />
                          <CommandList>
                            <CommandEmpty>No broker found.</CommandEmpty>
                            <CommandGroup>
                              {BROKERS.map((broker) => (
                                <CommandItem
                                  key={broker}
                                  value={broker}
                                  onSelect={(currentValue) => {
                                    const selectedBroker = BROKERS.find(b => b.toLowerCase() === currentValue);
                                    if (selectedBroker === "Other") {
                                      const custom = prompt("Enter broker name:");
                                      if (custom && custom.trim()) {
                                        setFormData({...formData, broker: custom.trim()});
                                      }
                                    } else if (selectedBroker) {
                                      setFormData({...formData, broker: selectedBroker});
                                    }
                                    setOpenBroker(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.broker === broker ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {broker}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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
                    <label className="text-sm font-medium">Leverage</label>
                    <Input
                      type="number"
                      step="1"
                      value={formData.leverage}
                      onChange={(e) => setFormData({...formData, leverage: e.target.value})}
                      placeholder="1"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Position Type</label>
                    <select
                      value={formData.side}
                      onChange={(e) => setFormData({...formData, side: e.target.value as 'long' | 'short'})}
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

        <UploadHistory />
      </div>

      {/* Duplicate Trade Detection Dialog */}
      <DuplicateTradeDialog
        open={duplicateDialog.open}
        onOpenChange={(open) => setDuplicateDialog({ open })}
        onContinue={async () => {
          setDuplicateDialog({ open: false });
          // Continue with save, ignoring duplicate check
          if (!user || extractedTrades.length === 0) return;
          
          setLoading(true);
          
          try {
            const tradesData = extractedTrades.map((trade, index) => {
              const edits = tradeEdits[index] || {};
              const finalTrade = { ...trade, ...edits };
              const tradeHash = `${finalTrade.symbol}_${finalTrade.opened_at}_${finalTrade.roi}_${finalTrade.profit_loss}`;
              
              return {
                user_id: user.id,
                symbol: finalTrade.symbol,
                symbol_temp: finalTrade.symbol,
                broker: finalTrade.broker || null,
                setup: finalTrade.setup || null,
                emotional_tag: finalTrade.emotional_tag || null,
                entry_price: finalTrade.entry_price,
                exit_price: finalTrade.exit_price,
                position_size: finalTrade.position_size,
                side: finalTrade.side,
                side_temp: finalTrade.side,
                leverage: finalTrade.leverage || 1,
                profit_loss: finalTrade.profit_loss,
                funding_fee: finalTrade.funding_fee,
                trading_fee: finalTrade.trading_fee,
                roi: finalTrade.roi,
                margin: finalTrade.margin,
                opened_at: finalTrade.opened_at,
                closed_at: finalTrade.closed_at,
                period_of_day: finalTrade.period_of_day,
                duration_days: finalTrade.duration_days,
                duration_hours: finalTrade.duration_hours,
                duration_minutes: finalTrade.duration_minutes,
                pnl: finalTrade.profit_loss,
                trade_date: finalTrade.opened_at,
                notes: finalTrade.notes || null,
                trade_hash: tradeHash
              };
            });

            const { data: insertedTrades, error } = await supabase
              .from('trades')
              .insert(tradesData)
              .select('id, symbol, profit_loss');

            if (!error) {
              const assets = [...new Set(tradesData.map(t => t.symbol))];
              const totalEntryValue = tradesData.reduce((sum, t) => sum + (t.entry_price * t.position_size), 0);
              const mostRecentTrade = insertedTrades?.[0];

              await supabase.from('upload_batches').insert({
                user_id: user.id,
                trade_count: extractedTrades.length,
                assets: assets,
                total_entry_value: totalEntryValue,
                most_recent_trade_id: mostRecentTrade?.id,
                most_recent_trade_asset: mostRecentTrade?.symbol,
                most_recent_trade_value: mostRecentTrade?.profit_loss
              });

              toast.success(`✅ ${extractedTrades.length} trade${extractedTrades.length > 1 ? 's' : ''} saved!`);
              setExtractedTrades([]);
              setTradeEdits({});
              removeExtractionImage();
            } else {
              toast.error('Failed to save trades');
            }
          } finally {
            setLoading(false);
          }
        }}
        duplicateDate={duplicateDialog.trade?.existingDate}
        duplicateSymbol={duplicateDialog.trade?.existingSymbol}
        duplicatePnl={duplicateDialog.trade?.existingPnl}
      />
    </AppLayout>
  );
};

export default Upload;
