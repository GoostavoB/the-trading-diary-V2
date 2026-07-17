## Plano

Redeployar apenas a edge function `telegram-webhook` (código já mergeado, incluindo os novos módulos `_shared/telegram/mentor.ts` e `_shared/telegram/macro.ts`).

### Passos
1. `supabase--deploy_edge_functions` com `["telegram-webhook"]`.
2. `supabase--edge_function_logs` em `telegram-webhook` para confirmar boot sem erro de import/bundle (esm.sh, `npm:ai`, gateway).
3. Smoke test com `supabase--curl_edge_functions` sem o header `X-Telegram-Bot-Api-Secret-Token` → esperar `403 forbidden` (confirma que a nova versão está no ar e a proteção segue ativa).
4. Reportar resultado ao usuário.

### Não faz parte deste plano
- Não altero código-fonte de `telegram-webhook`, `_shared/telegram/*`, nem `supabase/config.toml` (o bloco `[functions.telegram-webhook] verify_jwt = false` já está correto).
- Não mexo em `telegram-notifier` nem `telegram-generate-link`.
- Não toco em secrets — `LOVABLE_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME` já estão configurados.

### Riscos
- Se algum `import` dos novos módulos (mentor/macro) falhar no bundle do edge runtime, o deploy retorna erro — nesse caso, mostro o log exato e paro (sem editar código, conforme instrução).
