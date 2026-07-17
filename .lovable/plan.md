Redeploy da edge function `telegram-webhook` para pegar a atualização mergeada em `_shared/telegram/mentor.ts`.

### Passos
1. `supabase--deploy_edge_functions` com `["telegram-webhook"]`.
2. `supabase--edge_function_logs` em `telegram-webhook` para confirmar boot sem erro de import/bundle.
3. Smoke test com `supabase--curl_edge_functions` sem o header `X-Telegram-Bot-Api-Secret-Token` → esperar `403 forbidden`.
4. Reportar resultado.

### Não faz parte
- Nenhuma alteração em código-fonte (`telegram-webhook/index.ts`, `_shared/telegram/*`, `config.toml`).
- Não mexo em `telegram-notifier` nem `telegram-generate-link`.
- Não toco em secrets.