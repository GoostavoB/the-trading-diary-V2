
Problema real identificado.

Não é o mesmo erro de antes. Agora o signup quebra por causa desta incompatibilidade no bootstrap do usuário:

- `handle_new_user()` ainda tenta fazer:
  - `INSERT INTO user_settings (user_id) ... ON CONFLICT (user_id) DO NOTHING`
  - `INSERT INTO user_customization_preferences (user_id, ...) ... ON CONFLICT (user_id) DO NOTHING`
- Mas essas duas tabelas mudaram para o modelo de `sub_account`.
- Hoje elas:
  - exigem `sub_account_id NOT NULL`
  - não têm mais unique em `user_id`
  - têm unique em `sub_account_id`

O log confirma isso:
- `there is no unique or exclusion constraint matching the ON CONFLICT specification (SQLSTATE 42P10)`

Resumo simples:
- o trigger cria `profile`
- o `profile` dispara criação da sub-account principal
- depois o `handle_new_user()` tenta criar settings/preferences no formato antigo
- isso explode a transação
- o frontend só mostra `Database error saving new user`

Plano de correção

1. Reescrever `public.handle_new_user()` para o fluxo atual
- Criar `profile`
- Criar `subscription`
- Não inserir mais direto em `user_settings` e `user_customization_preferences` com só `user_id`
- Primeiro criar/obter a sub-account principal
- Depois inserir:
  - `user_settings (user_id, sub_account_id, ...)`
  - `user_customization_preferences (user_id, sub_account_id, ...)`

2. Tornar o bootstrap idempotente
- Usar `ON CONFLICT (user_id)` apenas onde realmente existe unique em `user_id`
  - `subscriptions`
  - `user_xp_levels`
  - `user_xp_tiers`
- Para settings/preferences:
  - usar `ON CONFLICT (sub_account_id) DO NOTHING`
  - ou checar existência antes do insert

3. Evitar dependência frágil entre triggers
- Hoje o fluxo depende de um trigger em `profiles` para criar a sub-account
- Vou consolidar isso para o signup não depender de ordem implícita
- Opção mais segura:
  - `handle_new_user()` cria o profile
  - cria/garante a sub-account principal
  - cria settings/preferences ligados a essa sub-account
- Depois podemos manter ou remover o trigger de profile, mas o signup precisa ter um único caminho confiável

4. Preservar o que já foi corrigido
- manter `plan_type = 'free'`
- manter colunas novas de `subscriptions`
- manter consentimentos e provider no metadata
- manter códigos de convite `HORISTIC` e `TEO`

5. Limpeza mínima de dados quebrados
- Não apagar tudo
- Verificar e remover apenas registros órfãos/incompletos criados pelas tentativas falhas:
  - profiles sem subscription
  - profiles sem sub_account
  - settings/preferences inconsistentes
- Isso evita destruir contas válidas

Arquivos/objetos a ajustar
- `supabase/migrations/...sql`
  - substituir `public.handle_new_user()`
  - opcionalmente ajustar/remover duplicação com `create_default_sub_account()`
- possível revisão do trigger `on_profile_created_create_sub_account`
- sem mudança grande no frontend agora

Resultado esperado
- signup para de falhar
- novo usuário nasce com:
  - profile
  - subscription free
  - main sub-account
  - user_settings ligados ao sub-account
  - user_customization_preferences ligadas ao sub-account
  - xp records
- fim do erro atual sem mexer em partes desnecessárias

Detalhe técnico
```text
Fluxo atual quebrado:
auth.users insert
  -> handle_new_user()
      -> profiles insert
          -> profile trigger cria sub_account
      -> subscriptions ok
      -> user_xp_levels ok
      -> user_xp_tiers ok
      -> user_settings ON CONFLICT (user_id)  ❌ sem unique(user_id)
      -> transaction abort

Fluxo correto:
auth.users insert
  -> handle_new_user()
      -> profiles insert
      -> ensure main sub_account
      -> subscriptions insert/upsert
      -> xp insert/upsert
      -> user_settings insert/upsert por sub_account_id
      -> customization insert/upsert por sub_account_id
```
