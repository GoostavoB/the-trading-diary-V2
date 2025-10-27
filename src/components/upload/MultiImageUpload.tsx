import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
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
  const credits = useUploadCredits();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const filesToProcess = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        toast.error(`${file.name} is not a valid image file`);
      }
      return isValid;
    });

    const newImages: UploadedImage[] = filesToProcess.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
    }));

    setImages(prev => [...prev, ...newImages]);
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
    setShowPreAnalysisDialog(true);
  };

  const analyzeImages = async () => {
    setShowPreAnalysisDialog(false);
    setIsAnalyzing(true);

    try {
      const results: UploadedImage[] = [];

      // Process sequentially to respect backend rate limits (5/minute)
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        // Mark as analyzing for immediate visual feedback
        setImages(prev => prev.map((img, idx) => (idx === i ? { ...img, status: 'analyzing' } : img)));

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
            // Continue without OCR data
          }

          const { data, error } = await supabase.functions.invoke('extract-trade-info', {
            body: {
              imageBase64: imageBase64,
              ocrText: ocrResult?.text || null,
              ocrConfidence: ocrResult?.confidence || null,
              imageHash: ocrResult?.imageHash || null,
              perceptualHash: ocrResult?.perceptualHash || null,
              bypassCache: bypassCache,
            },
          });

          // Handle specific error responses with status codes
          if (error) {
            let errorMessage = 'Failed to analyze image';

            // Try to read status and JSON body from supabase functions error context
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

            if (status) {
              if (status === 400) errorMessage = serverErr?.error || 'Image validation failed';
              else if (status === 402) {
                errorMessage = serverErr?.error || 'Insufficient upload credits or AI budget';
                toast.error('Insufficient Credits', {
                  description: serverErr?.details || 'You need more upload credits. Please purchase additional credits.',
                });
              }
              else if (status === 422) errorMessage = serverErr?.error || 'No trades detected in image';
              else if (status === 429) errorMessage = serverErr?.error || 'Rate limit exceeded - please wait';
              else if (status === 500) errorMessage = serverErr?.error || 'Server error - please try again';
            }

            console.error('Edge function error:', { status, serverErr, raw: error });
            const failed: UploadedImage = { ...image, status: 'error', trades: [] };
            results.push(failed);
            setImages(prev => prev.map((img, idx) => (idx === i ? failed : img)));
            continue;
          }

          const success: UploadedImage = {
            ...image,
            status: 'success',
            trades: (data as any)?.trades || [],
          };
          results.push(success);
          // Update single image result for progress
          setImages(prev => prev.map((img, idx) => (idx === i ? success : img)));
        } catch (err) {
          console.error('Error analyzing image:', err);
          const failed: UploadedImage = { ...image, status: 'error', trades: [] };
          results.push(failed);
          setImages(prev => prev.map((img, idx) => (idx === i ? failed : img)));
        }

        // Small delay between images to reduce chance of 429s
        await new Promise(res => setTimeout(res, 250));
      }

      // Aggregate
      const allTrades = results
        .filter(img => img.status === 'success')
        .flatMap(img => img.trades || []);

      const successCount = results.filter(img => img.status === 'success').length;

      if (allTrades.length > 0) {
        setDetectedTrades(allTrades);
        // Select all trades by default
        setSelectedTrades(new Set(allTrades.map((_, idx) => idx)));
        setShowConfirmDialog(true);
      } else {
        // Provide specific guidance based on the failure scenario
        if (successCount === 0) {
          toast.error('Analysis Failed', {
            description: `Failed to analyze all ${images.length} image(s). Try re-analyzing with "Bypass Cache" enabled or upload clearer screenshots.`,
          });
        } else {
          toast.error('No Trades Detected', {
            description: 'No trades were detected in any of the images. Try re-analyzing with "Bypass Cache" enabled, ensure the screenshot is clear and contains visible trade information, or enter trades manually.',
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing images:', error);
      toast.error('Failed to analyze images. Please try again.');
    } finally {
      setIsAnalyzing(false);
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
          Upload screenshots of your trades. Each image costs 1 credit and can detect up to 10 trades.
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

      {/* Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
          <Card className="aspect-square flex flex-col items-center justify-center hover:bg-accent/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center px-4">
              Click to upload images
            </p>
          </Card>
        </label>
      </div>

      {/* Analyze Button */}
      {images.length > 0 && (
        <Button
          onClick={startAnalysis}
          disabled={images.length === 0 || isAnalyzing || credits.isLoading}
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
      )}

      {/* Pre-Analysis Dialog */}
      <PreAnalysisConfirmDialog
        open={showPreAnalysisDialog}
        onOpenChange={setShowPreAnalysisDialog}
        imageCount={images.length}
        creditsRequired={images.length}
        currentBalance={credits.balance}
        onConfirm={analyzeImages}
        onPurchaseCredits={() => {
          setShowPreAnalysisDialog(false);
          setShowPurchaseDialog(true);
        }}
        isAnalyzing={isAnalyzing}
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
              Review the detected trades before importing
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
            
            <div className="max-h-[300px] overflow-y-auto space-y-2">
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
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{trade.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {trade.side} • ${trade.entry_price}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.side === 'long' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {trade.side}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmImport}
              disabled={selectedTrades.size === 0}
            >
              Import {selectedTrades.size} Trade{selectedTrades.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
