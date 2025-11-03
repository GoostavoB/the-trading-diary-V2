import { useState, useEffect, useRef } from 'react';
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
import { Upload as UploadIcon, X, Sparkles, Check, ChevronsUpDown, Plus, Trash2, MapPin, ThumbsUp, ThumbsDown, Images, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from "@/lib/utils";
import { UploadHistory } from '@/components/UploadHistory';
import { UploadProgress, getRandomThinkingPhrase } from '@/components/UploadProgress';
import { DuplicateTradeDialog } from '@/components/DuplicateTradeDialog';
import { BatchDuplicateDialog } from '@/components/BatchDuplicateDialog';
import { SuccessFeedback } from '@/components/SuccessFeedback';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useProfitMilestoneBadges } from '@/hooks/useProfitMilestoneBadges';
import { ImageAnnotator, Annotation } from '@/components/upload/ImageAnnotator';
import { BrokerSelect } from '@/components/upload/BrokerSelect';
import { EnhancedFileUpload } from '@/components/upload/EnhancedFileUpload';
import { MultiImageUpload } from '@/components/upload/MultiImageUpload';
import { AIFeedback } from '@/components/upload/AIFeedback';
import { runOCR, type OCRResult } from '@/utils/ocrPipeline';
import { usePageMeta } from '@/hooks/usePageMeta';
import { pageMeta } from '@/utils/seoHelpers';
import { CSVUpload } from '@/components/upload/CSVUpload';
import { uploadLogger } from '@/utils/uploadLogger';
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

