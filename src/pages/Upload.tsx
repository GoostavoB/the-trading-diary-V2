import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, FileSpreadsheet, Check, ChevronsUpDown, Plus, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { UploadHistory } from '@/components/UploadHistory';
import { DuplicateTradeDialog } from '@/components/DuplicateTradeDialog';
import { BatchDuplicateDialog } from '@/components/BatchDuplicateDialog';
import { SuccessFeedback } from '@/components/SuccessFeedback';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { BrokerSelect } from '@/components/upload/BrokerSelect';
import { TradeSelectionModal } from '@/components/upload/TradeSelectionModal';
import { BulkReviewModal } from '@/components/upload/BulkReviewModal';
import { ManualTradeEntryModal } from '@/components/upload/ManualTradeEntryModal';
import { SmartUpload } from '@/components/upload/SmartUpload';
import { usePageMeta } from '@/hooks/usePageMeta';
import { pageMeta } from '@/utils/seoHelpers';
import { CSVUpload } from '@/components/upload/CSVUpload';
import { UploadErrorBoundary } from '@/components/upload/UploadErrorBoundary';
import { TradeEditCard } from '@/components/upload/TradeEditCard';
import { useQuery } from '@tanstack/react-query';
import { useTradeXPRewards } from '@/hooks/useTradeXPRewards';
import type { Trade } from '@/types/trade';
import { DailyUploadStatus } from '@/components/upload/DailyUploadStatus';
import { useDailyUploadLimit } from '@/hooks/useDailyUploadLimit';
import { UpgradePrompt } from '@/components/UpgradePrompt';

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

