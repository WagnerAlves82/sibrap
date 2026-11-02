-- Cursos em rascunho (ativo = false) ficam invisíveis para o público, mas os testadores
-- (contas do Wagner) conseguem abrir e testar antes de publicar.
create table if not exists public.testadores (
  user_id uuid primary key references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.testadores enable row level security;
-- sem políticas: só a chave de serviço lê ou grava a lista
revoke all on public.testadores from anon, authenticated;

create or replace function public.eh_testador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.testadores where user_id = auth.uid());
$$;
revoke all on function public.eh_testador() from public;
grant execute on function public.eh_testador() to authenticated;

drop policy if exists "cursos: leitura publica" on public.cursos;
create policy "cursos: leitura publica" on public.cursos
  for select using (ativo or (auth.uid() is not null and public.eh_testador()));
