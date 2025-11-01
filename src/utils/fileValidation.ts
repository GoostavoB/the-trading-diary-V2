/**
 * Comprehensive File Validation Utility
 * Validates files before upload to catch issues early
 */

import { uploadLogger } from './uploadLogger';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: string;
}

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.csv', '.xls', '.xlsx'],
};

/**
 * Validate file size
 */
export const validateFileSize = (file: File, maxSize: number = DEFAULT_OPTIONS.maxSize): ValidationResult => {
  uploadLogger.validation('Checking file size', { fileName: file.name, size: file.size, maxSize });

  if (file.size > maxSize) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const error = `File too large (${fileSizeMB}MB). Maximum allowed: ${maxSizeMB}MB`;
    
    uploadLogger.validationError('File size validation failed', error);
    return {
      valid: false,
      error,
      details: `Reduce image quality or dimensions and try again.`,
    };
  }

  uploadLogger.success('Validation', 'File size OK', { size: file.size });
  return { valid: true };
};

/**
 * Validate file type
 */
export const validateFileType = (file: File, allowedTypes: string[] = DEFAULT_OPTIONS.allowedTypes): ValidationResult => {
  uploadLogger.validation('Checking file type', { fileName: file.name, type: file.type, allowedTypes });

  if (!allowedTypes.includes(file.type)) {
    const error = `Invalid file type: ${file.type || 'unknown'}`;
    const allowed = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    
    uploadLogger.validationError('File type validation failed', error);
    return {
      valid: false,
      error,
      details: `Allowed types: ${allowed}`,
    };
  }

  uploadLogger.success('Validation', 'File type OK', { type: file.type });
  return { valid: true };
};

/**
 * Validate file extension
 */
export const validateFileExtension = (file: File, allowedExtensions: string[] = DEFAULT_OPTIONS.allowedExtensions): ValidationResult => {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  uploadLogger.validation('Checking file extension', { fileName: file.name, extension, allowedExtensions });

  if (!allowedExtensions.includes(extension)) {
    const error = `Invalid file extension: ${extension}`;
    const allowed = allowedExtensions.map(e => e.toUpperCase()).join(', ');
    
    uploadLogger.validationError('File extension validation failed', error);
    return {
      valid: false,
      error,
      details: `Allowed extensions: ${allowed}`,
    };
  }

  uploadLogger.success('Validation', 'File extension OK', { extension });
  return { valid: true };
};

/**
 * Check if file is corrupted (basic check)
 */
export const validateFileIntegrity = async (file: File): Promise<ValidationResult> => {
  uploadLogger.validation('Checking file integrity', { fileName: file.name });

  try {
    // Try to read a small portion of the file
    const slice = file.slice(0, 100);
    await slice.arrayBuffer();

    // For images, try to load them
    if (file.type.startsWith('image/')) {
      const result = await new Promise<ValidationResult>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(url);
          uploadLogger.success('Validation', 'Image file integrity OK');
          resolve({ valid: true });
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          const error = 'Image file appears to be corrupted';
          uploadLogger.validationError('Image integrity check failed', error);
          resolve({
            valid: false,
            error,
            details: 'The file cannot be opened as an image. Try re-exporting or using a different file.',
          });
        };

        img.src = url;

        // Timeout after 5 seconds
        setTimeout(() => {
          URL.revokeObjectURL(url);
          uploadLogger.validationError('Image integrity check timeout', 'Image load timeout');
          resolve({
            valid: false,
            error: 'File validation timed out',
            details: 'The file is taking too long to validate. It may be corrupted.',
          });
        }, 5000);
      });

      return result;
    }

    uploadLogger.success('Validation', 'File integrity OK');
    return { valid: true };
  } catch (error) {
    uploadLogger.validationError('File integrity check failed', error as Error);
    return {
      valid: false,
      error: 'File appears to be corrupted',
      details: 'Unable to read file data. The file may be damaged.',
    };
  }
};

/**
 * Comprehensive file validation
 */
export const validateFile = async (
  file: File,
  options: FileValidationOptions = {}
): Promise<ValidationResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  uploadLogger.validation('Starting comprehensive validation', { fileName: file.name, options: opts });

  // 1. Size check
  const sizeResult = validateFileSize(file, opts.maxSize);
  if (!sizeResult.valid) return sizeResult;

  // 2. Type check
  const typeResult = validateFileType(file, opts.allowedTypes);
  if (!typeResult.valid) return typeResult;

  // 3. Extension check
  const extResult = validateFileExtension(file, opts.allowedExtensions);
  if (!extResult.valid) return extResult;

  // 4. Integrity check (for images)
  if (file.type.startsWith('image/')) {
    const integrityResult = await validateFileIntegrity(file);
    if (!integrityResult.valid) return integrityResult;
  }

  uploadLogger.success('Validation', 'All validation checks passed', { fileName: file.name });
  return { valid: true };
};
