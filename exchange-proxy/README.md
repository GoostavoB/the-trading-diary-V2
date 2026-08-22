# exchange-proxy

Always-on Node service that talks to crypto exchange APIs on behalf of
The Trading Diary. See the top comment in server.js for why this exists
(Supabase Edge Functions have a documented, unresolved intermittent
outbound-fetch failure - this service avoids it by not being serverless).

Currently handles BingX natively. Every other exchange's "preview"
request is transparently forwarded to the existing Supabase Edge Function,
so nothing about today's working exchanges changes.

## Deploy to Railway

Deployed automatically by Claude via the Railway MCP. Root directory is
set to exchange-proxy. Required env vars: SUPABASE_URL, SUPABASE_ANON_KEY,
EXCHANGE_CREDS_ENCRYPTION_KEY (must match the Supabase secret of the same
name byte-for-byte), ALLOWED_ORIGINS.

## Local development

cd exchange-proxy
cp .env.example .env
npm install
npm run dev
