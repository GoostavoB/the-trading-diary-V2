-- Módulo de rolagem de surplus e trava de risco operacional.
--
-- Guarda, a cada encerramento de ciclo, quanto do surplus o usuário autorizou
-- arriscar no ciclo seguinte e como o capital ficou dividido entre a conta de
-- trade e o cofre.
--
-- A tabela é agnóstica à janela temporal: o ciclo é identificado por
-- (period_type, period_start, period_end), então serve para meta diária,
-- semanal, decendial, mensal, anual ou customizada, sem mudança de schema.

create table if not exists public.cycle_rollovers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- identificação do ciclo encerrado
  goal_id uuid references public.risk_goals(id) on delete set null,
  period_type text not null,
  period_start date not null,
  period_end date not null,

  -- números do encerramento
  balance_at_close numeric not null,   -- saldo/lucro apurado
  goal_target numeric not null,        -- meta do ciclo
  surplus numeric not null,            -- max(0, balance - target)

  -- decisão do usuário
  stop_lock numeric not null default 0.70,  -- trava de stop da corretora
  authorized_risk numeric not null,         -- R
  trade_balance numeric not null,           -- R / stop_lock
  vault_balance numeric not null,           -- balance - trade_balance

  created_at timestamptz not null default now(),

  -- um encerramento por ciclo por usuário
  unique (user_id, period_type, period_start, period_end)
);

alter table public.cycle_rollovers enable row level security;

create policy "cycle_rollovers_select_own"
  on public.cycle_rollovers for select
  using (auth.uid() = user_id);

create policy "cycle_rollovers_insert_own"
  on public.cycle_rollovers for insert
  with check (auth.uid() = user_id);

create policy "cycle_rollovers_update_own"
  on public.cycle_rollovers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cycle_rollovers_delete_own"
  on public.cycle_rollovers for delete
  using (auth.uid() = user_id);

create index if not exists cycle_rollovers_user_period_idx
  on public.cycle_rollovers (user_id, period_start desc);

-- Trava de stop da corretora, por usuário. Fica em user_settings porque é
-- configuração de conta, não de ciclo: muda de corretora, muda o número.
alter table public.user_settings
  add column if not exists broker_stop_lock numeric not null default 0.70;

comment on column public.user_settings.broker_stop_lock is
  'Fração máxima da banca que um stop pode consumir (0.70 = 70%). Usada para calcular o saldo da conta de trade a partir do risco autorizado.';
