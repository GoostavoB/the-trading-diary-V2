import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUploadCredits } from '@/hooks/useUploadCredits';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { PreAnalysisConfirmDialog } from './PreAnalysisConfirmDialog';
import { CreditPurchaseDialog } from './CreditPurchaseDialog';
import { runOCR } from '@/utils/ocrPipeline';

interface UploadedImage {
  file: File;
  preview: string;
  status: 'pending' | 'analyzing' | 'success' | 'error';
  trades?: any[];
}

interface MultiImageUploadProps {
  onTradesExtracted: (trades: any[]) => void;
}

export function MultiImageUpload({ onTradesExtracted }: MultiImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreAnalysisDialog, setShowPreAnalysisDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [detectedTrades, setDetectedTrades] = useState<any[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<Set<number>>(new Set());
  const [bypassCache, setBypassCache] = useState(false);
  const [batchProgress, setBatchProgress] = useState<string>('');
  const [queuedCount, setQueuedCount] = useState(0);
  const [broker, setBroker] = useState<string>('');
  const [batchBroker, setBatchBroker] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const credits = useUploadCredits();

  const processFiles = (files: File[]) => {
    const filesToProcess = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast.error(`${file.name} is not a valid image file`);
      }
      return isValid;
    });

    if (filesToProcess.length === 0) {
      return;
    }

    const newImages: UploadedImage[] = filesToProcess.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
    }));

    setImages(prev => [...prev, ...newImages]);
    toast.success(`Added ${filesToProcess.length} image${filesToProcess.length !== 1 ? 's' : ''}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isAnalyzing) {
      toast.error('Cannot add images while analysis is in progress');
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const startAnalysis = () => {
    console.log('🔵 Analyze button clicked', {
      imagesLength: images.length,
      creditsLoading: credits.isLoading,
      currentBalance: credits.balance,
      isAnalyzing
    });
    
    // Open dialog immediately - don't block on credits refetch
    console.log('🎬 Opening pre-analysis dialog');
    setShowPreAnalysisDialog(true);
    
    // Always refetch credits in background to avoid stale 0
    console.log('⏳ Refreshing credits in background...');
    credits.refetch()
      .then(() => console.log('✅ Credits refetched:', credits.balance))
      .catch((e) => console.error('❌ Refetch error:', e));
  };

  const analyzeImages = async () => {
    if (images.length === 0) return;

    setShowPreAnalysisDialog(false);
    setIsAnalyzing(true);
    const results: UploadedImage[] = [];
    const batchSize = 15; // Process 15 at a time (within minute limit)
    const batchDelayMs = 65000; // Wait 65 seconds between batches
    const totalBatches = Math.ceil(images.length / batchSize);
    let processedCount = 0;

    // Helper to wait with countdown
    const waitWithCountdown = async (ms: number, reason: string) => {
      const seconds = Math.ceil(ms / 1000);
      for (let i = seconds; i > 0; i--) {
        setBatchProgress(`${reason} - Resuming in ${i}s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    // Process images in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, images.length);
      const currentBatch = images.slice(batchStart, batchEnd);
      
      setBatchProgress(`Batch ${batchIndex + 1}/${totalBatches} • Processing ${batchStart + 1}-${batchEnd}/${images.length}...`);
      setQueuedCount(images.length - batchEnd);

      // Process all images in batch in parallel for 8-10x speedup
      const batchPromises = currentBatch.map(async (image, i) => {
        const globalIndex = batchStart + i;
        if (image.status !== 'pending') return null;

        const analyzing: UploadedImage = { ...image, status: 'analyzing' };
        setImages(prev => prev.map((img, idx) => (idx === globalIndex ? analyzing : img)));
        processedCount++;

        // Retry logic for 429 errors
        let retryCount = 0;
        const maxRetries = 2;
        let success = false;

        while (!success && retryCount <= maxRetries) {
          try {
            // Convert image to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(image.file);
            });
            const imageBase64 = await base64Promise;

            // Run OCR on the image
            let ocrResult: any | undefined;
            try {
              ocrResult = await runOCR(image.file);
              console.log(`OCR completed for ${image.file.name}:`, {
                confidence: ocrResult.confidence,
                qualityScore: ocrResult.qualityScore,
                textLength: ocrResult.text.length
              });
            } catch (ocrError) {
              console.error('OCR failed for image:', ocrError);
            }

            const { data, error } = await supabase.functions.invoke('extract-trade-info', {
              body: {
                imageBase64: imageBase64,
                ocrText: ocrResult?.text || null,
                ocrConfidence: ocrResult?.confidence || null,
                imageHash: ocrResult?.imageHash || null,
                perceptualHash: ocrResult?.perceptualHash || null,
                bypassCache: bypassCache,
                broker: batchBroker || null,
              },
            });

            if (data?.trades && Array.isArray(data.trades)) {
              console.log(`✅ Success: ${data.trades.length} trades detected`);
              const successImg: UploadedImage = { ...image, status: 'success', trades: data.trades };
              setImages(prev => prev.map((img, idx) => (idx === globalIndex ? successImg : img)));
              success = true;
              return successImg;
            } else {
              // Handle specific error responses with status codes
              if (error) {
                const resp = (error as any)?.context?.response as Response | undefined;
                let status: number | undefined;
                let serverErr: any = null;
                try {
                  status = resp?.status;
                  const text = await resp?.text?.();
                  if (text) {
                    try { serverErr = JSON.parse(text); } catch { serverErr = { error: text }; }
                  }
                } catch {}

                let errorMessage = 'Failed to analyze image';
                
                if (status === 429 && retryCount < maxRetries) {
                  // Rate limit - retry after delay
                  const retryAfter = serverErr?.retryAfterSec || 60;
                  retryCount++;
                  console.log(`⏳ Rate limited. Retry ${retryCount}/${maxRetries} after ${retryAfter}s`);
                  
                  const queuedImg: UploadedImage = { ...image, status: 'pending' };
                  setImages(prev => prev.map((img, idx) => (idx === globalIndex ? queuedImg : img)));
                  
                  await waitWithCountdown(retryAfter * 1000, `Rate limit - queued for retry ${retryCount}/${maxRetries}`);
                  
                  const retryingImg: UploadedImage = { ...image, status: 'analyzing' };
                  setImages(prev => prev.map((img, idx) => (idx === globalIndex ? retryingImg : img)));
                  continue; // Retry the loop
                }

                // Final error handling
                if (status === 400) errorMessage = serverErr?.error || 'Image validation failed';
                else if (status === 402) {
                  errorMessage = serverErr?.error || 'Insufficient upload credits or AI budget';
                  toast.error('Insufficient Credits', {
                    description: serverErr?.details || 'You need more upload credits. Please purchase additional credits.',
                  });
                }
                else if (status === 422) errorMessage = serverErr?.error || 'No trades detected in image';
                else if (status === 429) errorMessage = 'Rate limit exceeded after retries';
                else if (status === 500) errorMessage = serverErr?.error || 'Server error - please try again';

                console.error('Edge function error:', { status, serverErr, raw: error });
                const failed: UploadedImage = { ...image, status: 'error', trades: [] };
                setImages(prev => prev.map((img, idx) => (idx === globalIndex ? failed : img)));
                toast.error('Analysis Failed', { description: errorMessage });
                success = true; // Exit retry loop
                return failed;
              } else {
                console.warn('⚠️ No trades found');
                const noTrades: UploadedImage = { ...image, status: 'error', trades: [] };
                setImages(prev => prev.map((img, idx) => (idx === globalIndex ? noTrades : img)));
                success = true; // Exit retry loop
                return noTrades;
              }
            }
          } catch (err) {
            console.error('Network error:', err);
            const failed: UploadedImage = { ...image, status: 'error', trades: [] };
            setImages(prev => prev.map((img, idx) => (idx === globalIndex ? failed : img)));
            toast.error('Network Error', { description: 'Failed to connect to the server' });
            success = true; // Exit retry loop
            return failed;
          }
        }

        return null; // Should never reach here but TypeScript needs a return
      });

      // Wait for all images in batch to complete in parallel and collect results
      const settledPromises = await Promise.allSettled(batchPromises);
      
      // Collect successful results (remove race condition)
      settledPromises.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });
    }

    setIsAnalyzing(false);
    setBatchProgress('');
    setQueuedCount(0);

    // Show summary
    const successCount = results.filter(r => r.status === 'success').length;
    const totalTrades = results.reduce((sum, r) => sum + (r.trades?.length || 0), 0);

    console.log(`📊 Analysis complete: ${successCount}/${images.length} images, ${totalTrades} trades detected`);

    if (successCount === 0) {
      toast.error('Analysis Failed', {
        description: 'No trades were detected. Try using "Bypass Cache" or ensure screenshots are clear.',
      });
    } else if (totalTrades === 0) {
      toast.warning('No Trades Detected', {
        description: 'Images analyzed but no trades found. Try clearer screenshots or use "Bypass Cache".',
      });
    } else {
      // Pre-fill broker on all detected trades
      const allTrades = results.flatMap(r => r.trades || []).map(trade => ({
        ...trade,
        broker: trade.broker || batchBroker,
      }));
      setDetectedTrades(allTrades);
      setSelectedTrades(new Set(allTrades.map((_, idx) => idx)));
      setShowConfirmDialog(true);
      
      toast.success('Trades Detected', {
        description: `Found ${totalTrades} trade${totalTrades !== 1 ? 's' : ''} from ${successCount} image${successCount !== 1 ? 's' : ''}${processedCount > successCount ? ` (${processedCount} processed)` : ''}`,
      });
    }
  };

  const handleConfirmImport = async () => {
    try {
      // Get only selected trades
      const tradesToImport = detectedTrades.filter((_, idx) => selectedTrades.has(idx));
      
      if (tradesToImport.length === 0) {
        toast.error('Please select at least one trade to import');
        return;
      }

      // Pass selected trades to parent component for import
      onTradesExtracted(tradesToImport);
      
      toast.success(`Successfully imported ${tradesToImport.length} trade${tradesToImport.length !== 1 ? 's' : ''}`);
      
      setShowConfirmDialog(false);
      setImages([]);
      setDetectedTrades([]);
      setSelectedTrades(new Set());
      setBatchBroker(null); // Clear locked broker for next batch
      
      await credits.refetch();
    } catch (error) {
      console.error('Error importing trades:', error);
      toast.error('Failed to import trades. Please try again.');
    }
  };

  const toggleTradeSelection = (index: number) => {
    setSelectedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleAllTrades = () => {
    if (selectedTrades.size === detectedTrades.length) {
      setSelectedTrades(new Set());
    } else {
      setSelectedTrades(new Set(detectedTrades.map((_, idx) => idx)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Upload Trade Screenshots</h3>
          <span className="text-sm text-muted-foreground">
            {images.length} image{images.length !== 1 ? 's' : ''} selected
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Drag & drop or click to upload screenshots. Each image costs 1 credit and can detect up to 10 trades.
        </p>
        
        <Collapsible className="bg-muted/50 rounded-lg p-3 mb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm hover:opacity-80 transition-opacity">
            <span className="text-primary font-medium">Click here for best results</span>
            <ChevronDown className="h-4 w-4 text-primary" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>• Upload clear, high-resolution screenshots</li>
              <li>• Include all trade details (symbol, entry, exit, P&L)</li>
              <li>• Ensure text is readable and not cut off</li>
              <li>• Multiple trades per screenshot are supported</li>
              <li>• Avoid blurry or compressed images</li>
            </ul>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center space-x-2 bg-muted/30 rounded-lg p-3">
          <input
            type="checkbox"
            id="bypassCache"
            checked={bypassCache}
            onChange={(e) => setBypassCache(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="bypassCache" className="text-sm text-muted-foreground cursor-pointer">
            Re-analyze without cache (use if previous analysis had issues)
          </label>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50",
          isAnalyzing && "pointer-events-none opacity-50"
        )}
      >
        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
          {images.map((image, index) => (
            <Card key={index} className="relative overflow-hidden aspect-square group">
              <img
                src={image.preview}
                alt={`Trade screenshot ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Remove button */}
              <button
                onClick={() => handleRemoveImage(index)}
                disabled={isAnalyzing}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Status indicators */}
              {image.status === 'analyzing' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                </div>
              )}
              {image.status === 'success' && (
                <div className="absolute bottom-2 right-2 p-1 bg-green-600 rounded-full">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
              {image.status === 'error' && (
                <div className="absolute bottom-2 right-2 p-1 bg-destructive rounded-full">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </Card>
          ))}

          {/* Upload button */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isAnalyzing}
            />
            <Card className={cn(
              "aspect-square flex flex-col items-center justify-center transition-all duration-200",
              isDragging
                ? "bg-primary/10 border-primary"
                : "hover:bg-accent/50"
            )}>
              <Upload className={cn(
                "h-8 w-8 mb-2 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
              <p className={cn(
                "text-sm text-center px-4 transition-colors",
                isDragging ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {isDragging ? "Drop images here" : "Click or drag to upload"}
              </p>
            </Card>
          </label>
        </div>

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-primary/5 backdrop-blur-[2px] flex items-center justify-center pointer-events-none rounded-lg">
            <div className="bg-background/90 rounded-lg p-6 border-2 border-primary shadow-lg">
              <Upload className="h-12 w-12 text-primary mx-auto mb-2" />
              <p className="text-lg font-semibold text-primary">Drop images to upload</p>
            </div>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      {images.length > 0 && (
        <div className="space-y-2">
          {batchProgress && (
            <div className="text-sm text-center text-muted-foreground font-medium">
              {batchProgress}
              {queuedCount > 0 && <span className="ml-2">• {queuedCount} queued</span>}
            </div>
          )}
          <Button
            onClick={startAnalysis}
            disabled={images.length === 0 || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Analyzing Images...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Analyze & Detect Trades ({images.length} credit{images.length !== 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Pre-Analysis Dialog */}
      <PreAnalysisConfirmDialog
        open={showPreAnalysisDialog}
        onOpenChange={setShowPreAnalysisDialog}
        imageCount={images.length}
        creditsRequired={images.length}
        currentBalance={credits.balance}
        onConfirm={() => {
          if (!broker) {
            toast.error('Please select a broker');
            return;
          }
          // Lock the broker for this batch and start analysis
          setBatchBroker(broker);
          setShowPreAnalysisDialog(false);
          analyzeImages();
        }}
        onPurchaseCredits={() => {
          setShowPreAnalysisDialog(false);
          setShowPurchaseDialog(true);
        }}
        isAnalyzing={isAnalyzing}
        broker={broker}
        onBrokerChange={setBroker}
      />

      {/* Purchase Credits Dialog */}
      <CreditPurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        onPurchaseComplete={() => {
          setShowPurchaseDialog(false);
          setShowPreAnalysisDialog(true);
        }}
      />

      {/* Post-Analysis Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Trade Import</DialogTitle>
            <DialogDescription>
              Summary only — you'll edit everything in the next step
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Trades Detected:</span>
                <span className="text-lg font-bold">{detectedTrades.length}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">
                  {selectedTrades.size} of {detectedTrades.length} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllTrades}
                >
                  {selectedTrades.size === detectedTrades.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {detectedTrades.map((trade, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded border cursor-pointer transition-colors ${
                    selectedTrades.has(index) 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-muted/50 border-border hover:bg-muted'
                  }`}
                  onClick={() => toggleTradeSelection(index)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTrades.has(index)}
                      onChange={() => toggleTradeSelection(index)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-base">{trade.symbol}</span>
                          <Badge
                            variant={trade.side === 'long' ? 'default' : 'secondary'}
                            className={cn(
                              "text-xs",
                              trade.side === 'long'
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                            )}
                          >
                            {trade.side?.toUpperCase()}
                          </Badge>
                          {trade.leverage && trade.leverage > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {trade.leverage}x
                            </Badge>
                          )}
                          {trade.broker && (
                            <Badge variant="outline" className="text-xs">
                              {trade.broker}
                            </Badge>
                          )}
                        </div>
                        
                        {/* P&L with gain/loss pill */}
                        <Badge
                          variant={(trade.profit_loss || 0) >= 0 ? "default" : "destructive"}
                          className={cn(
                            "gap-1.5 font-medium tabular-nums",
                            (trade.profit_loss || 0) >= 0
                              ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                              : "bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20"
                          )}
                        >
                          {(trade.profit_loss || 0) >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          ${Math.abs(trade.profit_loss || 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Badge>
                      </div>

                      {/* ROI */}
                      {trade.roi !== undefined && trade.roi !== null && (
                        <div className="mb-3 mt-2">
                          <span
                            className={cn(
                              "text-sm font-semibold tabular-nums",
                              trade.roi >= 0
                                ? "text-green-600 dark:text-green-500"
                                : "text-red-600 dark:text-red-500"
                            )}
                          >
                            {trade.roi >= 0 ? '+' : ''}
                            {trade.roi.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}% ROI
                          </span>
                        </div>
                      )}
                      
                      {/* Trade details grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div>
                          Entry: <span className="tabular-nums">${trade.entry_price?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}</span>
                        </div>
                        <div>
                          Exit: <span className="tabular-nums">${trade.exit_price?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}</span>
                        </div>
                        <div>
                          Size: <span className="tabular-nums">${trade.position_size?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}</span>
                        </div>
                        <div>
                          Margin: <span className="tabular-nums">${trade.margin?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}</span>
                        </div>
                        {(trade.trading_fee !== 0 || trade.funding_fee !== 0) && (
                          <div>
                            Fees: <span className="tabular-nums">${((trade.trading_fee || 0) + (trade.funding_fee || 0)).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}</span>
                          </div>
                        )}
                        {trade.period_of_day && (
                          <div className="capitalize">{trade.period_of_day}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleConfirmImport}
              disabled={selectedTrades.size === 0}
              className="w-full"
            >
              Import {selectedTrades.size} Trade{selectedTrades.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
