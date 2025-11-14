import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { cn } from '@/lib/utils';
import { runOCR } from '@/utils/ocrPipeline';
import { TradeReviewEditor } from './TradeReviewEditor';
import { DuplicateReviewDialog } from './DuplicateReviewDialog';
import { checkForDuplicates } from '@/utils/duplicateDetection';
import type { DuplicateCheckResult } from '@/utils/duplicateDetection';
import { retryWithBackoff, isRetryableError } from '@/utils/retryWithBackoff';

interface UploadedImage {
  file: File;
  preview: string;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  tradesDetected?: number;
  error?: string;
  retryCount?: number; // Track how many times this image has been retried
}

interface MultiImageUploadProps {
  onTradesExtracted: (trades: any[]) => void;
  maxImages?: number;
  preSelectedBroker?: string;
  skipBrokerSelection?: boolean;
  onBrokerError?: () => void;
  onReviewStart?: () => void;
  onReviewEnd?: () => void;
}

export function MultiImageUpload({ onTradesExtracted, maxImages = 10, preSelectedBroker = '', skipBrokerSelection = false, onBrokerError, onReviewStart, onReviewEnd }: MultiImageUploadProps) {
  const { user } = useAuth();
  const { settings, updateSetting } = useUserSettings();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [totalTradesDetected, setTotalTradesDetected] = useState(0);
  const [creditsRequired, setCreditsRequired] = useState(0);
  const [extractedTrades, setExtractedTrades] = useState<any[]>([]);
  const [maxSelectableTrades, setMaxSelectableTrades] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);
  const [duplicateMap, setDuplicateMap] = useState<Map<number, DuplicateCheckResult>>(new Map());
  const [initialDeletedTrades, setInitialDeletedTrades] = useState<Set<number>>();
  const [initialOverriddenDuplicates, setInitialOverriddenDuplicates] = useState<Set<number>>();
  const dragCounter = useRef(0);
  const imageProcessStartTime = useRef<number>(0);
  const imageProcessTimes = useRef<number[]>([]);

  // Global drag listeners for reliable drag feedback
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      dragCounter.current += 1;
      setIsDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      e.preventDefault();
      setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setIsDragging(false);
    };
    const onDrop = () => {
      dragCounter.current = 0;
      setIsDragging(false);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, []);
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = [];
    const remainingSlots = Math.max(0, maxImages - images.length);
    let invalidCount = 0;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          status: 'pending',
        });
      } else {
        invalidCount++;
      }
    });

    if (newImages.length > 0) {
      setImages([...images, ...newImages]);
    }

    if (invalidCount > 0) {
      toast.error(`${invalidCount} unsupported file${invalidCount > 1 ? 's' : ''} skipped`);
    }

    if (files.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} slots available. First ${remainingSlots} images added.`);
    }
  }, [images, maxImages]);

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only respond to file drags
    const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
    if (!hasFiles) return;
    
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current = 0;
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const analyzeImages = async (retryMode = false) => {
    if (!skipBrokerSelection && (!preSelectedBroker || preSelectedBroker.trim() === '')) {
      toast.error('Please select a broker or enable "Extract without broker selection"');
      onBrokerError?.();
      return;
    }

    setIsAnalyzing(true);
    setCurrentImageIndex(0);
    imageProcessTimes.current = [];
    let totalTrades = 0;
    let successfulImagesCount = 0; // Track successful processing count
    let errorImagesCount = 0; // Track failed processing count
    const allTrades: any[] = [];

    // In retry mode, only process failed images
    const imagesToProcess = retryMode 
      ? images.map((img, idx) => ({ img, idx })).filter(({ img }) => img.status === 'error')
      : images.map((img, idx) => ({ img, idx }));

    if (retryMode && imagesToProcess.length === 0) {
      toast.info('No failed images to retry');
      setIsAnalyzing(false);
      return;
    }

    if (retryMode) {
      toast.info(`Retrying ${imagesToProcess.length} failed image${imagesToProcess.length > 1 ? 's' : ''} with alternative extraction method...`);
    }

    try {
      // Analyze each image with OCR preprocessing
      for (let processIdx = 0; processIdx < imagesToProcess.length; processIdx++) {
        const { img: image, idx: i } = imagesToProcess[processIdx];
        setCurrentImageIndex(processIdx + 1);
        imageProcessStartTime.current = Date.now();
        
        // Calculate estimated time remaining based on average processing time
        if (imageProcessTimes.current.length > 0) {
          const avgTime = imageProcessTimes.current.reduce((a, b) => a + b, 0) / imageProcessTimes.current.length;
          const remainingImages = imagesToProcess.length - processIdx;
          setEstimatedTimeRemaining(Math.ceil((avgTime * remainingImages) / 1000));
        }
        
        setImages(prev => prev.map((img, idx) => 
          idx === i ? { ...img, status: 'analyzing' } : img
        ));

        try {
          // Get session token
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Not authenticated');

          // RETRY STRATEGY: Skip OCR and force deep vision model for failed images
          let ocrResult = null;
          if (!retryMode) {
            // First attempt: Try OCR
            try {
              ocrResult = await runOCR(image.file);
            } catch (ocrError) {
              console.warn('OCR failed, will use vision-only:', ocrError);
              ocrResult = null;
            }
          } else {
            console.log('🔄 Retry mode: Skipping OCR, forcing deep vision model');
          }

          // Convert image to base64
          const imageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(image.file);
          });

          // Extract trades from image with smart retry logic
          let retryAttempt = 0;
          const result = await retryWithBackoff(
            async () => {
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-trade-info`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({ 
                    imageBase64,
                    ocrText: ocrResult?.text,
                    ocrConfidence: ocrResult?.confidence,
                    imageHash: ocrResult?.imageHash,
                    perceptualHash: ocrResult?.perceptualHash,
                    broker: skipBrokerSelection ? null : preSelectedBroker,
                    forceDeepModel: retryMode, // Tell backend to use deep model regardless of OCR quality
                    retryAttempt // Pass retry attempt to backend for token allocation
                  }),
                }
              );

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.error || 'Failed to analyze image') as any;
                error.status = response.status;
                error.details = errorData.details;
                
                // Check for truncation error - trigger automatic retry with higher tokens
                if (errorData.error?.includes('truncated') || errorData.details?.includes('truncated')) {
                  retryAttempt++;
                  console.log(`🔄 JSON truncated detected, retrying with 2x tokens (attempt ${retryAttempt})`);
                  error.isRetryable = true;
                  throw error;
                }
                
                // Only retry if error is retryable
                if (!isRetryableError(error)) {
                  throw error;
                }
                throw error;
              }

              return await response.json();
            },
            {
              maxRetries: 3,
              initialDelay: 1000,
              maxDelay: 10000,
              onRetry: (attempt, error, nextDelay) => {
                const errorObj = error as any;
                const is503 = errorObj.status === 503;
                console.log(`🔄 Retry attempt ${attempt} for image ${i + 1}:`, error.message);
                console.log(`⏳ Waiting ${Math.round(nextDelay / 1000)}s before retry...`);
                
                // Show specific message for service unavailability
                if (is503 && attempt === 1) {
                  toast.info(
                    `AI service temporarily busy. Retrying in ${Math.round(nextDelay / 1000)}s...`,
                    { duration: nextDelay }
                  );
                }
                
                // Update image status to show retry in progress
                setImages(prev => prev.map((img, idx) => 
                  idx === i ? { 
                    ...img, 
                    status: 'analyzing',
                    error: `Retry ${attempt}/3 (${error.message})`,
                    retryCount: attempt
                  } : img
                ));
                
                // Show toast for first retry only
                if (attempt === 1) {
                  toast.info(`Retrying image ${i + 1}...`, {
                    description: 'Network issue detected, retrying automatically',
                  });
                }
              }
            }
          );
          const tradesFound = Array.isArray(result.trades) ? result.trades.length : 0;
          
          // Record processing time for this image
          const processingTime = Date.now() - imageProcessStartTime.current;
          imageProcessTimes.current.push(processingTime);
          
          totalTrades += tradesFound;
          successfulImagesCount++; // Increment success counter
          if (Array.isArray(result.trades)) {
            allTrades.push(...result.trades);
          }

          setImages(prev => prev.map((img, idx) => 
            idx === i ? { 
              ...img, 
              status: 'success', 
              tradesDetected: tradesFound,
              retryCount: (img.retryCount || 0) + (retryMode ? 1 : 0)
            } : img
          ));
        } catch (error) {
          console.error(`Error analyzing image ${i}:`, error);
          errorImagesCount++; // Increment error counter
          
          // Create user-friendly error message
          let friendlyError = 'Analysis failed';
          const wasRetried = (error as any).retriesExhausted || false;
          
          if (error instanceof Error) {
            const errorMsg = error.message.toLowerCase();
            
            if (errorMsg.includes('rate limit')) {
              friendlyError = 'Rate limit exceeded (retried 3 times). Please wait and try again.';
            } else if (errorMsg.includes('credits') || errorMsg.includes('budget')) {
              friendlyError = 'AI credits exhausted. Please upgrade or wait for next month.';
            } else if (errorMsg.includes('timeout') || errorMsg.includes('ocr timeout')) {
              friendlyError = wasRetried 
                ? 'Processing timeout (retried 3 times). Try a clearer screenshot.'
                : 'Image processing took too long. Try a clearer screenshot.';
            } else if (errorMsg.includes('too large') || errorMsg.includes('10mb')) {
              friendlyError = 'Image is too large (max 10MB). Please compress it.';
            } else if (errorMsg.includes('parse') || errorMsg.includes('invalid json')) {
              friendlyError = wasRetried
                ? 'Could not extract trade data (retried 3 times). Try a clearer screenshot.'
                : 'Could not extract trade data. Try a clearer screenshot.';
            } else if (errorMsg.includes('no trade') || errorMsg.includes('not found')) {
              friendlyError = 'No trades found in this image. Make sure it shows trade data.';
            } else if (error.message.length < 100) {
              friendlyError = wasRetried ? `${error.message} (retried 3 times)` : error.message;
            }
          }
          
          setImages(prev => prev.map((img, idx) => 
            idx === i ? { 
              ...img, 
              status: 'error', 
              error: friendlyError,
              retryCount: (img.retryCount || 0) + (retryMode ? 1 : 0)
            } : img
          ));
        }
      }

      // Use tracked counts instead of reading from potentially stale state
      const successCount = successfulImagesCount;
      const errorCount = errorImagesCount;
      const creditsNeeded = successCount;
      const maxTrades = creditsNeeded * 10;
      
      console.log('📊 Processing complete:', { successCount, errorCount, totalTrades, maxTrades });

      // Auth guard: Ensure we have authenticated user before duplicate check
      let currentUserId = user?.id;
      if (!currentUserId) {
        console.log('User not in context, fetching from session...');
        const { data: { user: sessionUser } } = await supabase.auth.getUser();
        currentUserId = sessionUser?.id;
      }
      
      if (!currentUserId) {
        toast.error('Authentication required to check for duplicates');
        setIsAnalyzing(false);
        return;
      }
      
      console.log(`Running duplicate check for user ${currentUserId} with ${allTrades.length} trades`);
      
      // Check for duplicates with authenticated user
      const duplicates = await checkForDuplicates(allTrades, currentUserId);
      setDuplicateMap(duplicates);
      
      // Count valid (non-duplicate) trades for billing
      const duplicateCount = duplicates.size;
      const validTradeCount = totalTrades - duplicateCount;
      const validCreditsNeeded = Math.ceil(validTradeCount / 10); // Only charge for valid trades
      
      setTotalTradesDetected(totalTrades);
      setCreditsRequired(validCreditsNeeded);
      setMaxSelectableTrades(maxTrades);
      setExtractedTrades(allTrades);

      // Show helpful message about duplicates if any found
      if (duplicateCount > 0) {
        toast.info(`Found ${duplicateCount} duplicate trade${duplicateCount > 1 ? 's' : ''}`, {
          description: 'Duplicate trades won\'t be charged to your account'
        });
      }

      // Show helpful message about failed extractions
      if (retryMode) {
        const retriedSuccess = imagesToProcess.filter(({ idx }) => images[idx].status === 'success').length;
        if (retriedSuccess > 0) {
          toast.success(`${retriedSuccess} image${retriedSuccess > 1 ? 's' : ''} successfully extracted on retry!`);
        }
        if (errorCount > 0) {
          toast.warning(`${errorCount} image${errorCount > 1 ? 's' : ''} still failed`, {
            description: 'These images may have quality issues. Try a different screenshot.'
          });
        }
      } else {
        if (errorCount > 0 && successCount > 0) {
          toast.info(`${successCount} image${successCount > 1 ? 's' : ''} extracted successfully`, {
            description: `${errorCount} failed extraction${errorCount > 1 ? 's' : ''} (no credits charged)`
          });
        } else if (errorCount > 0 && successCount === 0) {
          toast.error('All extractions failed', {
            description: 'No credits were charged. Please try with clearer screenshots.'
          });
          setIsAnalyzing(false);
          return;
        }
      }

      // Show duplicate review dialog if duplicates found AND enabled in settings
      if (duplicateCount > 0 && settings.duplicate_review_enabled) {
        console.log(`Showing duplicate dialog for ${duplicateCount} duplicates`);
        setShowDuplicateDialog(true);
        // Mark as shown
        await updateSetting('duplicate_review_last_shown', new Date().toISOString());
      } else if (duplicateCount > 0) {
        // Auto-remove duplicates if dialog is disabled
        console.log(`Auto-removing ${duplicateCount} duplicates (dialog disabled)`);
        const duplicateIndices = Array.from(duplicates.keys());
        const filteredTrades = allTrades.filter((_, idx) => !duplicateIndices.includes(idx));
        setExtractedTrades(filteredTrades);
        setTotalTradesDetected(filteredTrades.length);
        toast.info(`${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} auto-removed (duplicates won't be saved)`);
        setShowConfirmation(true);
        onReviewStart?.();
      } else {
        setShowConfirmation(true);
        onReviewStart?.();
      }
    } catch (error) {
      toast.error('Failed to analyze images');
    } finally {
      setIsAnalyzing(false);
      setCurrentImageIndex(0);
      setEstimatedTimeRemaining(0);
    }
  };

  const handleSaveTrades = async (tradesToSave: any[]) => {
    if (tradesToSave.length === 0) {
      toast.error('Please select at least one trade to import');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Process trades
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-multi-upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            trades: tradesToSave,
            creditsToDeduct: creditsRequired
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process trades');
      }

      const result = await response.json();
      
      // Show appropriate message based on duplicates skipped
      if (result.tradesSkipped > 0) {
        toast.success(`Imported ${result.tradesInserted} trades (${result.tradesSkipped} duplicates skipped)`);
      } else {
        toast.success(`Successfully imported ${result.tradesInserted} trades!`);
      }
      
      onTradesExtracted(result.trades);
      
      // Reset state
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      setShowConfirmation(false);
      onReviewEnd?.();
      setExtractedTrades([]);
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import trades');
    }
  };

  const handleDuplicateReview = async (keepIndices: Set<number>, removeIndices: Set<number>, dontShowAgain: boolean) => {
    // Update settings if user chose "don't show again"
    if (dontShowAgain) {
      await updateSetting('duplicate_review_enabled', false);
      await updateSetting('duplicate_review_seen', true);
      toast.info('Duplicate dialog disabled. You can re-enable it in Settings.');
    }
    
    // Filter trades based on user selection
    const filteredTrades = extractedTrades.filter((_, idx) => !removeIndices.has(idx));
    const removedCount = removeIndices.size;
    
    // Recalculate credits
    const validCount = filteredTrades.length;
    const newCreditsNeeded = Math.ceil(validCount / 10);
    
    setExtractedTrades(filteredTrades);
    setTotalTradesDetected(validCount);
    setCreditsRequired(newCreditsNeeded);
    setShowDuplicateDialog(false);
    
    // Show confirmation
    if (removedCount > 0) {
      toast.success(`Removed ${removedCount} duplicate${removedCount > 1 ? 's' : ''}`);
    }
    
    setShowConfirmation(true);
    onReviewStart?.();
  };

  return (
    <div className="space-y-6">
    <div className="flex flex-wrap gap-4">
        {images.map((image, index) => (
          <Card key={index} className="relative group overflow-hidden w-[280px]">
            <div className="aspect-video relative">
              <img
                src={image.preview}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Remove button - always visible on mobile, hover on desktop */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveImage(index)}
                disabled={isAnalyzing}
                className="absolute top-2 right-2 h-7 w-7 bg-black/60 hover:bg-black/80 text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-3.5 w-3.5" />
              </Button>

              {/* Status overlays */}
              {image.status === 'analyzing' && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Analyzing image" />
                  <p className="text-xs text-muted-foreground">Analyzing...</p>
                </div>
              )}
              {image.status === 'success' && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <p className="text-xs font-medium text-white">Extracted</p>
                </div>
              )}
              {image.status === 'error' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute inset-0 bg-destructive/20 border-2 border-destructive/50 flex flex-col items-center justify-center gap-2 cursor-help">
                        <AlertCircle className="h-8 w-8 text-destructive animate-pulse" />
                        <div className="px-3 py-1.5 bg-black/80 rounded-md max-w-[90%]">
                          <p className="text-xs font-medium text-white text-center">{image.error || 'Failed'}</p>
                        </div>
                        <div className="px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-md mt-1">
                          <p className="text-[10px] text-green-400 font-medium">No credit charged</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{image.error || 'Analysis failed'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Failed extractions don't cost credits. You can try again with a different image.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Compact bottom status */}
              <div className="absolute bottom-2 left-2 right-2">
                {image.status === 'pending' && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm border border-border/50">
                    <span className="text-xs text-foreground font-medium">Ready to extract</span>
                    <div className="h-3 w-px bg-border/60" />
                    <span className="text-xs text-primary font-semibold">1 credit</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help ml-0.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Each trade extraction costs 1 credit</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                {image.tradesDetected !== undefined && image.status === 'success' && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/80 backdrop-blur-sm border border-green-500/50">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-foreground font-medium">
                      {image.tradesDetected} {image.tradesDetected === 1 ? 'trade' : 'trades'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {images.length < maxImages && (
          <Card 
            className={cn(
              "relative w-[280px] h-[157px] rounded-[14px] flex flex-col items-center justify-center cursor-pointer border-dashed border-2 transition-all overflow-hidden group bg-muted/30",
              isDragging 
                ? "border-primary bg-primary/10 ring-2 ring-primary/40 shadow-lg" 
                : "border-border hover:border-primary/70 hover:bg-muted/50 hover:shadow-md"
            )}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div
                className="absolute inset-0 z-10 pointer-events-none rounded-[14px] bg-primary/10 backdrop-blur-sm border-2 border-primary ring-2 ring-primary/40 flex items-center justify-center transition-all"
                role="region"
                aria-label="Drop files to upload"
                aria-busy="true"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary animate-bounce" />
                  </div>
                  <p className="text-base font-semibold text-foreground">Drop to upload</p>
                </div>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="image-upload"
              disabled={isAnalyzing}
            />
            <label htmlFor="image-upload" className="cursor-pointer w-full h-full flex items-center justify-center gap-4 px-6">
              {/* Counter - top right */}
              <div className="absolute top-2 right-2 text-xs font-medium text-muted-foreground" aria-live="polite">
                {images.length}/{maxImages}
              </div>
              
              {/* Icon */}
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50 flex items-center justify-center transition-colors flex-shrink-0">
                <Upload className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              </div>
              
              {/* Text content */}
              <div className="flex flex-col gap-1 text-left">
                <p className="text-sm font-medium">
                  Drag files or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Up to {maxImages} images • JPG, PNG, PDF
                </p>
              </div>
            </label>
          </Card>
        )}
      </div>

      {/* Tips for successful extraction */}
      {images.length === 0 && (
        <Card className="p-4 bg-muted/30 border-dashed">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-semibold">Tips for Best Results</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Use clear, high-resolution screenshots of your trading history</li>
                <li>Make sure all columns are visible (symbol, entry/exit price, P&L, dates)</li>
                <li>Crop out unnecessary UI elements - focus on the trade table</li>
                <li>If extraction fails, try a different screenshot angle or format</li>
              </ul>
              <div className="space-y-1.5 mt-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Failed extractions don't cost credits</span> – feel free to try again!
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">AI duplicate protection</span> – you're never charged for duplicate trades
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-500" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Auto-retry with backoff</span> – network issues handled automatically
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Retry strategy explanation - show when there are failed images */}
      {images.some(img => img.status === 'error') && !isAnalyzing && (
        <Card className="p-4 bg-amber-500/5 border-amber-500/20">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Smart Retry Available</h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-200/80">
                {images.filter(img => img.status === 'error').length} image{images.filter(img => img.status === 'error').length > 1 ? 's' : ''} failed extraction. Our AI will use a different, more thorough extraction method on retry:
              </p>
              <ul className="text-xs text-amber-800/70 dark:text-amber-200/70 space-y-1 ml-4 list-disc">
                <li><span className="font-medium">Alternative AI model</span> - Switches to advanced vision model</li>
                <li><span className="font-medium">Different approach</span> - Bypasses quick scan, does deep analysis</li>
                <li><span className="font-medium">No extra charge</span> - Failed retries don't cost credits</li>
              </ul>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-amber-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <p className="text-xs text-muted-foreground">
                  Click <span className="font-medium text-foreground">"Retry Failed"</span> to try again with our backup extraction system
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {images.length > 0 && (
        <>
          {/* Progress Indicator */}
          {isAnalyzing && (
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Processing image {currentImageIndex} of {images.length}
                  </span>
                  {estimatedTimeRemaining > 0 && (
                    <span className="text-muted-foreground">
                      ~{estimatedTimeRemaining}s remaining
                    </span>
                  )}
                </div>
                <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${(currentImageIndex / images.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Analyzing screenshots and extracting trades...
                </p>
              </div>
            </Card>
          )}
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(true)}
                disabled={isAnalyzing}
              >
                Clear all
              </Button>
              {/* Retry Failed button - only show if there are failed images */}
              {images.some(img => img.status === 'error') && (
                <Button
                  variant="outline"
                  onClick={() => analyzeImages(true)}
                  disabled={isAnalyzing}
                  className="border-amber-500/50 hover:border-amber-500 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Retry Failed ({images.filter(img => img.status === 'error').length})
                </Button>
              )}
            </div>
            <Button
              onClick={() => analyzeImages(false)}
              disabled={isAnalyzing || images.some(img => img.status === 'analyzing')}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Extract Trades
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Duplicate Review Dialog */}
      <DuplicateReviewDialog
        open={showDuplicateDialog}
        duplicates={duplicateMap}
        trades={extractedTrades}
        onConfirm={(keepIndices, removeIndices) => {
          setInitialDeletedTrades(removeIndices);
          setInitialOverriddenDuplicates(keepIndices);
          setShowDuplicateDialog(false);
          setShowConfirmation(true);
          onReviewStart?.();
        }}
        onCancel={() => {
          setShowDuplicateDialog(false);
          setExtractedTrades([]);
          setDuplicateMap(new Map());
        }}
      />

      {/* Trade Review Editor - Full Page */}
      {showConfirmation && (
<TradeReviewEditor
  trades={extractedTrades}
  maxSelectableTrades={maxSelectableTrades}
  creditsRequired={creditsRequired}
  imagesProcessed={images.filter(img => img.status === 'success').length}
  duplicateMap={duplicateMap}
  initialDeletedTrades={initialDeletedTrades}
  initialOverriddenDuplicates={initialOverriddenDuplicates}
  onSave={handleSaveTrades}
  onCancel={() => { setShowConfirmation(false); onReviewEnd?.(); }}
/>
      )}

      {/* Clear All Confirmation */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all files?</DialogTitle>
            <DialogDescription>
              This will remove {images.length} file{images.length === 1 ? '' : 's'} from the list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                images.forEach(img => URL.revokeObjectURL(img.preview));
                setImages([]);
                setShowClearConfirm(false);
              }}
            >
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}