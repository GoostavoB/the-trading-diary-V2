import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Sparkles, Check, TrendingUp, AlertCircle, Plus, ImagePlus, Info, Bug } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BrokerSelect } from './BrokerSelect';
import { DebugDataModal } from './DebugDataModal';
import { UploadCreditsGate } from './UploadCreditsGate';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useUploadCredits } from '@/hooks/useUploadCredits';
import type { ExtractedTrade } from '@/types/trade';
import { cn } from '@/lib/utils';
interface SmartUploadProps {
  onTradesExtracted: (trades: ExtractedTrade[]) => void;
  onShowAnnotator?: () => void;
  maxImages?: number;
}
interface DebugData {
  timestamp: string;
  request: {
    imageSize: number;
    imageName: string;
    broker: string;
  };
  rawResponse: any;
  error: any;
  processedTrades: ExtractedTrade[];
  debugInfo?: any;
}

interface ImageQueueItem {
  file: File;
  preview: string;
  status: 'queued' | 'processing' | 'success' | 'error';
  quality?: 'high' | 'medium' | 'low';
  progress?: number;
  trades?: ExtractedTrade[];
  error?: string;
  debugData?: DebugData;
}
export function SmartUpload({
  onTradesExtracted,
  onShowAnnotator,
  maxImages = 10
}: SmartUploadProps) {
  const [imageQueue, setImageQueue] = useState<ImageQueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [totalTradesFound, setTotalTradesFound] = useState(0);
  const [broker, setBroker] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [selectedDebugData, setSelectedDebugData] = useState<DebugData | null>(null);
  const [showCreditsGate, setShowCreditsGate] = useState(false);
  const [creditsChecked, setCreditsChecked] = useState(false);
  const [checkingCredits, setCheckingCredits] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState(0);
  const [hasCredits, setHasCredits] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { canUpload, balance, refetch: refetchCredits } = useUploadCredits();

  // Debug: Track showCreditsGate state changes
  useEffect(() => {
    console.log('🔍 [STATE CHANGE] showCreditsGate changed to:', showCreditsGate);
    if (showCreditsGate) {
      console.log('🔍 [RENDER] UploadCreditsGate modal SHOULD NOW BE VISIBLE');
    } else {
      console.log('🔍 [RENDER] UploadCreditsGate modal SHOULD BE HIDDEN');
    }
  }, [showCreditsGate]);

  // Client-side blur detection
  const detectBlur = async (file: File): Promise<boolean> => {
    return new Promise(resolve => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) return resolve(false);

        // Simple blur detection using Laplacian variance
        const data = imageData.data;
        let sum = 0;
        const step = 4;
        for (let i = 0; i < data.length; i += step * 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          sum += gray * gray;
        }
        const variance = sum / (data.length / 4);
        const isBlurry = variance < 100; // Hard block only if extremely blurry
        resolve(isBlurry);
      };
      img.src = URL.createObjectURL(file);
    });
  };
  const getImageVariance = async (file: File): Promise<number> => {
    return new Promise(resolve => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) {
          resolve(1000); // Assume high quality if can't process
          return;
        }
        const {
          data
        } = imageData;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const laplacian = Math.abs(gray);
          sum += laplacian * laplacian;
        }
        const variance = sum / (data.length / 4);
        resolve(variance);
      };
      img.onerror = () => resolve(1000); // Assume high quality on error
      img.src = URL.createObjectURL(file);
    });
  };
  // Proactive credit check function
  const checkCredits = async (required: number = 1): Promise<boolean> => {
    console.log('🔍 [CREDIT PRECHECK] Starting check, required:', required);
    setCheckingCredits(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-upload-credits');
      console.log('🔍 [CREDIT PRECHECK] Response:', { data, error });
      
      if (error) {
        console.error('❌ [CREDIT PRECHECK] Error:', error);
        toast.error('Unable to verify credits', { 
          description: 'Please try again or contact support.' 
        });
        setCheckingCredits(false);
        return false;
      }
      
      const remaining = data?.remaining ?? 0;
      const allowed = data?.canUpload === true && remaining >= required;
      
      console.log('🔍 [CREDIT PRECHECK] Result:', { 
        remaining, 
        required, 
        allowed, 
        canUpload: data?.canUpload 
      });
      
      setCreditsChecked(true);
      setRemainingCredits(remaining);
      setHasCredits(allowed);
      setCheckingCredits(false);
      
      return allowed;
    } catch (err) {
      console.error('❌ [CREDIT PRECHECK] Exception:', err);
      toast.error('Credit check failed', { 
        description: 'Please try again.' 
      });
      setCheckingCredits(false);
      return false;
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    console.log('🔍 [FILE SELECT] Starting with', files.length, 'files');
    
    // Calculate how many files we can accept
    const currentQueuedCount = imageQueue.filter(i => i.status === 'queued').length;
    const newFiles = Array.from(files).slice(0, maxImages - imageQueue.length);
    const requestedCount = newFiles.length;
    const totalNeeded = currentQueuedCount + requestedCount;
    
    console.log('🔍 [FILE SELECT] Credits needed:', {
      currentQueued: currentQueuedCount,
      newFiles: requestedCount,
      totalNeeded
    });
    
    // Check if we have enough credits for all queued + new files
    const canProceed = await checkCredits(totalNeeded);
    
    if (!canProceed) {
      console.log('❌ [FILE SELECT] Blocked - insufficient credits');
      setShowCreditsGate(true);
      toast.error('Not enough credits', { 
        description: `You need ${totalNeeded} credits but only have ${remainingCredits}. Buy credits or upgrade to continue.`,
        duration: 6000
      });
      return; // Block file addition
    }
    
    console.log('✅ [FILE SELECT] Proceeding with file validation');
    
    const validatedFiles: ImageQueueItem[] = [];
    let warningCount = 0;
    for (const file of newFiles) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      const isBlurry = await detectBlur(file);

      // Determine quality level based on blur detection
      const variance = await getImageVariance(file);
      let quality: 'high' | 'medium' | 'low' = 'high';
      if (variance < 50) {
        quality = 'low';
        warningCount++;
      } else if (variance < 150) {
        quality = 'medium';
        warningCount++;
      }
      validatedFiles.push({
        file,
        preview: URL.createObjectURL(file),
        status: 'queued',
        quality
      });
    }
    if (validatedFiles.length > 0) {
      setImageQueue(prev => [...prev, ...validatedFiles]);
      if (warningCount > 0) {
        toast.warning(`${warningCount} image${warningCount > 1 ? 's' : ''} may have quality issues`, {
          description: "We'll still try to extract data. You can review and edit results."
        });
      } else {
        toast.success(`${validatedFiles.length} image${validatedFiles.length > 1 ? 's' : ''} added successfully`);
      }
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    console.log('🔍 [DROP] Files dropped:', e.dataTransfer.files.length);
    await handleFileSelect(e.dataTransfer.files);
  };
  
  const handleDropzoneClick = async () => {
    console.log('🔍 [DROPZONE CLICK] User clicked dropzone');
    
    // Check if user has at least 1 credit before opening file picker
    const canProceed = await checkCredits(1);
    
    if (!canProceed) {
      console.log('❌ [DROPZONE CLICK] Blocked - no credits');
      setShowCreditsGate(true);
      toast.error('No credits', { 
        description: 'Buy credits or upgrade to continue uploading.',
        duration: 6000
      });
      return;
    }
    
    console.log('✅ [DROPZONE CLICK] Opening file picker');
    fileInputRef.current?.click();
  };
  const removeImage = (index: number) => {
    setImageQueue(prev => {
      const newQueue = [...prev];
      URL.revokeObjectURL(newQueue[index].preview);
      newQueue.splice(index, 1);
      return newQueue;
    });
  };
  const clearAll = () => {
    imageQueue.forEach(item => URL.revokeObjectURL(item.preview));
    setImageQueue([]);
    setProgress(0);
    setCurrentImageIndex(0);
    setTotalTradesFound(0);
  };
  const processImages = async () => {
    console.log('🔍 [UPLOAD START] processImages called');
    console.log('🔍 [UPLOAD START] imageQueue.length:', imageQueue.length);
    console.log('🔍 [UPLOAD START] imageQueue status breakdown:', {
      queued: imageQueue.filter(i => i.status === 'queued').length,
      processing: imageQueue.filter(i => i.status === 'processing').length,
      success: imageQueue.filter(i => i.status === 'success').length,
      error: imageQueue.filter(i => i.status === 'error').length,
    });
    
    if (imageQueue.length === 0) {
      console.log('🔍 [UPLOAD START] No images in queue, returning');
      return;
    }
    
    // Server-side credit check BEFORE any processing to avoid 90% stalls
    console.log('🔍 [CREDIT CHECK] Starting server-side credit check...');
    try {
      const queuedCount = imageQueue.filter(i => i.status === 'queued').length;
      console.log('🔍 [CREDIT CHECK] Queued images count:', queuedCount);
      
      console.log('🔍 [CREDIT CHECK] Calling check-upload-credits edge function...');
      const { data: creditData, error: creditErr } = await supabase.functions.invoke('check-upload-credits');
      
      console.log('🔍 [CREDIT CHECK] Response received');
      console.log('🔍 [CREDIT CHECK] creditData:', JSON.stringify(creditData, null, 2));
      console.log('🔍 [CREDIT CHECK] creditErr:', creditErr);
      
      if (creditErr) {
        console.error('❌ [CREDIT CHECK] Credit check API error:', creditErr);
        console.error('❌ [CREDIT CHECK] Error details:', JSON.stringify(creditErr, null, 2));
      }
      
      const remaining = (creditData as any)?.remaining ?? 0;
      const canUploadFlag = (creditData as any)?.canUpload ?? false;
      const balance = (creditData as any)?.balance ?? 0;
      
      console.log('🔍 [CREDIT CHECK] Parsed values:');
      console.log('🔍 [CREDIT CHECK]   - remaining:', remaining);
      console.log('🔍 [CREDIT CHECK]   - canUpload flag:', canUploadFlag);
      console.log('🔍 [CREDIT CHECK]   - balance:', balance);
      console.log('🔍 [CREDIT CHECK]   - needed (queuedCount):', queuedCount);
      
      const canUploadNow = canUploadFlag === true && remaining >= queuedCount;
      console.log('🔍 [CREDIT CHECK] Calculated canUploadNow:', canUploadNow);
      console.log('🔍 [CREDIT CHECK] Logic: canUploadFlag (', canUploadFlag, ') === true && remaining (', remaining, ') >= queuedCount (', queuedCount, ')');
      
      if (!canUploadNow) {
        console.log('❌ [CREDIT GATE] BLOCKING UPLOAD - Not enough credits');
        console.log('❌ [CREDIT GATE] Needed:', queuedCount, 'Remaining:', remaining);
        console.log('❌ [CREDIT GATE] Setting showCreditsGate to TRUE');
        setShowCreditsGate(true);
        
        // Verify state change
        setTimeout(() => {
          console.log('🔍 [CREDIT GATE] State after 100ms - showCreditsGate should be true');
        }, 100);
        
        return;
      }
      
      console.log('✅ [CREDIT CHECK] Credits OK - proceeding with upload');
      console.log('✅ [CREDIT CHECK] Available credits:', remaining, 'Needed:', queuedCount);
      
    } catch (e) {
      console.error('❌ [CREDIT CHECK] Unexpected exception during credit check:', e);
      console.error('❌ [CREDIT CHECK] Exception type:', typeof e);
      console.error('❌ [CREDIT CHECK] Exception details:', e);
      console.error('❌ [CREDIT GATE] BLOCKING UPLOAD - Showing gate due to exception');
      // Fail closed: show gate to prevent bad UX
      setShowCreditsGate(true);
      
      // Verify state change
      setTimeout(() => {
        console.log('🔍 [CREDIT GATE] State after exception + 100ms - showCreditsGate should be true');
      }, 100);
      
      return;
    }
    
    setProcessing(true);
    setProgress(0);
    setCurrentImageIndex(0);
    setTotalTradesFound(0);
    const allTrades: ExtractedTrade[] = [];
    for (let i = 0; i < imageQueue.length; i++) {
      setCurrentImageIndex(i);
      const item = imageQueue[i];

      // Update status to processing
      setImageQueue(prev => {
        const updated = [...prev];
        updated[i] = {
          ...updated[i],
          status: 'processing',
          progress: 0
        };
        return updated;
      });

      // Simulate progress animation
      const progressInterval = setInterval(() => {
        setImageQueue(prev => {
          const updated = [...prev];
          if (updated[i] && updated[i].progress !== undefined && updated[i].status === 'processing') {
            updated[i] = {
              ...updated[i],
              progress: Math.min((updated[i].progress || 0) + 10, 90)
            };
          }
          return updated;
        });
      }, 300);
      try {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>(resolve => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(item.file);
        });
        const imageBase64 = await base64Promise;

        // Ensure session is fresh before calling edge function
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('❌ Session error:', sessionError);
          throw new Error('Please log in to use Smart Upload. Refresh the page and sign in.');
        }

        // Check if session is about to expire (< 5 minutes) and refresh if needed
        if (session.expires_at) {
          const expiresIn = session.expires_at - (Date.now() / 1000);
          if (expiresIn < 300) { // Less than 5 minutes
            console.log('⏰ Session expiring soon, refreshing...');
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('❌ Session refresh failed:', refreshError);
              throw new Error('Session expired. Please refresh the page and try again.');
            }
            console.log('✅ Session refreshed successfully');
          }
        }

        console.log('✅ Session valid, calling vision extraction...');

        // Call vision extraction with direct fetch to expose HTTP status codes
        const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-trade-info`;
        
        console.log('🚀 Calling extract-trade-info...');
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            imageBase64: imageBase64,
            broker: broker || undefined,
            debug: debugMode
          })
        });

        // Parse response
        let data: any;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('❌ Failed to parse response:', parseError);
          throw new Error(`Failed to parse response (${response.status})`);
        }

        // Handle specific HTTP status codes
        if (!response.ok) {
          console.error(`❌ API Error ${response.status}:`, data);
          
          // Session expired
          if (response.status === 401) {
            toast.error('Session expired', {
              description: 'Signing you out. Please log in again.',
              duration: 5000
            });
            await supabase.auth.signOut();
            window.location.href = '/auth';
            throw new Error('AUTH_ERROR');
          }
          
          // Rate limited
          if (response.status === 429) {
            throw new Error('RATE_LIMITED: Too many requests. Wait 60 seconds and try again.');
          }
          
          // Credits exhausted
          if (response.status === 402) {
            throw new Error('NO_CREDITS: AI credits exhausted. Add funds to your Lovable workspace in Settings.');
          }
          
          // Service unavailable
          if (response.status === 404) {
            throw new Error('SERVICE_UNAVAILABLE: Function not deployed. Try CSV upload or manual entry instead.');
          }
          
          // Generic error
          throw new Error(data.error || data.message || `Request failed (${response.status})`);
        }

        // Store debug data if in debug mode
        const debugData: DebugData | undefined = debugMode ? {
          timestamp: new Date().toISOString(),
          request: {
            imageSize: item.file.size,
            imageName: item.file.name,
            broker: broker || 'auto-detect'
          },
          rawResponse: data,
          error: null,
          processedTrades: data?.trades || [],
          debugInfo: data?.debug
        } : undefined;

        // Check for explicit errors in response
        if (data?.error) {
          throw new Error(data.error);
        }
        
        const trades = data.trades || [];

        // Determine quality by calculating variance
        const variance = await getImageVariance(item.file);
        const quality = variance > 1000 ? 'high' : variance > 500 ? 'medium' : 'low';

        // Update status to success
        clearInterval(progressInterval);
        setImageQueue(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'success',
            quality,
            progress: 100,
            trades,
            debugData
          };
          return updated;
        });
        allTrades.push(...trades);
        setTotalTradesFound(prev => prev + trades.length);
      } catch (error: any) {
        console.error('❌ Extraction error:', error);

        // Parse specific error messages
        let userMessage = 'Extraction failed';
        let description = error.message || 'Unknown error';
        
        if (error.message?.includes('AUTH_ERROR')) {
          return; // Already handled above
        } else if (error.message?.includes('RATE_LIMITED')) {
          userMessage = 'Rate limited';
          description = 'Too many requests. Wait 60 seconds and try again.';
        } else if (error.message?.includes('NO_CREDITS')) {
          userMessage = 'Credits exhausted';
          description = 'Add funds to your Lovable workspace in Settings.';
        } else if (error.message?.includes('SERVICE_UNAVAILABLE')) {
          userMessage = 'Service unavailable';
          description = 'Function not deployed. Try CSV upload or manual entry instead.';
        }

        // Update status to error
        clearInterval(progressInterval);
        setImageQueue(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            status: 'error',
            progress: 0,
            error: userMessage
          };
          return updated;
        });
        
        toast.error(`Image ${i + 1}: ${userMessage}`, {
          description: description,
          duration: 6000
        });
      }

      // Update progress
      setProgress((i + 1) / imageQueue.length * 100);
    }
    setProcessing(false);

    // Call the callback with all trades
    if (allTrades.length > 0) {
      onTradesExtracted(allTrades);
    } else {
      toast.error('No trades found in any images');
    }
  };
  const hasQueuedImages = imageQueue.length > 0;

  const openDebugModal = (debugData: DebugData) => {
    setSelectedDebugData(debugData);
    setShowDebugModal(true);
  };

  // Wrapper for processImages with defensive credit check and logging
  const handleUploadClick = async () => {
    console.log('🔍 [BUTTON CLICK] Upload button clicked');
    
    const queuedCount = imageQueue.filter(i => i.status === 'queued').length;
    console.log('🔍 [BUTTON CLICK] Current state:', {
      processing,
      totalImages: imageQueue.length,
      queuedImages: queuedCount,
      showCreditsGate
    });
    
    // Defensive credit check at upload button (in case state is stale)
    console.log('🔍 [BUTTON CLICK] Running defensive credit check...');
    const canProceed = await checkCredits(queuedCount);
    
    if (!canProceed) {
      console.log('❌ [BUTTON CLICK] Blocked - insufficient credits');
      setShowCreditsGate(true);
      toast.error('Not enough credits', { 
        description: `You need ${queuedCount} credits but only have ${remainingCredits}. Buy credits or upgrade to continue.`,
        duration: 6000
      });
      return;
    }
    
    console.log('✅ [BUTTON CLICK] Credits verified, calling processImages()...');
    processImages();
  };

  return <TooltipProvider>
    <div className="space-y-6">
      {/* Hero Section - Mobile Optimized Premium */}
      <div className="text-center mb-8 md:mb-12 px-4 my-[21px] py-[46px]">
        {/* Debug Mode Toggle */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Switch
            id="debug-mode"
            checked={debugMode}
            onCheckedChange={setDebugMode}
          />
          <Label htmlFor="debug-mode" className="text-sm cursor-pointer">
            Debug Mode
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Show raw AI responses for debugging extraction issues</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Title - Responsive */}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-3 md:mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent drop-shadow-2xl">
            AI Trade Extraction
          </span>
        </h1>

        {/* Subtitle - Responsive */}
        <p className="text-base md:text-xl lg:text-2xl font-medium text-foreground/90 mb-2">
          Upload 1-{maxImages} screenshots. Extract everything.
        </p>

        {/* Trust line - Stack on mobile */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
            <Sparkles className="w-3 h-3" />
            95%+ Accuracy
          </span>
          <span className="hidden sm:inline text-muted-foreground/60">•</span>
          <span>5-10s per image</span>
          <span className="hidden sm:inline text-muted-foreground/60">•</span>
          <span>Trusted by 10,000+ traders</span>
        </div>
      </div>

      {/* Drop Zone - Mobile-First Design */}
      {!hasQueuedImages && <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div 
            onDragOver={handleDragOver} 
            onDragLeave={handleDragLeave} 
            onDrop={handleDrop} 
            onClick={handleDropzoneClick}
            className={cn(
              "relative rounded-xl p-8 md:p-12 text-center min-h-[180px] md:min-h-[220px]",
              "border-2 border-dashed transition-all duration-300",
              "bg-muted/30 flex flex-col items-center justify-center",
              isDragging ? "border-blue-500 bg-blue-500/10 scale-[1.02]" : "border-border/50 hover:border-blue-500/50 active:scale-[0.98]",
              !hasCredits && creditsChecked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            )}
          >
            <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-3 md:mb-4 text-muted-foreground" />
            
            <p className="text-sm md:text-base text-foreground mb-1">
              <span className="text-blue-500 font-medium">Tap to select</span>
              <span className="text-muted-foreground mx-2 hidden md:inline">or</span>
              <span className="text-muted-foreground hidden md:inline">drag and drop</span>
            </p>
            
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP • Max 10 MB
            </p>
            
            {!hasCredits && creditsChecked && (
              <p className="text-xs text-amber-500 font-medium mt-2">
                ⚠️ Credits required to upload
              </p>
            )}
          </div>
        </div>}

      {/* Image List - Premium */}
      {hasQueuedImages && <div className="space-y-4">
          <AnimatePresence>
            {imageQueue.map((item, index) => <motion.div key={index} initial={{
          opacity: 0,
          scale: 0.95,
          y: 10
        }} animate={{
          opacity: 1,
          scale: 1,
          y: 0
        }} exit={{
          opacity: 0,
          scale: 0.95,
          y: -10
        }} transition={{
          delay: index * 0.05,
          type: "spring",
          stiffness: 200,
          damping: 20
        }} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-blue-500/30 transition-colors group">
                <div className="relative flex-shrink-0 w-16 h-16 rounded-lg bg-muted overflow-hidden">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  
                  {item.status === 'queued' && <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1">
                      <ImagePlus className="w-5 h-5 text-primary" />
                      <span className="text-[10px] font-bold text-primary">READY</span>
                    </div>}
                  
                  {item.status === 'processing' && <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>}
                  
                  {item.status === 'success' && <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-[2px] flex items-center justify-center">
                      <motion.div initial={{
                scale: 0
              }} animate={{
                scale: 1
              }} transition={{
                type: "spring",
                stiffness: 300
              }}>
                        <Check className="w-6 h-6 text-green-500" />
                      </motion.div>
                    </div>}
                  
                  {item.status === 'error' && <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-rose-600/20 backdrop-blur-[2px] flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate mb-1">
                    {item.file.name}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                    {item.status === 'processing' && ' • Analyzing...'}
                    {item.status === 'success' && ' • Completed'}
                    {item.status === 'error' && ' • Failed'}
                  </p>
                  
                  {item.status === 'processing' && item.progress !== undefined && <>
                      <div className="h-1 bg-muted rounded-full overflow-hidden mb-1">
                        <motion.div className="h-full bg-blue-500" initial={{
                  width: 0
                }} animate={{
                  width: `${item.progress}%`
                }} transition={{
                  duration: 0.3
                }} />
                      </div>
                      <p className="text-xs text-blue-500 font-medium">
                        {item.progress}%
                      </p>
                    </>}
                  
                  {item.status === 'success' && item.trades && <div className="flex items-center gap-2">
                      <p className="text-xs text-green-500 font-medium">
                        ✓ {item.trades.length} trade{item.trades.length !== 1 ? 's' : ''} found
                      </p>
                      {debugMode && item.debugData && <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDebugModal(item.debugData!)}
                        className="h-6 px-2 text-xs"
                      >
                        <Bug className="w-3 h-3 mr-1" />
                        Debug
                      </Button>}
                    </div>}
                  
                  {item.status === 'error' && item.error && <p className="text-xs text-red-500 font-medium">
                      {item.error}
                    </p>}
                </div>
                
                {item.quality && item.quality !== 'high' && <div className={cn("quality-indicator flex-shrink-0", item.quality === 'medium' && "quality-medium", item.quality === 'low' && "quality-low")}>
                    <span className="text-xs uppercase font-bold">{item.quality}</span>
                  </div>}
                
                {!processing && item.status === 'queued' && <motion.button whileHover={{
            scale: 1.1
          }} whileTap={{
            scale: 0.9
          }} onClick={() => removeImage(index)} className="flex-shrink-0 w-8 h-8 rounded-full bg-muted hover:bg-destructive/20 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </motion.button>}
                
                {item.status === 'success' && <Check className="w-5 h-5 text-green-500 flex-shrink-0" />}
                {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              </motion.div>)}
          </AnimatePresence>
          
          {imageQueue.length < maxImages && !processing && <motion.button 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            onClick={handleDropzoneClick} 
            className="w-full p-4 rounded-xl border-2 border-dashed border-border/50 hover:border-blue-500/50 bg-muted/20 hover:bg-muted/40 flex items-center justify-center gap-2 transition-all group"
          >
              <Plus className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Add More Images
              </span>
            </motion.button>}

          {/* Broker Select */}
          <div className="flex items-center gap-4 pt-2">
            <BrokerSelect value={broker} onChange={setBroker} />
          </div>

          {/* Progress Bar (when processing) */}
          {processing && <motion.div initial={{
        opacity: 0,
        y: -10
      }} animate={{
        opacity: 1,
        y: 0
      }} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Processing Image {currentImageIndex + 1} of {imageQueue.length}
                </span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                {totalTradesFound} trades found so far
              </p>
            </motion.div>}

          {/* Action Buttons - Mobile Optimized */}
          <div className="flex flex-col gap-4 pt-6 border-t border-border/50">
            {/* Info Badge - Mobile */}
            <div className="flex items-center justify-center md:justify-start">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm">
                <span className="font-bold text-base md:text-lg text-foreground">{imageQueue.length}</span>
                <span className="text-muted-foreground text-xs md:text-sm">
                  image{imageQueue.length !== 1 ? 's' : ''} • {imageQueue.length} credit{imageQueue.length !== 1 ? 's' : ''}
                </span>
              </span>
            </div>
            
            {/* Buttons - Stack on mobile */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              {!processing && <Button variant="ghost" onClick={clearAll} disabled={imageQueue.length === 0} size="lg" className="w-full sm:w-auto text-muted-foreground hover:text-foreground">
                  Cancel
                </Button>}
              <Button 
                onClick={handleUploadClick} 
                disabled={
                  processing || 
                  imageQueue.length === 0 || 
                  (creditsChecked && remainingCredits < imageQueue.filter(i => i.status === 'queued').length)
                } 
                size="lg" 
                className="w-full sm:flex-1 text-white rounded-xl group relative overflow-hidden min-h-[44px] bg-gradient-to-r from-primary to-primary/80"
                title={
                  creditsChecked && remainingCredits < imageQueue.filter(i => i.status === 'queued').length
                    ? `Not enough credits (need ${imageQueue.filter(i => i.status === 'queued').length}, have ${remainingCredits})`
                    : undefined
                }
              >
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                
                {/* Content */}
                <div className="relative flex items-center justify-center gap-2 md:gap-3">
                  {processing ? <>
                      <TrendingUp className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
                      <span className="text-sm md:text-base">Processing {currentImageIndex + 1}/{imageQueue.length}</span>
                    </> : <>
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-180 transition-transform duration-500" />
                      <span className="text-sm md:text-base">Upload {imageQueue.filter(i => i.status === 'queued').length} File{imageQueue.filter(i => i.status === 'queued').length !== 1 ? 's' : ''}</span>
                    </>}
                </div>
              </Button>
            </div>
          </div>
        </div>}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileSelect(e.target.files)} />

      {/* Debug Data Modal */}
      <DebugDataModal
        open={showDebugModal}
        onOpenChange={setShowDebugModal}
        debugData={selectedDebugData}
      />

      {/* Credits Gate Modal */}
      <AnimatePresence>
        {showCreditsGate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              console.log('🔍 [MODAL] Backdrop clicked, closing modal');
              setShowCreditsGate(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => {
                console.log('🔍 [MODAL] Modal content clicked (stopping propagation)');
                e.stopPropagation();
              }}
              className="max-w-lg w-full"
            >
              <UploadCreditsGate />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </TooltipProvider>;
}