const Upload = () => {
  useKeyboardShortcuts();
  usePageMeta(pageMeta.upload);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Query for recent trades to process XP rewards
  const { data: recentTrades = [] } = useQuery({
    queryKey: ['recent-trades-for-xp', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error fetching trades for XP:', error);
        return [];
      }
      
      return data as Trade[];
    },
    enabled: !!user?.id,
    staleTime: 5000,
  });

  useTradeXPRewards(recentTrades);
  
  const { canUpload, remainingUploads } = useDailyUploadLimit();
  const [showUpgradeLimitPrompt, setShowUpgradeLimitPrompt] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    trade?: ExtractedTrade & { existingDate?: string; existingSymbol?: string; existingPnl?: number };
    index?: number;
  }>({ open: false });
  const [batchDuplicates, setBatchDuplicates] = useState<{
    open: boolean;
    duplicates: Array<{
      tradeIndex: number;
      trade: ExtractedTrade;
      existing: { symbol: string; trade_date: string; pnl: number };
    }>;
  }>({ open: false, duplicates: [] });
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedTradesCount, setSavedTradesCount] = useState(0);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [extractedTrades, setExtractedTrades] = useState<ExtractedTrade[]>([]);
  const [tradeEdits, setTradeEdits] = useState<Record<number, Partial<ExtractedTrade>>>({});
  const [userSetups, setUserSetups] = useState<{ id: string; name: string }[]>([]);
  const [openSetup, setOpenSetup] = useState(false);
  const [setupSearch, setSetupSearch] = useState('');
  
  // Vision extraction states
  const [allExtractedTrades, setAllExtractedTrades] = useState<ExtractedTrade[]>([]);
  const [showTradeSelection, setShowTradeSelection] = useState(false);
  const [showBulkReview, setShowBulkReview] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
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

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const updateTradeField = (index: number, field: string, value: any) => {
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
    setTradeEdits(prev => {
      const newEdits = { ...prev };
      delete newEdits[index];
      return newEdits;
    });
  };

  const saveAllExtractedTrades = async () => {
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

        setSavedTradesCount(extractedTrades.length);
        setShowSuccess(true);
        setExtractedTrades([]);
        setTradeEdits({});
        toast.success(`${extractedTrades.length} trade${extractedTrades.length > 1 ? 's' : ''} saved successfully!`);
      } else {
        console.error('Error saving trades:', error);
        toast.error('Failed to save trades', {
          description: error.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      let screenshotUrl = screenshotPreview;
      
      if (screenshot && screenshot instanceof File) {
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('trade-screenshots')
          .upload(fileName, screenshot);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('trade-screenshots')
          .getPublicUrl(fileName);

        screenshotUrl = publicUrl;
      }

      const profit_loss = (parseFloat(formData.exit_price) - parseFloat(formData.entry_price)) * parseFloat(formData.position_size);
      const roi = (profit_loss / (parseFloat(formData.entry_price) * parseFloat(formData.position_size))) * 100;

      const tradeData = {
        user_id: user.id,
        symbol: formData.symbol,
        symbol_temp: formData.symbol,
        side: formData.side,
        side_temp: formData.side,
        broker: formData.broker || null,
        setup: formData.setup || null,
        emotional_tag: formData.emotional_tag || null,
        entry_price: parseFloat(formData.entry_price),
        exit_price: parseFloat(formData.exit_price),
        position_size: parseFloat(formData.position_size),
        leverage: parseInt(formData.leverage) || 1,
        funding_fee: parseFloat(formData.funding_fee) || 0,
        trading_fee: parseFloat(formData.trading_fee) || 0,
        margin: parseFloat(formData.margin) || 0,
        opened_at: formData.opened_at,
        closed_at: formData.closed_at,
        period_of_day: formData.period_of_day,
        profit_loss,
        pnl: profit_loss,
        roi,
        trade_date: formData.opened_at,
        duration_minutes: parseInt(formData.duration_minutes) || null,
        notes: formData.notes || null,
        screenshot_url: screenshotUrl,
      };

      if (editId) {
        const { error } = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', editId);

        if (error) throw error;
        toast.success('Trade updated successfully');
      } else {
        const { error } = await supabase
          .from('trades')
          .insert(tradeData);

        if (error) throw error;
        toast.success('Trade saved successfully');
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving trade:', error);
      toast.error('Failed to save trade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">{editId ? 'Edit Trade' : 'Upload Trade'}</h1>
        <p className="text-muted-foreground">Record your trading activity</p>
      </div>
        
        <DailyUploadStatus />

        {/* Hero: Smart Upload */}
        <SmartUpload 
          onTradesExtracted={(trades) => {
            setAllExtractedTrades(trades);
            if (trades.length > 10) {
              setShowTradeSelection(true);
            } else {
              setExtractedTrades(trades);
              toast.success(`Extracted ${trades.length} trade${trades.length !== 1 ? 's' : ''}!`);
            }
          }}
        />

        {/* Alternative Options - Elegant */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground/80 mb-1">Other Ways to Add Trades</h2>
            <p className="text-sm text-muted-foreground">Choose an alternative method if you prefer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {/* CSV Import Button */}
            <Button
              variant="outline"
              onClick={() => {
                const csvSection = document.getElementById('csv-upload-modal');
                if (csvSection) csvSection.click();
              }}
              className="h-auto py-6 px-6 flex-col items-start gap-3 hover:bg-accent/50 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-base mb-0.5">Import from CSV</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    Upload exchange export files
                  </div>
                </div>
              </div>
            </Button>

            {/* Manual Entry Button */}
            <Button
              variant="outline"
              onClick={() => setShowManualEntry(true)}
              className="h-auto py-6 px-6 flex-col items-start gap-3 hover:bg-accent/50 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-base mb-0.5">Enter Trade Manually</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    Fill in trade details by hand
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </div>

        {/* CSV Upload Modal (hidden trigger) */}
        <input
          id="csv-upload-modal"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // This will be handled by CSVUpload component in a modal
              // For now, we'll keep the existing CSV upload flow
            }
          }}
        />

        {/* CSV/SmartUpload Extracted Trades Preview */}
        {extractedTrades.length > 0 && (
          <Card className="p-6 glass">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Review & Import Trades</h3>
                  <p className="text-sm text-muted-foreground">
                    {extractedTrades.length} trade{extractedTrades.length !== 1 ? 's' : ''} extracted. Review and edit before importing.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setExtractedTrades([]);
                      setTradeEdits({});
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
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
              </div>

              <div className="space-y-4">
                {extractedTrades.map((trade, index) => {
                  const edits = tradeEdits[index] || {};
                  const mergedTrade = { ...trade, ...edits };
                  return (
                    <TradeEditCard
                      key={index}
                      trade={mergedTrade}
                      index={index}
                      onUpdate={updateTradeField}
                      onRemove={removeExtractedTrade}
                      userSetups={userSetups}
                      onCreateSetup={handleCreateSetup}
                    />
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        <UploadHistory />
      </div>

      {/* Modals */}
      <TradeSelectionModal
        open={showTradeSelection}
        trades={allExtractedTrades}
        onConfirm={(selectedTrades) => {
          setShowTradeSelection(false);
          setExtractedTrades(selectedTrades);
          toast.success(`Selected ${selectedTrades.length} trade${selectedTrades.length !== 1 ? 's' : ''}!`);
        }}
        onCancel={() => {
          setShowTradeSelection(false);
          setAllExtractedTrades([]);
        }}
      />

      <BulkReviewModal
        open={showBulkReview}
        trades={allExtractedTrades}
        onSaveAll={async (editedTrades) => {
          setShowBulkReview(false);
          setExtractedTrades(editedTrades);
          await saveAllExtractedTrades();
        }}
        onCancel={() => {
          setShowBulkReview(false);
          setAllExtractedTrades([]);
        }}
      />

      <ManualTradeEntryModal
        open={showManualEntry}
        onCancel={() => setShowManualEntry(false)}
        onSave={async (trade) => {
          setShowManualEntry(false);
          setExtractedTrades([trade]);
          await saveAllExtractedTrades();
        }}
      />

      {/* Dialogs */}
      <BatchDuplicateDialog
        open={batchDuplicates.open}
        duplicates={batchDuplicates.duplicates}
        onRemoveDuplicates={(indicesToRemove) => {
          const filteredTrades = extractedTrades.filter((_, index) => !indicesToRemove.includes(index));
          setExtractedTrades(filteredTrades);
          
          const newTradeEdits: Record<number, Partial<ExtractedTrade>> = {};
          let newIndex = 0;
          Object.entries(tradeEdits).forEach(([oldIndex, edits]) => {
            const oldIndexNum = parseInt(oldIndex);
            if (!indicesToRemove.includes(oldIndexNum)) {
              newTradeEdits[newIndex] = edits;
              newIndex++;
            }
          });
          setTradeEdits(newTradeEdits);
          
          setBatchDuplicates({ open: false, duplicates: [] });
          
          const remainingCount = filteredTrades.length;
          toast.success(`Removed ${indicesToRemove.length} duplicate trade${indicesToRemove.length > 1 ? 's' : ''}!`, {
            description: remainingCount > 0 
              ? `${remainingCount} unique trade${remainingCount > 1 ? 's' : ''} will be saved.` 
              : 'All trades were duplicates.',
            duration: 4000,
          });
          
          if (filteredTrades.length > 0) {
            setTimeout(() => saveAllExtractedTrades(), 100);
          }
        }}
        onSaveAll={async () => {
          const duplicateCount = batchDuplicates.duplicates.length;
          
          toast.info(`Saving all ${extractedTrades.length} trades (including ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''})`, {
            description: 'This may create duplicate entries in your trade history.',
            duration: 4000,
          });
          
          setBatchDuplicates({ open: false, duplicates: [] });
          await saveAllExtractedTrades();
        }}
        onCancel={() => {
          setBatchDuplicates({ open: false, duplicates: [] });
          setLoading(false);
        }}
      />

      <DuplicateTradeDialog
        open={duplicateDialog.open}
        onOpenChange={(open) => setDuplicateDialog({ open })}
        onContinue={async () => {
          setDuplicateDialog({ open: false });
          await saveAllExtractedTrades();
        }}
        duplicateDate={duplicateDialog.trade?.existingDate}
        duplicateSymbol={duplicateDialog.trade?.existingSymbol}
        duplicatePnl={duplicateDialog.trade?.existingPnl}
      />

      {showSuccess && (
        <SuccessFeedback
          tradesCount={savedTradesCount}
          onViewDashboard={() => navigate('/dashboard')}
          onViewHistory={() => {
            setShowSuccess(false);
            navigate('/dashboard?tab=history');
          }}
          onStayHere={() => {
            setShowSuccess(false);
            setExtractedTrades([]);
            setSavedTradesCount(0);
          }}
        />
      )}
      
      <UpgradePrompt
        open={showUpgradeLimitPrompt}
        onClose={() => setShowUpgradeLimitPrompt(false)}
        trigger="upload_limit"
        feature="more daily uploads"
      />
    </div>
  );
};

export default Upload;
