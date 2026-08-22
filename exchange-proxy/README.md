# exchange-proxy

Always-on Node service that talks to crypto exchange APIs on behalf of
The Trading Diary. See the top comment in `server.js` for why this exists
(Supabase Edge Functions have a documented, unresolved intermittent
outbound-fetch failure — this service avoids it by not being serverless).

Currently handles **BingX** natively. Every other exchange's "preview"
request is transparently forwarded to the existing Supabase Edge Function,
so nothing about today's working exchanges changes.

## Deploy to Railway (one-time setup)

1. Go to railway.app and sign in (GitHub login is easiest).
2. New Project -> Deploy from GitHub repo -> pick GoostavoB/the-trading-diary-V2.
3. Set the root directory to `exchange-proxy` in Settings -> Source. It should
   auto-detect the Dockerfile and railway.json in that folder.
4. In the service's Variables tab, add SUPABASE_URL, SUPABASE_ANON_KEY,
   EXCHANGE_CREDS_ENCRYPTION_KEY (must match the Supabase secret of the same
   name byte-for-byte), and ALLOWED_ORIGINS.
5. Deploy. Copy the public URL Railway gives you.
6. Give that URL to Claude (or set it as VITE_EXCHANGE_PROXY_URL) so the
   frontend knows where to send BingX sync requests.

Cost: Railway's Hobby plan is $5/month flat, with a free trial available.

## Local development

```bash
cd exchange-proxy
cp .env.example .env
npm install
npm run dev
```
