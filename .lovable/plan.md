

## Fix Google Sign-In 404 Error

### Problem Analysis

The Google Sign-In is failing because:

1. The `@lovable.dev/cloud-auth-js` library redirects to `/~oauth/initiate` when the app is accessed directly (not in an iframe)
2. This route should be handled by Lovable Cloud's hosting infrastructure before reaching the React app
3. Currently, this route is reaching the React router which shows a 404 page because there's no matching route

The OAuth flow works like this:
```text
User clicks "Sign in with Google"
         |
         v
Library checks: Are we in iframe?
         |
    +----+----+
    |         |
   YES        NO (your case)
    |         |
    v         v
  Popup    Full page redirect to
  Flow     /~oauth/initiate (gets 404)
```

### Solution

Since this is an infrastructure/hosting configuration issue with the `/~oauth/initiate` route not being properly proxied, we can implement a **workaround** that forces the popup flow even when not in an iframe.

### Implementation Steps

**1. Modify the AuthContext to use popup mode**

Update `src/contexts/AuthContext.tsx` to pass a custom `oauthBrokerUrl` that uses the full Lovable OAuth broker URL instead of the relative path:

```typescript
const signInWithGoogle = async () => {
  const result = await lovable.auth.signInWithOAuth('google', {
    redirect_uri: window.location.origin,
    extraParams: {
      response_mode: 'web_message'  // Force popup mode
    }
  });
  // ... rest of handler
};
```

**2. Alternative: Update lovable integration with full broker URL**

Modify `src/integrations/lovable/index.ts` to use the absolute Lovable OAuth broker URL:

```typescript
const lovableAuth = createLovableAuth({
  oauthBrokerUrl: "https://oauth.lovable.app/initiate"
});
```

This bypasses the relative `/~oauth/initiate` path that's causing the 404 and directly uses Lovable's hosted OAuth broker.

### Technical Details

| Component | Change |
|-----------|--------|
| `src/integrations/lovable/index.ts` | Configure `oauthBrokerUrl` to use absolute Lovable OAuth URL |
| No new dependencies | Uses existing `@lovable.dev/cloud-auth-js` configuration options |

### Expected Outcome

- Google Sign-In will work on both preview and production URLs
- OAuth flow will use Lovable's hosted broker directly
- No 404 errors when initiating sign-in

### Testing Required

After implementation, test Google Sign-In on:
1. Production URL: `https://the-trading-diary.lovable.app/auth`
2. Verify successful redirect and session creation

