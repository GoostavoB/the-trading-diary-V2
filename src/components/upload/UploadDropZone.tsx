import { useState } from "react";
import { Upload, FileImage, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface UploadDropZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string;
  maxSize?: number;
  className?: string;
}

export const UploadDropZone = ({
  onFileSelect,
  acceptedFormats = "image/png, image/jpeg, image/webp",
  maxSize = 10,
  className
}: UploadDropZoneProps) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

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

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      onFileSelect(imageFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[280px] rounded-xl cursor-pointer transition-all duration-300",
        "border-2 border-dashed",
        isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : isHovering
          ? "border-primary/60 bg-primary/5"
          : "border-border bg-muted/30 hover:bg-muted/50",
        className
      )}
    >
      <input
        type="file"
        accept={acceptedFormats}
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div
          className={cn(
            "relative p-6 rounded-full transition-all duration-300",
            isDragging || isHovering
              ? "bg-primary/10 scale-110"
              : "bg-primary/5"
          )}
        >
          <Upload
            className={cn(
              "h-12 w-12 transition-all duration-300",
              isDragging || isHovering
                ? "text-primary scale-110"
                : "text-primary/60"
            )}
          />
          {isDragging && (
            <div className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-ping" />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">
            {isDragging
              ? t('upload.dropHere')
              : t('upload.dragAndDrop')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('upload.orClickToSelect')}
          </p>
        </div>

        <div className="flex items-center gap-6 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileImage className="h-4 w-4" />
            <span>PNG, JPG, WEBP</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t('upload.maxSize', { size: maxSize })}</span>
          </div>
        </div>
      </div>
    </label>
  );
};
