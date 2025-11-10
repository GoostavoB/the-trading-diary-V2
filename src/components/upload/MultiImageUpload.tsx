import { useState, useCallback, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { runOCR } from '@/utils/ocrPipeline';
import { TradeReviewEditor } from './TradeReviewEditor';

interface UploadedImage {
  file: File;
  preview: string;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  tradesDetected?: number;
  error?: string;
}

interface MultiImageUploadProps {
  onTradesExtracted: (trades: any[]) => void;
  maxImages?: number;
  preSelectedBroker?: string;
  onReviewStart?: () => void;
  onReviewEnd?: () => void;
}

export function MultiImageUpload({ onTradesExtracted, maxImages = 10, preSelectedBroker = '', onReviewStart, onReviewEnd }: MultiImageUploadProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [totalTradesDetected, setTotalTradesDetected] = useState(0);
  const [creditsRequired, setCreditsRequired] = useState(0);
  const [extractedTrades, setExtractedTrades] = useState<any[]>([]);
  const [maxSelectableTrades, setMaxSelectableTrades] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const dragCounter = useRef(0);

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

  const analyzeImages = async () => {
    if (!preSelectedBroker || preSelectedBroker.trim() === '') {
      toast.error('Please select a broker first');
      return;
    }

    setIsAnalyzing(true);
    let totalTrades = 0;
    const allTrades: any[] = [];

    try {
      // Analyze each image with OCR preprocessing
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setImages(prev => prev.map((img, idx) => 
          idx === i ? { ...img, status: 'analyzing' } : img
        ));

        try {
          // Get session token
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('Not authenticated');

          // Run OCR on image
          let ocrResult;
          try {
            ocrResult = await runOCR(image.file);
          } catch (ocrError) {
            console.warn('OCR failed, will use vision-only:', ocrError);
            ocrResult = null;
          }

          // Convert image to base64
          const imageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(image.file);
          });

          // Extract trades from image
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
                broker: preSelectedBroker
              }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to analyze image');
          }

          const result = await response.json();
          const tradesFound = Array.isArray(result.trades) ? result.trades.length : 0;
          
          totalTrades += tradesFound;
          if (Array.isArray(result.trades)) {
            allTrades.push(...result.trades);
          }

          setImages(prev => prev.map((img, idx) => 
            idx === i ? { ...img, status: 'success', tradesDetected: tradesFound } : img
          ));
        } catch (error) {
          console.error(`Error analyzing image ${i}:`, error);
          setImages(prev => prev.map((img, idx) => 
            idx === i ? { 
              ...img, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Analysis failed' 
            } : img
          ));
        }
      }

      const successCount = images.filter(img => img.status !== 'error').length;
      const creditsNeeded = successCount;
      const maxTrades = creditsNeeded * 10;

setTotalTradesDetected(totalTrades);
setCreditsRequired(creditsNeeded);
setMaxSelectableTrades(maxTrades);
setExtractedTrades(allTrades);

setShowConfirmation(true);
onReviewStart?.();
    } catch (error) {
      toast.error('Failed to analyze images');
    } finally {
      setIsAnalyzing(false);
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
      
toast.success(`Successfully imported ${tradesToSave.length} trades!`);
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

  return (
    <div className="space-y-6">
    <div className="flex flex-wrap gap-4">
        {images.map((image, index) => (
          <Card key={index} className="relative group overflow-hidden border-[#1E242C] bg-[#12161C] w-[280px]">
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
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                  <p className="text-xs font-medium text-white">Failed</p>
                </div>
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
              "relative w-[280px] h-[157px] rounded-[14px] flex flex-col items-center justify-center cursor-pointer border-dashed border-2 transition-all overflow-hidden group bg-[#12161C]",
              isDragging 
                ? "border-[#3B82F6] bg-[#3B82F6]/10 ring-2 ring-[#3B82F6]/40 shadow-lg" 
                : "border-[#1E242C] hover:border-[#3B82F6]/70 hover:shadow-md"
            )}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div
                className="absolute inset-0 z-10 pointer-events-none rounded-[14px] bg-[#3B82F6]/10 backdrop-blur-sm border-2 border-[#3B82F6] ring-2 ring-[#3B82F6]/40 flex items-center justify-center transition-all"
                role="region"
                aria-label="Drop files to upload"
                aria-busy="true"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#3B82F6]/20 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-[#3B82F6] animate-bounce" />
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
                <p className="text-sm font-medium text-foreground">
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

      {images.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => setShowClearConfirm(true)}
            disabled={isAnalyzing}
          >
            Clear all
          </Button>
          <Button
            onClick={analyzeImages}
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
      )}

      {/* Trade Review Editor - Full Page */}
      {showConfirmation && (
<TradeReviewEditor
  trades={extractedTrades}
  maxSelectableTrades={maxSelectableTrades}
  creditsRequired={creditsRequired}
  imagesProcessed={images.filter(img => img.status === 'success').length}
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