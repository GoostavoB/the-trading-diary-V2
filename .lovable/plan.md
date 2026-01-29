
# Fix Google OAuth 404 Error

## Problem
Google Sign-In is returning a 404 "page not found" error. The current implementation in `AuthContext.tsx` uses a manual popup-based OAuth flow that calls `https://oauth.lovable.app/~oauth/initiate`, which is causing the 404.

## Root Cause
The `signInWithGoogle` function (lines 137-218 in `AuthContext.tsx`) uses a custom implementation instead of the official Lovable Cloud Auth module that's already available at `src/integrations/lovable/index.ts`.

## Solution
Replace the custom OAuth implementation with the official `lovable.auth.signInWithOAuth()` function from the Lovable Cloud Auth module.

## File to Modify

### `src/contexts/AuthContext.tsx`

**Changes:**

1. **Add import** for the lovable module:
```typescript
import { lovable } from '@/integrations/lovable';
```

2. **Replace the entire `signInWithGoogle` function** (lines 137-218):

Current (broken):
```typescript
const signInWithGoogle = async (): Promise<{ error: any }> => {
  // Generate state for CSRF protection
  const state = generateState();
  // ... 80+ lines of manual popup logic
};
```

New (using Lovable Cloud Auth):
```typescript
const signInWithGoogle = async (): Promise<{ error: any }> => {
  try {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      toast.error(result.error.message || 'Sign in failed');
      return { error: result.error };
    }

    // If redirected, the page will reload and auth state will update automatically
    if (!result.redirected) {
      navigate('/dashboard');
    }

    return { error: null };
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    toast.error('Failed to sign in with Google');
    return { error };
  }
};
```

3. **Remove unused helper function** `generateState()` (lines 8-12) since it's no longer needed.

## Technical Details

| Item | Before | After |
|------|--------|-------|
| OAuth Method | Manual popup + postMessage | Lovable Cloud Auth SDK |
| Endpoint | `oauth.lovable.app/~oauth/initiate` | Managed by `@lovable.dev/cloud-auth-js` |
| Session Handling | Manual `setSession()` | Automatic via SDK |
| Lines of Code | ~80 lines | ~15 lines |

## Expected Result
- Google Sign-In will work without 404 errors
- Uses the officially supported Lovable Cloud authentication flow
- Simpler, more maintainable code
