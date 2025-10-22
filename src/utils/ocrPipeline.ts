import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  qualityScore: number;
  imageHash: string;
  perceptualHash: string;
}

/**
 * Run OCR on an image file to extract text
 * Returns quality score to determine if OCR is reliable enough
 */
export const runOCR = async (imageFile: File): Promise<OCRResult> => {
  const startTime = Date.now();
  
  try {
    // Generate image hashes for caching
    const imageBuffer = await imageFile.arrayBuffer();
    const imageHash = await generateImageHash(imageBuffer);
    const perceptualHash = await generatePerceptualHash(imageFile);
    
    // Run Tesseract OCR with 3 second timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('OCR timeout')), 3000)
    );
    
    const ocrPromise = Tesseract.recognize(imageFile, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    const { data } = await Promise.race([ocrPromise, timeoutPromise]) as any;
    
    const text = data.text;
    const confidence = data.confidence / 100; // Normalize to 0-1
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(text, confidence);
    
    const duration = Date.now() - startTime;
    console.log(`OCR completed in ${duration}ms with confidence: ${confidence.toFixed(2)}, quality: ${qualityScore.toFixed(2)}`);
    
    return {
      text,
      confidence,
      qualityScore,
      imageHash,
      perceptualHash
    };
  } catch (error) {
    console.error('OCR failed:', error);
    throw error;
  }
};

/**
 * Calculate quality score based on OCR confidence and content analysis
 * Score ranges from 0-1, with threshold of 0.80 for using OCR vs vision
 */
function calculateQualityScore(text: string, confidence: number): number {
  let score = confidence * 0.6; // Base confidence: 60% weight
  
  // Numeric token detection (trading data usually has lots of numbers)
  const numericTokens = (text.match(/\d+\.?\d*/g) || []).length;
  const totalTokens = text.split(/\s+/).filter(t => t.length > 0).length;
  const numericRatio = totalTokens > 0 ? numericTokens / totalTokens : 0;
  score += numericRatio * 0.2; // Numeric density: 20% weight
  
  // Table/structure detection (look for common trading patterns)
  const tableIndicators = [
    /symbol|asset|coin|pair/i,
    /entry|exit|price/i,
    /profit|loss|p&l|pnl/i,
    /long|short|buy|sell/i,
    /\d{1,2}:\d{2}/,  // Time format HH:MM
    /\d{4}-\d{2}-\d{2}/, // Date format YYYY-MM-DD
  ];
  const matchedIndicators = tableIndicators.filter(regex => regex.test(text)).length;
  const structureScore = matchedIndicators / tableIndicators.length;
  score += structureScore * 0.2; // Structure indicators: 20% weight
  
  return Math.min(score, 1.0); // Cap at 1.0
}

/**
 * Generate SHA-256 hash of image content for exact duplicate detection
 */
async function generateImageHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generate perceptual hash for near-duplicate detection
 * Simplified version - in production, use a proper pHash library
 */
async function generatePerceptualHash(imageFile: File): Promise<string> {
  // Simplified perceptual hash based on file properties
  // In production, implement DCT-based perceptual hashing
  const name = imageFile.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
  const size = Math.floor(imageFile.size / 1024); // KB
  return `${name}_${size}`;
}
