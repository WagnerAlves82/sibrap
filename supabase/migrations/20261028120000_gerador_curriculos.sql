-- Gerador de currículos (fase 1): /curriculo
--  * curriculos: o currículo da pessoa (só texto; a foto nunca sai do aparelho), editável em qualquer aparelho.
--    As colunas de lead (whatsapp, cidade, uf, area, escolaridade) só são preenchidas com aceite_marketing.
--  * curriculo_downloads: cada PDF baixado; o primeiro download de cada currículo conta 1 "uso"
--    (contador escondido até 1.000 na página).
--  * Currículo sem acesso há 12 meses é apagado (apagar_curriculos_inativos, chamada pelo servidor).
-- Gravação só pelo servidor (chave de serviço); o dono só lê e apaga o próprio currículo.

create table public.curriculos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  perfil text not null check (perfil in ('jovem', 'medio', 'profissional')),
  modelo text not null check (modelo in ('classico', 'moderno', 'compacto')),
  dados jsonb not null,
  aceite_marketing boolean not null default false,
  aceite_marketing_em timestamptz,
  whatsapp text,
  cidade text,
  uf text,
  area text,
  escolaridade text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  ultimo_acesso_em timestamptz not null default now()
);
create index curriculos_user_id_idx on public.curriculos (user_id);
create index curriculos_ultimo_acesso_idx on public.curriculos (ultimo_acesso_em);

alter table public.curriculos enable row level security;
create policy "dono le o proprio curriculo" on public.curriculos
  for select to authenticated using (auth.uid() = user_id);
create policy "dono apaga o proprio curriculo" on public.curriculos
  for delete to authenticated using (auth.uid() = user_id);

create table public.curriculo_downloads (
  id bigint generated always as identity primary key,
  curriculo_id uuid references public.curriculos(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  primeiro boolean not null default false,
  criado_em timestamptz not null default now()
);
alter table public.curriculo_downloads enable row level security;

-- total de currículos gerados (primeiro download de cada um); a página só mostra a partir de 1.000
create or replace function public.total_curriculos_gerados()
returns bigint
language sql
stable
security definer
set search_path to 'public'
as $$
  select count(*) from curriculo_downloads where primeiro;
$$;
grant execute on function public.total_curriculos_gerados() to anon, authenticated;

create or replace function public.apagar_curriculos_inativos()
returns integer
language sql
security definer
set search_path to 'public'
as $$
  with apagados as (
    delete from curriculos where ultimo_acesso_em < now() - interval '12 months' returning 1
  )
  select count(*)::integer from apagados;
$$;
revoke execute on function public.apagar_curriculos_inativos() from public, anon, authenticated;
