
# Fix Google Sign-In 404 Error

## Problem Identified

The screenshot shows a **404 error at `/~oauth/initiate?provider=g...`** when trying to sign in with Google.

### Root Cause

The `@lovable.dev/cloud-auth-js` library has two modes:

1. **Iframe mode** (inside Lovable editor preview): Uses popup with `web_message` response mode
2. **Standalone mode** (direct browser access): Redirects the full page to `/~oauth/initiate`

The current code passes `response_mode: 'web_message'` as `extraParams`, but the library ignores this when detecting it's NOT in an iframe and does a full-page redirect instead.

```typescript
// Current code in AuthContext.tsx (line 133-138)
const result = await (lovable.auth as any).signInWithOAuth('google', {
  redirect_uri: `${window.location.origin}/auth`,
  extraParams: {
    response_mode: 'web_message',  // <-- Ignored when not in iframe
  },
});
```

The library code (line 65-68):
```javascript
if (!isInIframe) {
  window.location.href = `${oauthBrokerUrl}?${params.toString()}`;
  return { error: null, redirected: true };
}
```

## Solution

Force the OAuth flow to **always use popup mode** by opening the OAuth URL in a popup window ourselves, bypassing the library's iframe detection.

### Option A: Override the library behavior (Recommended)

Implement a custom popup-based flow that works consistently in both preview and production:

```typescript
const signInWithGoogle = async () => {
  // Always use popup flow to avoid 404 on /~oauth/* routes
  const state = generateState();
  const redirectUri = `${window.location.origin}/auth`;
  
  const params = new URLSearchParams({
    provider: 'google',
    redirect_uri: redirectUri,
    state,
    response_mode: 'web_message'
  });
  
  const oauthUrl = `/~oauth/initiate?${params.toString()}`;
  
  // Force popup even when not in iframe
  const popup = window.open(oauthUrl, 'oauth', 'width=500,height=600');
  
  // Listen for message from popup
  // ... handle tokens and set session
};
```

### Option B: Use production URL for OAuth

Configure the library to use the published URL's OAuth endpoint which properly handles the `/~oauth/*` routes:

```typescript
const lovableAuth = createLovableAuth({
  oauthBrokerUrl: 'https://the-trading-diary.lovable.app/~oauth/initiate'
});
```

**Problem**: This breaks during development as it redirects to production.

### Option C: Detect environment and handle accordingly (Best)

Check if on preview vs production and use the appropriate flow:

```typescript
const signInWithGoogle = async () => {
  const isPreview = window.location.hostname.includes('id-preview');
  
  if (isPreview) {
    // Show message to user that Google sign-in must be tested on published URL
    toast.error('Please test Google Sign-In on the published URL');
    return { error: new Error('Google Sign-In not available in preview') };
  }
  
  // Normal flow for production
  const result = await lovable.auth.signInWithOAuth('google', {
    redirect_uri: `${window.location.origin}/auth`,
  });
  // ...
};
```

## Recommended Implementation

Combine approaches: Always use popup flow with proper message handling, which works in both environments.

### Files to Modify

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Implement robust popup-based OAuth flow |
| `src/integrations/lovable/index.ts` | DO NOT MODIFY (auto-generated) |

### Implementation Details

1. **Create a helper to generate secure state**
2. **Always open OAuth in popup window** (bypass iframe detection)
3. **Listen for postMessage** from `https://oauth.lovable.app`
4. **Handle tokens** and set session with Supabase
5. **Fallback to redirect flow** only on published domain

### Code Changes in AuthContext.tsx

```typescript
// Helper function to generate state
const generateState = () => {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const signInWithGoogle = async () => {
  // Generate state for CSRF protection
  const state = generateState();
  
  // Build OAuth URL
  const params = new URLSearchParams({
    provider: 'google',
    redirect_uri: `${window.location.origin}/auth`,
    state,
    response_mode: 'web_message'
  });
  
  const oauthUrl = `/~oauth/initiate?${params.toString()}`;
  
  // Open popup
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  
  const popup = window.open(
    oauthUrl,
    'oauth',
    `width=${width},height=${height},left=${left},top=${top}`
  );
  
  if (!popup) {
    toast.error('Popup was blocked. Please allow popups for this site.');
    return { error: new Error('Popup blocked') };
  }
  
  // Listen for message
  return new Promise((resolve) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://oauth.lovable.app') return;
      if (event.data?.type !== 'authorization_response') return;
      
      window.removeEventListener('message', handleMessage);
      popup.close();
      
      const data = event.data.response;
      
      if (data.error) {
        resolve({ error: new Error(data.error_description || 'Sign in failed') });
        return;
      }
      
      if (data.state !== state) {
        resolve({ error: new Error('Invalid state') });
        return;
      }
      
      // Set session with Supabase
      supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token
      }).then(() => {
        navigate('/dashboard');
        resolve({ error: null });
      }).catch((e) => {
        resolve({ error: e });
      });
    };
    
    window.addEventListener('message', handleMessage);
    
    // Check if popup was closed without completing
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        resolve({ error: new Error('Sign in was cancelled') });
      }
    }, 500);
  });
};
```

## Summary

| Issue | Solution |
|-------|----------|
| Library redirects to `/~oauth/initiate` when not in iframe | Always use popup flow with `response_mode: web_message` |
| 404 on preview URL | Force popup mode bypasses the redirect |
| State validation | Generate and validate CSRF state token |
| Popup blocked | Show user-friendly error message |
