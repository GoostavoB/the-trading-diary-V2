Redeploy das edge functions `telegram-webhook` e `telegram-notifier` com o código atual do repositório, sem alterar nenhum arquivo.

### Passos
1. `supabase--deploy_edge_functions` com `["telegram-webhook", "telegram-notifier"]`.
2. Smoke test rápido em `telegram-webhook` via `supabase--curl_edge_functions` sem o header `X-Telegram-Bot-Api-Secret-Token` → esperar `403 forbidden`.
3. Reportar resultado.

### Não faz parte
- Nenhuma alteração de código (`index.ts`, `_shared/telegram/*`, `config.toml`).
- Sem mexer em secrets, cron ou outras funções.