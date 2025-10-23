import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileImage, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EnhancedFileUploadProps {
  onFileSelected: (file: File) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  existingPreview?: string | null;
  onRemove?: () => void;
  uploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

export const EnhancedFileUpload = ({
  onFileSelected,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  existingPreview,
  onRemove,
  uploading = false,
  uploadProgress = 0,
  className,
}: EnhancedFileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Please upload ${acceptedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()} files only.`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File size (${fileSizeMB.toFixed(1)}MB) exceeds maximum allowed size (${maxSize}MB).`;
    }

    return null;
  }, [acceptedTypes, maxSize]);

  const handleFile = useCallback(async (file: File) => {
    setIsValidating(true);
    setValidationError(null);

    // Simulate validation delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    const error = validateFile(file);
    setIsValidating(false);

    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }

    onFileSelected(file);
  }, [validateFile, onFileSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
    }
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onRemove]);

  if (existingPreview) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn("relative", className)}
      >
        <Card className="relative overflow-hidden glass-strong">
          {/* Upload Progress Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 text-accent animate-spin mb-4" />
              <p className="text-sm font-medium mb-2">Processing image...</p>
              <Progress value={uploadProgress} className="w-3/4" />
              <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
            </div>
          )}

          {/* Image Preview */}
          <div className="relative group">
            <img
              src={existingPreview}
              alt="Upload preview"
              className="w-full h-64 object-contain rounded-t-lg border-b border-border bg-muted"
            />
            
            {/* Hover Overlay with Actions */}
            {!uploading && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  onClick={handleRemove}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Remove Image
                </Button>
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Image ready for extraction</span>
            </div>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />

      <motion.label
        htmlFor="file-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-64 rounded-lg cursor-pointer transition-all duration-300",
          "border-2 border-dashed",
          isDragging
            ? "border-accent bg-accent/10 scale-[1.02]"
            : validationError
            ? "border-destructive bg-destructive/5"
            : "border-border hover:border-accent/50 hover:bg-muted/50",
          isValidating && "pointer-events-none opacity-60"
        )}
        whileHover={{ scale: isDragging ? 1.02 : 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <AnimatePresence mode="wait">
          {isValidating ? (
            <motion.div
              key="validating"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="h-12 w-12 text-accent animate-spin mb-4" />
              <p className="text-sm font-medium">Validating file...</p>
            </motion.div>
          ) : validationError ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center text-center max-w-sm px-4"
            >
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm font-medium text-destructive mb-2">Upload Failed</p>
              <p className="text-xs text-muted-foreground">{validationError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={(e) => {
                  e.preventDefault();
                  setValidationError(null);
                }}
              >
                Try Again
              </Button>
            </motion.div>
          ) : isDragging ? (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Upload className="h-16 w-16 text-accent mb-4" />
              </motion.div>
              <p className="text-lg font-semibold text-accent">Drop your file here</p>
              <p className="text-sm text-muted-foreground mt-1">Release to upload</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center px-4"
            >
              <div className="p-4 rounded-full bg-accent/10 mb-4">
                <Upload className="h-8 w-8 text-accent" />
              </div>
              <p className="text-base font-semibold mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                {acceptedTypes.map(t => t.split('/')[1]).join(', ').toUpperCase()} up to {maxSize}MB
              </p>
              <div className="flex gap-2 mt-3">
                <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
                  <FileImage className="inline h-3 w-3 mr-1" />
                  High Quality
                </div>
                <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
                  <CheckCircle2 className="inline h-3 w-3 mr-1" />
                  Secure
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating particles effect on hover */}
        {!isDragging && !validationError && !isValidating && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <motion.div
              className="absolute h-1 w-1 bg-accent rounded-full"
              animate={{
                y: [-20, -120],
                x: [20, 60],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="absolute h-1 w-1 bg-accent rounded-full"
              animate={{
                y: [-20, -120],
                x: [-20, -60],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 0.5,
              }}
            />
          </div>
        )}
      </motion.label>
    </div>
  );
};
