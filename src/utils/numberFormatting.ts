/**
 * Prevents scientific notation display for very small/large numbers
 * Formats number to appropriate decimal places based on magnitude
 */
export const formatNumberInput = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return '';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '';
  
  // Handle very small numbers (common in crypto)
  if (Math.abs(num) < 0.000001 && num !== 0) {
    return num.toFixed(8); // 8 decimal places for crypto
  }
  
  // Handle normal range numbers
  if (Math.abs(num) < 1) {
    return num.toString(); // Keep original precision
  }
  
  return num.toString();
};

/**
 * Validates if a string is a valid decimal number
 */
export const isValidDecimal = (value: string): boolean => {
  if (value === '' || value === '-') return true; // Allow empty or negative sign
  return /^-?\d*\.?\d*$/.test(value);
};

/**
 * Parse input value safely, preventing scientific notation issues
 */
export const parseDecimalInput = (value: string): number | null => {
  if (!value || value === '-') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};