// Broker list and management moved to BrokerSelect component

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
    staleTime: 5000, // 5 seconds
  });

  // Process XP rewards for unrewarded trades
  useTradeXPRewards(recentTrades);
  
  // Daily upload limit tracking
  const { canUpload, remainingUploads, incrementUploadCount } = useDailyUploadLimit();
  const [showUpgradeLimitPrompt, setShowUpgradeLimitPrompt] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [uploadStep, setUploadStep] = useState<1 | 2 | 3 | 4>(1);
  const [processingMessage, setProcessingMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState({
    stage: 'idle' as 'idle' | 'uploading' | 'ocr' | 'extraction' | 'parsing' | 'duplicates' | 'complete',
    percentage: 0,
    message: ''
  });
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
  const [preSelectedBroker, setPreSelectedBroker] = useState('');
  const [openPreBroker, setOpenPreBroker] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [brokerError, setBrokerError] = useState(false);
  const brokerFieldRef = useRef<HTMLDivElement>(null);
  
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

  // Cleanup loading state on unmount
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

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

  const compressAndResizeImage = async (file: File, forOCR: boolean = false): Promise<string> => {
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
          
        // Reduced max size to 1280px for cost optimization (was 1920px)
        let width = img.width;
        let height = img.height;
        const maxSize = 1280;

        if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Convert to grayscale for OCR path to improve accuracy
          if (forOCR) {
            ctx.filter = 'grayscale(100%) contrast(120%)';
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Use WebP at quality 60 for better compression (reduced from JPEG 85)
          const compressedBase64 = canvas.toDataURL('image/webp', 0.60);
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
    // Check file size limit (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image file is too large', {
        description: 'Please upload an image smaller than 20MB'
      });
      return;
    }

    try {
      toast.info('Loading image...', { duration: 500 });
      
      // Add timeout wrapper for compression (2 second max)
      const compressionTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Image compression timeout')), 2000)
      );
      
      toast.info('Compressing image...', { duration: 500 });
      
      // Compress and resize the image with timeout protection
      const compressedBase64 = await Promise.race([
        compressAndResizeImage(file, true),
        compressionTimeout
      ]);
      
      setExtractionImage(file);
      setExtractionPreview(compressedBase64);
      
      toast.info('Running OCR...', { duration: 500 });
      
      // Run OCR in background with timeout (5 seconds via runOCR)
      setOcrRunning(true);
      try {
        const ocr = await runOCR(file);
        setOcrResult(ocr);
        console.log('✅ OCR Quality Score:', ocr.qualityScore.toFixed(2), 
                    'Confidence:', ocr.confidence.toFixed(2));
        
        if (ocr.qualityScore >= 0.80) {
          toast.success('Image ready! High OCR quality - using cost-efficient processing.', {
            description: `Quality: ${Math.round(ocr.qualityScore * 100)}%`
          });
        } else {
          toast.success('Image ready for extraction!');
        }
      } catch (ocrError) {
        console.warn('⚠️ OCR failed or timeout, will use vision fallback:', ocrError);
        toast.success('Image ready for extraction!');
      } finally {
        setOcrRunning(false);
      }
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error('Failed to process image', {
        description: error instanceof Error ? error.message : 'Please try with a different image'
      });
      setOcrRunning(false);
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
    
    // Check upload limit FIRST
    if (!canUpload) {
      setShowUpgradeLimitPrompt(true);
      toast.error('Daily upload limit reached', {
        description: `You've used all ${remainingUploads} uploads today. Upgrade for more!`
      });
      return;
    }
    
    // Validate broker is selected
    if (!preSelectedBroker || preSelectedBroker.trim() === '') {
      setBrokerError(true);
      
      // Scroll to broker field
      brokerFieldRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      toast.error('Broker is required', {
        description: 'Please select a broker before extracting trade data'
      });
      return;
    }
    
    // Clear error if validation passes
    setBrokerError(false);
    
    setExtracting(true);
    setUploadStep(1);
    setProcessingMessage(getRandomThinkingPhrase());
    
    toast.info('Starting AI extraction...', {
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
    const startedAt = Date.now();
    
    uploadLogger.extraction('Starting trade extraction', {
      hasAnnotations: annotations.length > 0,
      preSelectedBroker,
      hasOCRResult: !!ocrResult
    });

    try {
      // Step 1: Uploading (0-20%)
      setUploadStep(1);
      setUploadProgress({ stage: 'uploading', percentage: 10, message: 'Uploading image...' });
      setProcessingMessage('Uploading your image...');
      uploadLogger.extraction('Step 1: Uploading image');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: OCR & AI Extraction (20-70%)
      setUploadStep(2);
      setUploadProgress({ stage: 'ocr', percentage: 30, message: 'Reading text from image...' });
      setProcessingMessage('Extracting trade data with AI...');
      uploadLogger.extraction('Step 2: OCR & AI extraction');
      
      // Guard against oversized payloads - recompress if needed
      let imageToSend = extractionPreview;
      const approxBytes = Math.floor((imageToSend?.length || 0) * 0.75);
      const LIMIT = 10 * 1024 * 1024; // 10MB
      
      if (approxBytes > LIMIT && extractionImage) {
        uploadLogger.compression('Image exceeds 10MB, recompressing', { approxBytes, limit: LIMIT });
        toast.info('Compressing large image...', { duration: 1000 });
        imageToSend = await compressAndResizeImage(extractionImage, false);
        setExtractionPreview(imageToSend);
        uploadLogger.compression('Image compressed successfully', {
          originalBytes: approxBytes,
          newBytes: Math.floor((imageToSend?.length || 0) * 0.75)
        });
      }
      
      setUploadProgress({ stage: 'extraction', percentage: 50, message: 'AI analyzing your trades...' });
      uploadLogger.extraction('Sending image to AI', {
        payloadSizeBytes: Math.floor((imageToSend?.length || 0) * 0.75),
        broker: preSelectedBroker,
        annotationCount: annotations.length
      });
      
      // Progressive timeout messages
      const progressTimer1 = setTimeout(() => {
        setProcessingMessage('Still processing your image... This can take up to 45 seconds.');
        toast.info('Still processing...', { duration: 2000 });
        uploadLogger.extraction('Processing taking longer than 15s');
      }, 15000);
      
      const progressTimer2 = setTimeout(() => {
        setProcessingMessage('Almost done... Thanks for your patience!');
        toast.info('Almost there...', { duration: 2000 });
        uploadLogger.extraction('Processing taking longer than 30s');
      }, 30000);
      
      // Extended timeout for backend call (45 seconds)
      const INVOKE_TIMEOUT_MS = 45000;
      const invokePromise = supabase.functions.invoke('extract-trade-info', {
        body: { 
          imageBase64: imageToSend,
          broker: preSelectedBroker || null,
          annotations: annotations.length > 0 ? annotations : null,
          // Include OCR data for cost optimization
          ocrText: ocrResult?.text,
          ocrConfidence: ocrResult?.confidence,
          imageHash: ocrResult?.imageHash,
          perceptualHash: ocrResult?.perceptualHash,
        }
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => {
          uploadLogger.extractionError('Extraction timeout after 45 seconds', new Error('Timeout'));
          reject(new Error('Extraction timed out after 45 seconds. Please try again or use manual entry.'));
        }, INVOKE_TIMEOUT_MS)
      );
      
      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as any;
      
      // Clear progress timers
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      if (error) {
        uploadLogger.extractionError('Edge function returned error', error);
        setUploadProgress({ stage: 'idle', percentage: 0, message: '' });
        const status = (error as any)?.status || (error as any)?.cause?.status;
        const errMsg = (data as any)?.error || (error as any)?.message || 'Failed to extract trade information';
        const errDetails = (data as any)?.details || '';
        const retryAfter = (data as any)?.retryAfter || 60;
        
        // Enhanced error messages with actions
        if (status === 402 || /credit/i.test(errMsg)) {
          uploadLogger.extractionError('Credits exhausted', new Error(errMsg));
          toast.error('No Credits Remaining', {
            description: 'You need at least 1 credit to extract trades. Purchase more credits or upgrade your plan.',
            action: {
              label: 'Get Credits',
              onClick: () => (window.location.href = '/#pricing-section')
            }
          });
        } else if (status === 429 || /rate limit/i.test(errMsg)) {
          uploadLogger.extractionError('Rate limit hit', new Error(errMsg));
          toast.error('Upload Limit Reached', {
            description: `You've reached the rate limit. Wait ${retryAfter} seconds or upgrade to Pro for unlimited uploads.`,
            duration: 6000,
            action: {
              label: 'Upgrade',
              onClick: () => (window.location.href = '/#pricing-section')
            }
          });
        } else if (/timeout/i.test(errMsg)) {
          uploadLogger.extractionError('Timeout', new Error(errMsg));
          toast.error('Processing Timeout', {
            description: 'The image took too long to process. Try with a smaller or clearer image.'
          });
        } else if (status === 401 || /unauthorized|authentication/i.test(errMsg)) {
          uploadLogger.extractionError('Auth error', new Error(errMsg));
          toast.error('Session Expired', {
            description: 'Your login session has expired. Please log in again to continue.',
            action: {
              label: 'Log In',
              onClick: () => navigate('/auth')
            }
          });
        } else if (/parse/i.test(errMsg)) {
          uploadLogger.extractionError('Parse error from AI', new Error(errMsg));
          toast.error('Invalid Trade Data', {
            description: 'The extracted data is incomplete or invalid. Please use manual entry instead.'
          });
        } else {
          uploadLogger.extractionError('Extraction failed', new Error(`${errMsg}: ${errDetails}`));
          toast.error(errMsg || 'Extraction Failed', {
            description: errDetails || error instanceof Error ? error.message : 'Could not extract trade data from this image. Please try a clearer screenshot.',
            action: errDetails ? undefined : {
              label: 'Tips',
              onClick: () => window.open('/docs/upload-tips', '_blank')
            }
          });
        }
        return;
      }

      if (data?.trades && data.trades.length > 0) {
        uploadLogger.success('Extraction', `Extracted ${data.trades.length} trades`, {
          tradeCount: data.trades.length,
          cached: data.cached
        });
        
        // Step 3: Parsing trades (70-85%)
        setUploadStep(3);
        setUploadProgress({ stage: 'parsing', percentage: 80, message: `Parsing ${data.trades.length} trades...` });
        setProcessingMessage('Parsing extracted trades...');
        uploadLogger.extraction('Step 3: Parsing trades');
        await new Promise(resolve => setTimeout(resolve, 800));

        // Step 4: Checking duplicates (85-95%)
        setUploadStep(4);
        setUploadProgress({ stage: 'duplicates', percentage: 90, message: 'Checking for duplicates...' });
        setProcessingMessage('Checking for duplicates...');
        uploadLogger.extraction('Step 4: Checking duplicates');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Normalize trades (defensive fallback for older edge function versions)
        const normalizedTrades = data.trades.map((t: any) => ({
          symbol: t.symbol ?? t.asset ?? '',
          side: (t.side ?? t.position_type ?? 'long').toLowerCase() as 'long' | 'short',
          broker: t.broker ?? '',
          setup: t.setup ?? '',
          emotional_tag: t.emotional_tag ?? '',
          entry_price: Number(t.entry_price) || 0,
          exit_price: Number(t.exit_price) || 0,
          position_size: Number(t.position_size) || 0,
          leverage: Number(t.leverage) || 1,
          profit_loss: Number(t.profit_loss) || 0,
          funding_fee: Number(t.funding_fee) || 0,
          trading_fee: Number(t.trading_fee) || 0,
          roi: Number(t.roi) || 0,
          margin: Number(t.margin) || 0,
          opened_at: t.opened_at ?? '',
          closed_at: t.closed_at ?? '',
          period_of_day: t.period_of_day ?? 'morning',
          duration_days: Number(t.duration_days) || 0,
          duration_hours: Number(t.duration_hours) || 0,
          duration_minutes: Number(t.duration_minutes) || 0,
          notes: t.notes ?? ''
        }));
        
        setExtractedTrades(normalizedTrades);
        
        // Complete! (100%)
        setUploadProgress({ stage: 'complete', percentage: 100, message: 'Extraction complete!' });
        uploadLogger.success('Extraction', 'All steps complete');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.success(`✅ Extracted ${data.trades.length} trade(s) from image!`, {
          description: 'Review and save your trades below'
        });
      } else {
        setUploadProgress({ stage: 'idle', percentage: 0, message: '' });
        uploadLogger.extraction('No trades found in response');
        toast.error('No Trades Detected', {
          description: 'Could not find any trade data in this image. Make sure the screenshot clearly shows entry/exit prices, position size, and P&L.',
          action: {
            label: 'Tips',
            onClick: () => window.open('/docs/upload-tips', '_blank')
          }
        });
      }
    } catch (error) {
      console.error('Error extracting trade info:', error);
      setUploadProgress({ stage: 'idle', percentage: 0, message: '' });
      uploadLogger.extractionError('Uncaught extraction error', error instanceof Error ? error : new Error(String(error)));
      
      if (error instanceof Error && error.message.includes('timed out')) {
        toast.error('Extraction Timed Out', {
          description: 'The image took too long to process. Try a clearer screenshot or use manual entry below.'
        });
      } else {
        toast.error('Extraction Failed', {
          description: error instanceof Error ? error.message : 'Please try again or use manual entry',
          duration: 6000
        });
      }
    } finally {
      const duration = Date.now() - startedAt;
      console.log('⏱️ Extraction duration (ms):', duration);
      setExtracting(false);
      setUploadProgress({ stage: 'idle', percentage: 0, message: '' });
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
    setAnnotations([]);
    setShowAnnotator(false);
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

    // Timeout protection (30 seconds)
    const savePromise = executeSave();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Save operation timed out after 30 seconds')), 30000)
    );

    try {
      await Promise.race([savePromise, timeoutPromise]);
    } catch (error) {
      console.error('Error saving trades:', error);
      toast.error('Failed to save trades', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeSave = async () => {
    if (!user || extractedTrades.length === 0) return;

    try {
      // Validate all trades have required fields
      const invalidTrades: string[] = [];
      const warnings: string[] = [];
      
      extractedTrades.forEach((trade, index) => {
        const edits = tradeEdits[index] || {};
        const finalTrade = { ...trade, ...edits };
        
        // Required field validation
        if (!finalTrade.symbol || finalTrade.symbol.trim() === '') {
          invalidTrades.push(`Trade #${index + 1}: Missing symbol`);
        }
        if (!finalTrade.side || (finalTrade.side !== 'long' && finalTrade.side !== 'short')) {
          invalidTrades.push(`Trade #${index + 1}: Invalid side (must be long or short)`);
        }
        
        // Warning validations (incomplete data)
        if (!finalTrade.exit_price || finalTrade.exit_price === 0) {
          warnings.push(`Trade #${index + 1} (${finalTrade.symbol}): Exit price is 0 or missing`);
        }
        if (!finalTrade.opened_at || finalTrade.opened_at === 'N/A') {
          warnings.push(`Trade #${index + 1} (${finalTrade.symbol}): Missing open timestamp`);
        }
      });

      if (invalidTrades.length > 0) {
        console.error('Invalid trades found:', invalidTrades);
        toast.error('Cannot save trades with missing data', {
          description: invalidTrades.join(', ')
        });
        return;
      }
      
      if (warnings.length > 0) {
        console.warn('Trade warnings:', warnings);
        toast.warning('Incomplete Trade Data', {
          description: `${warnings.length} trade(s) have missing data. Review before saving.`,
          duration: 8000
        });
      }

      // Check for duplicates before saving
      const tradesData = extractedTrades.map((trade, index) => {
        const edits = tradeEdits[index] || {};
        const finalTrade = { ...trade, ...edits };
        
        // Create trade hash for duplicate detection (includes both entry and exit timestamps)
        const tradeHash = `${finalTrade.symbol}_${finalTrade.opened_at}_${finalTrade.closed_at}_${finalTrade.position_size}_${Math.abs(finalTrade.profit_loss).toFixed(2)}`;
        
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
          period_of_day: finalTrade.period_of_day && ['morning', 'afternoon', 'night'].includes(finalTrade.period_of_day) ? finalTrade.period_of_day : 'morning',
          duration_days: finalTrade.duration_days,
          duration_hours: finalTrade.duration_hours,
          duration_minutes: finalTrade.duration_minutes,
          pnl: finalTrade.profit_loss,
          trade_date: finalTrade.opened_at,
          notes: finalTrade.notes || null,
          trade_hash: tradeHash,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      // Check for duplicates with error handling and timeout
      const hashes = tradesData.map(t => t.trade_hash);
      let existingTrades = null;
      let nearDuplicates = null;
      
      try {
        const { data: existing, error: existingError } = await supabase
          .from('trades')
          .select('trade_hash, symbol, trade_date, pnl, opened_at, closed_at, position_size')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .in('trade_hash', hashes)
          .abortSignal(AbortSignal.timeout(5000)); // 5 second timeout
        
        if (existingError) throw existingError;
        existingTrades = existing;
      } catch (error) {
        console.error('Duplicate check query failed:', error);
        toast.warning('Could not check for duplicates', {
          description: 'Proceeding with save. Please review your trade history manually.'
        });
      }

      // Also check for near-duplicates with time tolerance (±2 seconds)
      try {
        const symbols = [...new Set(tradesData.map(t => t.symbol))];
        const { data: near, error: nearError } = await supabase
          .from('trades')
          .select('symbol, opened_at, closed_at, position_size, pnl')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .in('symbol', symbols)
          .abortSignal(AbortSignal.timeout(5000)); // 5 second timeout
        
        if (nearError) throw nearError;
        nearDuplicates = near;
      } catch (error) {
        console.error('Near-duplicate check query failed:', error);
        // Continue without near-duplicate check
      }

      // Find exact hash matches
      let duplicateMatches: Array<{
        tradeIndex: number;
        trade: ExtractedTrade;
        existing: { symbol: string; trade_date: string; pnl: number };
      }> = [];

      if (existingTrades && existingTrades.length > 0) {
        duplicateMatches = existingTrades.map(existing => {
          const duplicateTradeIndex = tradesData.findIndex(t => t.trade_hash === existing.trade_hash);
          return {
            tradeIndex: duplicateTradeIndex,
            trade: extractedTrades[duplicateTradeIndex],
            existing: {
              symbol: existing.symbol,
              trade_date: existing.trade_date,
              pnl: existing.pnl || 0,
            },
          };
        }).filter(d => d.tradeIndex >= 0);
      }

      // Find time-tolerant duplicates (2 second tolerance on both entry and exit)
      if (nearDuplicates && nearDuplicates.length > 0) {
        tradesData.forEach((newTrade, index) => {
          // Skip if already found as exact duplicate
          if (duplicateMatches.some(d => d.tradeIndex === index)) return;

          const match = nearDuplicates.find(existing => {
            if (existing.symbol !== newTrade.symbol) return false;
            
            const entryMatch = Math.abs(
              new Date(existing.opened_at).getTime() - new Date(newTrade.opened_at).getTime()
            ) <= 2000; // 2 second tolerance
            
            const exitMatch = Math.abs(
              new Date(existing.closed_at).getTime() - new Date(newTrade.closed_at).getTime()
            ) <= 2000; // 2 second tolerance
            
            const sizeMatch = Math.abs((existing.position_size || 0) - newTrade.position_size) < 0.0001;
            const pnlMatch = Math.abs((existing.pnl || 0) - newTrade.pnl) < 0.01; // penny tolerance
            
            return entryMatch && exitMatch && sizeMatch && pnlMatch;
          });

          if (match) {
            duplicateMatches.push({
              tradeIndex: index,
              trade: extractedTrades[index],
              existing: {
                symbol: match.symbol,
                trade_date: match.opened_at,
                pnl: match.pnl || 0,
              },
            });
          }
        });
      }

      if (duplicateMatches.length > 0) {
        // Found duplicates - show warning toast immediately
        toast.warning(`Found ${duplicateMatches.length} duplicate trade${duplicateMatches.length > 1 ? 's' : ''}!`, {
          description: 'Please review the duplicates and choose whether to keep or remove them.',
          duration: 5000,
        });
        
        setBatchDuplicates({
          open: true,
          duplicates: duplicateMatches,
        });
        
        return;
      }

      // No duplicates, proceed with save
      const { data: insertedTrades, error } = await supabase
        .from('trades')
        .insert(tradesData)
        .select('id, symbol, profit_loss');

      if (error) {
        console.error('Error saving trades:', error);
        console.error('Failed trade data:', JSON.stringify(tradesData, null, 2));
        toast.error('Failed to save trades', {
          description: `${error.message || 'Database error'}. Check console for details.`
        });
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

        // Check profit milestone badges after successful save
        const totalProfit = tradesData.reduce((sum, t) => sum + (t.profit_loss || 0), 0);
        
        // Fetch all user trades to get accurate total
        const { data: allTrades } = await supabase
          .from('trades')
          .select('profit_loss')
          .eq('user_id', user.id);
        
        const totalTradingProfit = (allTrades || []).reduce((sum, t) => sum + (t.profit_loss || 0), 0);
        
        // Trigger badge check (this hook will handle the actual check internally)
        // Note: We're not using the hook here directly since we're in an async function
        // The dashboard will pick up the new badges on next render

        // Increment upload counter
        await incrementUploadCount();
        
        // Show success feedback
        setSavedTradesCount(extractedTrades.length);
        setShowSuccess(true);
        
        toast.success(`Successfully saved ${extractedTrades.length} trade(s)!`);
        
        // Mark onboarding as completed (for guided tour)
        await supabase
          .from('user_settings')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id);

        // Clear extracted trades and navigate to dashboard
        setExtractedTrades([]);
        setTradeEdits({});
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      console.error('Error in executeSave:', error);
      throw error; // Re-throw to be caught by timeout wrapper
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Check upload limit for new trades (not edits)
    if (!editId && !canUpload) {
      setShowUpgradeLimitPrompt(true);
      toast.error('Daily upload limit reached', {
        description: `You've used all uploads today. Upgrade for more!`
      });
      return;
    }

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
      period_of_day: formData.period_of_day && ['morning', 'afternoon', 'night'].includes(formData.period_of_day) ? formData.period_of_day : 'morning',
      pnl: pnl,
      roi: roi,
      profit_loss: pnl,
      emotional_tag: formData.emotional_tag,
      notes: formData.notes,
      duration_minutes: parseFloat(formData.duration_minutes) || 0,
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
      // Increment upload counter for new trades
      if (!editId) {
        await incrementUploadCount();
      }
      
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
        
        {/* Daily Upload Limit Display */}
        <DailyUploadStatus />

        <Tabs defaultValue="ai-extract" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai-extract">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Extract
            </TabsTrigger>
            <TabsTrigger value="csv-import">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              CSV Import
            </TabsTrigger>
            <TabsTrigger value="batch-upload">
              <Images className="w-4 h-4 mr-2" />
              Batch Upload
            </TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="csv-import" className="space-y-6">
            <Card className="p-6 glass">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Import from CSV</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Import your trades directly from your exchange or your existing trading journal.
                  </p>
                </div>
                
                <UploadErrorBoundary>
                  <CSVUpload 
                    onTradesExtracted={(trades) => {
                      setExtractedTrades(trades);
                      setTradeEdits({});
                      toast.success(`Parsed ${trades.length} trades from CSV`);
                    }} 
                  />
                </UploadErrorBoundary>
              </div>
            </Card>

            {/* CSV Extracted Trades Preview */}
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
          </TabsContent>

          <TabsContent value="batch-upload" className="space-y-6">
            <Card className="p-6 glass">
              <div className="space-y-4">
                <UploadErrorBoundary>
                  <MultiImageUpload
                    onTradesExtracted={(trades) => {
                      setExtractedTrades(trades);
                      // Clear any existing edits
                      setTradeEdits({});
                      // Show success message
                      toast.success(`Extracted ${trades.length} trades from batch upload`, {
                        description: 'Review and edit the trades below, then click "Save All Trades"'
                      });
                    }} 
                  />
                </UploadErrorBoundary>
              </div>
            </Card>

            {/* Show extracted trades for editing */}
            {extractedTrades.length > 0 && (
              <Card className="p-6 glass">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Review Extracted Trades</h3>
                      <p className="text-sm text-muted-foreground">
                        Review and edit the trades below before saving
                      </p>
                    </div>
                    <Button
                      onClick={saveAllExtractedTrades}
                      disabled={loading || extractedTrades.length === 0}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>Save All {extractedTrades.length} Trades</>
                      )}
                    </Button>
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
          </TabsContent>

          <TabsContent value="ai-extract" className="space-y-6">
            <Card className="p-6 glass">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="extraction-image">Upload Trade Screenshot</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload a screenshot containing your trade information. The AI will automatically extract all trades.
                  </p>
                  <Collapsible className="mb-3">
                    <CollapsibleTrigger className="text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors flex items-center gap-1 group">
                      Click here for best results
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="text-sm text-muted-foreground mt-2">
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Maximum of 10 trades per image.</li>
                        <li>We recommend taking a screenshot after every 10 trades to save credits and use the tool efficiently.</li>
                        <li>Most exchanges display around 10 trades per page, so capture that full view, including the header (column names), for faster and smoother uploads.</li>
                        <li>You can also use our tag tool to label key data points on your uploaded image. This helps the system identify and process your trades more accurately.</li>
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                  
                  {/* Pre-select broker - Always visible until trades are extracted */}
                  {extractedTrades.length === 0 && (
                    <div 
                      ref={brokerFieldRef}
                      className={cn(
                        "mb-4 p-4 border-2 rounded-lg bg-muted/30 transition-all duration-300",
                        brokerError 
                          ? "border-destructive bg-destructive/5 animate-shake animate-pulse-error" 
                          : "border-border"
                      )}
                    >
                      <Label className={cn(
                        "text-sm font-medium mb-2 block",
                        brokerError && "text-destructive"
                      )}>
                        Broker (Required) *
                      </Label>
                      <p className="text-xs text-muted-foreground mb-3">
                        Select your broker to pre-fill this field in extracted trades
                      </p>
                      <BrokerSelect 
                        value={preSelectedBroker}
                        onChange={(value) => {
                          setPreSelectedBroker(value);
                          setBrokerError(false);
                        }}
                        required
                      />
                      {brokerError && (
                        <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Please select a broker to continue
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-2">
                    <UploadErrorBoundary>
                      <EnhancedFileUpload
                        onFileSelected={async (file) => {
                          await processImageFile(file);
                        }}
                        existingPreview={extractionPreview}
                        onRemove={removeExtractionImage}
                        uploading={extracting}
                        uploadProgress={uploadProgress.percentage || uploadStep * 25}
                        maxSize={10}
                        acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
                      />
                    </UploadErrorBoundary>
                    
                    {extractionPreview && (
                      <div className="space-y-3 mt-4">
                        {extractedTrades.length === 0 && (
                          <>
                            {/* Image annotation system */}
                            {showAnnotator && (
                              <div className="mb-4">
                                <ImageAnnotator
                                  imageUrl={extractionPreview}
                                  onAnnotationsChange={setAnnotations}
                                  initialAnnotations={annotations}
                                />
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                onClick={() => setShowAnnotator(!showAnnotator)}
                                variant="outline"
                                size="lg"
                                className="flex-1"
                              >
                                <MapPin className="w-5 h-5 mr-2" />
                                {showAnnotator ? 'Hide' : 'Mark Fields'} {annotations.length > 0 && `(${annotations.length})`}
                              </Button>
                            </div>

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

                    {/* AI Feedback for extraction quality */}
                    {extractedTrades.length > 0 && extractionPreview && (
                      <AIFeedback 
                        extractedData={extractedTrades}
                        imagePath={extractionPreview}
                      />
                    )}
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
                    onStayHere={() => {
                      setShowSuccess(false);
                      setExtractedTrades([]);
                      setExtractionImage(null);
                      setExtractionPreview(null);
                      setSavedTradesCount(0);
                    }}
                  />
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card className="p-6 glass">
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
                      <PopoverContent className="w-[400px] p-0" align="start" sideOffset={8}>
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
                    <div className="mt-1">
                      <BrokerSelect 
                        value={formData.broker}
                        onChange={(value) => setFormData({...formData, broker: value})}
                        required
                      />
                    </div>
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

      {/* Batch Duplicate Detection Dialog */}
      <BatchDuplicateDialog
        open={batchDuplicates.open}
        duplicates={batchDuplicates.duplicates}
        onRemoveDuplicates={(indicesToRemove) => {
          // Remove selected duplicates from extractedTrades
          const filteredTrades = extractedTrades.filter((_, index) => !indicesToRemove.includes(index));
          setExtractedTrades(filteredTrades);
          
          // Update trade edits to match new indices
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
          
          // Trigger save for remaining trades
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

              setSavedTradesCount(extractedTrades.length);
              setShowSuccess(true);
              setExtractedTrades([]);
              setTradeEdits({});
              removeExtractionImage();
            } else {
              console.error('Error saving trades:', error);
              toast.error('Failed to save trades', {
                description: error.message
              });
            }
          } finally {
            setLoading(false);
          }
        }}
        onCancel={() => {
          setBatchDuplicates({ open: false, duplicates: [] });
          setLoading(false);
        }}
      />

      {/* Single Duplicate Trade Detection Dialog (legacy) */}
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
      
      {/* Upload Limit Upgrade Prompt */}
      <UpgradePrompt
        open={showUpgradeLimitPrompt}
        onClose={() => setShowUpgradeLimitPrompt(false)}
        trigger="upload_limit"
        feature="more daily uploads"
      />
    </AppLayout>
  );
};

export default Upload;
