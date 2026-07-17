## Deploy das 3 Edge Functions do Telegram

Os arquivos já estão no repo (`supabase/functions/telegram-webhook`, `telegram-notifier`, `telegram-generate-link`, `_shared/telegram/`) e o `supabase/config.toml` já contém os 3 blocos corretos:

- `telegram-webhook` → `verify_jwt = false`
- `telegram-notifier` → `verify_jwt = false` + `schedule = "*/5 * * * *"`
- `telegram-generate-link` → `verify_jwt = true`

Não vou tocar em nenhum código-fonte das funções nem no `config.toml`.

### Passos

1. **Deploy das 3 funções** via `supabase--deploy_edge_functions` com `["telegram-webhook", "telegram-notifier", "telegram-generate-link"]`.
2. **Verificar logs** de cada função com `supabase--edge_function_logs` procurando erros de import/bundle.
3. **Smoke test do `telegram-webhook`** com `supabase--curl_edge_functions` enviando um POST sem o header `X-Telegram-Bot-Api-Secret-Token` — resposta esperada: `403 forbidden` (confirma que o secret está lido e a função está no ar).
4. **Reportar** ao usuário:
   - URL pública do webhook: `https://<project>.supabase.co/functions/v1/telegram-webhook` (para registrar no `setWebhook` do BotFather).
   - Confirmação do cron de 5 min no `telegram-notifier`.
   - Lembrete: os 3 secrets (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME`) já estão no painel — nada a fazer.

### Riscos

- Se algum `npm:`/`esm.sh` do código compartilhado falhar no bundler do edge-runtime, o deploy retorna erro; nesse caso mostro o log exato e paro (sem editar código, conforme instruído).
- Se o `config.toml` tiver algum conflito ao aplicar o cron, aviso antes de qualquer mudança.

Nenhuma alteração de código ou de schema será feita — só deploy e verificação.