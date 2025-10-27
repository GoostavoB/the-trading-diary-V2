import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadCredits } from '@/hooks/useUploadCredits';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PreAnalysisConfirmDialog } from './PreAnalysisConfirmDialog';
import { CreditPurchaseDialog } from './CreditPurchaseDialog';

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
      const results = await Promise.all(
        images.map(async (image) => {
          try {
            // Convert image to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(image.file);
            });
            
            const imageBase64 = await base64Promise;

            const { data, error } = await supabase.functions.invoke('extract-trade-info', {
              body: { 
                imageBase64: imageBase64,
              },
            });

            if (error) throw error;

            return {
              ...image,
              status: 'success' as const,
              trades: data.trades || [],
            };
          } catch (error) {
            console.error('Error analyzing image:', error);
            return {
              ...image,
              status: 'error' as const,
              trades: [],
            };
          }
        })
      );

      setImages(results);

      const allTrades = results
        .filter(img => img.status === 'success')
        .flatMap(img => img.trades || []);

      if (allTrades.length > 0) {
        setDetectedTrades(allTrades);
        setShowConfirmDialog(true);
      } else {
        toast.error('No trades detected in the uploaded images');
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
      const totalTrades = detectedTrades.length;

      const { data, error } = await supabase.functions.invoke('process-multi-upload', {
        body: {
          trades: detectedTrades,
        },
      });

      if (error) throw error;

      toast.success(`Successfully imported ${totalTrades} trades`);

      onTradesExtracted(data.trades);
      
      setShowConfirmDialog(false);
      setImages([]);
      setDetectedTrades([]);
      
      await credits.refetch();
    } catch (error) {
      console.error('Error importing trades:', error);
      toast.error('Failed to import trades. Please try again.');
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
        <p className="text-sm text-muted-foreground">
          Upload screenshots of your trades. Each image costs 1 credit and can detect up to 10 trades.
        </p>
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
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {detectedTrades.map((trade, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded border">
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
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmImport}>
              Import Trades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
