## Plano: deploy das 3 edge functions do Telegram

### Observação importante (verificar antes)
Fiz `ls supabase/functions/` no sandbox e **não vejo** `telegram-webhook`, `telegram-notifier`, `telegram-generate-link` nem `_shared/telegram/`. O sync do GitHub → Lovable pode estar atrasado ou o merge foi numa branch que não é a que o Lovable acompanha.

Antes de rodar o plano, você confirma:
- O merge foi na branch `main` (ou a branch conectada ao Lovable)?
- Passou alguns minutos desde o merge?

Se sim e os arquivos ainda não apareceram, eu paro e sinalizo antes de deployar (não posso deployar código que não existe no filesystem). Se aparecerem, sigo os passos abaixo sem alterar nenhuma linha do código.

### O que vou fazer (assumindo arquivos presentes)

**1. Editar `supabase/config.toml`** — adicionar os 3 blocos de função:

```toml
[functions.telegram-webhook]
verify_jwt = false

[functions.telegram-notifier]
verify_jwt = false
schedule = "*/5 * * * *"  # a cada 5 minutos

[functions.telegram-generate-link]
verify_jwt = true
```

Justificativa:
- `telegram-webhook` público — Telegram não manda JWT do Supabase; a autenticação é feita no código via `X-Telegram-Bot-Api-Secret-Token`.
- `telegram-notifier` público + cron `*/5 * * * *` (padrão que o repo já usa em `calculate-leaderboard`, `check-user-activity`, etc).
- `telegram-generate-link` exige JWT — usuário logado gerando link de vínculo.

**2. Deploy das 3 funções** via `supabase--deploy_edge_functions` com `["telegram-webhook","telegram-notifier","telegram-generate-link"]`.

**3. Verificar logs** de cada uma com `supabase--edge_function_logs` pra confirmar que subiram sem erro de import/bundle.

**4. Reportar de volta**:
- URL pública do webhook (`https://<project>.supabase.co/functions/v1/telegram-webhook`) pra você colar no `setWebhook` do BotFather / gateway.
- Confirmação do cron ativo.
- Lembrete pra você adicionar os 3 secrets (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME`) no painel antes da primeira invocação — sem eles as funções sobem mas falham em runtime.

### O que NÃO vou fazer
- Não vou tocar em nenhum arquivo dentro de `supabase/functions/telegram-*/` nem em `_shared/telegram/`.
- Não vou criar/editar secrets — você faz no painel.
- Não vou registrar o webhook no Telegram (`setWebhook`) — só deploy da infra. Se quiser que eu registre depois com os secrets já configurados, é outra tarefa.

### Riscos
- Se o código importado usar algum `npm:` ou `esm.sh` incompatível com edge-runtime, o deploy falha. Nesse caso eu te mostro o erro exato dos logs e paro — não vou "consertar" o código sem autorização.
- Se `config.toml` já tiver algum bloco conflitante pros nomes, eu paro e mostro antes de sobrescrever.
