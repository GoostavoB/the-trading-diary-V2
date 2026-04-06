

## Plan: Fix Sign Up Build Error

The signup is broken due to a type mismatch. The `signUp` function interface declares 5 parameters, but the implementation and caller both use 6 (with `inviteCode`).

### Changes

1. **`src/contexts/AuthContext.tsx` (line 13)** — Add `inviteCode?: string` to the `signUp` type signature in the `AuthContextType` interface:
   ```typescript
   signUp: (email: string, password: string, fullName: string, country: string, marketingConsent: boolean, inviteCode?: string) => Promise<{ error: any }>;
   ```

2. **Also fix `@types/node` build errors** — The `tsconfig.app.json` was recently edited and may have lost the `"node"` type. Add `"node"` to the `types` array in `tsconfig.app.json` to resolve all the `Cannot find namespace 'NodeJS'` and `Cannot find name 'process'` errors.

### Result
- Signup flow will compile and work end-to-end (invite code, terms, marketing consent all passed correctly)
- All `NodeJS`/`process`/`Buffer` type errors resolved

