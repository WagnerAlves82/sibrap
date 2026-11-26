-- Feedback do aluno sobre o Treino de Redação (campo no fim da correção), 26/11/2026.
create table if not exists public.redacao_feedbacks (
  id uuid primary key default gen_random_uuid(),
  redacao_id uuid not null references public.redacoes(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nota smallint not null check (nota between 1 and 5),
  comentario text check (char_length(comentario) <= 2000),
  criado_em timestamptz not null default now(),
  unique (redacao_id, user_id)
);

alter table public.redacao_feedbacks enable row level security;

create policy "aluno lê o próprio feedback" on public.redacao_feedbacks
  for select to authenticated using (user_id = (select auth.uid()));

create policy "aluno envia feedback da própria redação" on public.redacao_feedbacks
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.redacoes r where r.id = redacao_id and r.user_id = (select auth.uid()))
  );

create policy "aluno corrige o próprio feedback" on public.redacao_feedbacks
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
