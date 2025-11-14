/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts (default: 3)
 * @param initialDelay Initial delay in ms (default: 1000)
 * @param maxDelay Maximum delay in ms (default: 10000)
 * @param onRetry Callback for each retry attempt
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        // Mark that all retries were exhausted
        (lastError as any).retriesExhausted = true;
        (lastError as any).totalAttempts = maxRetries + 1;
        throw lastError;
      }
      
      // Calculate delay with exponential backoff: delay = initialDelay * 2^attempt
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      
      // Add jitter to prevent thundering herd (±25% randomness)
      const jitter = delay * (0.75 + Math.random() * 0.5);
      const finalDelay = Math.round(jitter);
      
      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1, lastError, finalDelay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error is retryable (network errors, timeouts, 5xx errors, truncation)
 */
export function isRetryableError(error: any): boolean {
  // Check for explicit isRetryable flag
  if (error.isRetryable === true) {
    return true;
  }
  
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Timeout errors
  if (error.message?.includes('timeout')) {
    return true;
  }
  
  // 5xx server errors
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // 429 rate limit (should retry with backoff)
  if (error.status === 429) {
    return true;
  }
  
  // Parsing errors from the edge function (AI might have issues)
  if (error.message?.includes('Failed to parse AI response')) {
    return true;
  }
  
  // JSON truncation errors
  if (error.message?.includes('truncated') || error.details?.includes('truncated')) {
    return true;
  }
  
  return false;
}
