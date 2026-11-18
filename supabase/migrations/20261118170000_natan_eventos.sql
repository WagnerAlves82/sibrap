-- Natan, assistente virtual (18/11/2026): registro anônimo das conversas (perfil escolhido, opções sugeridas, cliques).
-- Sem nome, e-mail, IP ou texto digitado. Só a chave de serviço lê e grava.
create table if not exists public.natan_eventos (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  tipo text not null check (tipo in ('abriu', 'perfil', 'clique-curso', 'clique-apostila', 'aluno', 'whatsapp', 'cadastro')),
  perfil jsonb,
  alvo text check (alvo is null or char_length(alvo) <= 120),
  pagina text check (pagina is null or char_length(pagina) <= 120)
);
create index if not exists natan_eventos_criado_em_idx on public.natan_eventos (criado_em desc);
alter table public.natan_eventos enable row level security;
revoke all on public.natan_eventos from anon, authenticated;
