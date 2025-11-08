import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

/**
 * Helper utility for database writes with standardized auth and error handling
 */
export class DbWriteError extends Error {
  constructor(message: string, public readonly details?: any) {
    super(message);
    this.name = 'DbWriteError';
  }
}

export const ensureAuthenticated = (user: User | null): User => {
  if (!user) {
    throw new DbWriteError('You must be signed in to perform this action. Please log in and try again.');
  }
  return user;
};

export const handleDbError = (error: any, operation: string): never => {
  console.error(`[dbWrite] ${operation} failed:`, error);
  
  const message = error?.message || 'An unexpected error occurred';
  
  if (message.includes('row-level security')) {
    throw new DbWriteError('Permission denied. You may need to sign in again.', error);
  }
  
  if (message.includes('violates foreign key')) {
    throw new DbWriteError('Invalid reference. Please refresh and try again.', error);
  }
  
  throw new DbWriteError(message, error);
};

