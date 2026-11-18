-- Solicitações livres (Wagner, 18/11/2026): formulário público /solicitacao para quem pede algo fora do catálogo
-- (pacote, curso novo, certificado especial...). Só a chave de serviço lê e grava: RLS ligado e sem políticas.
create table if not exists public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  nome text not null check (char_length(nome) between 2 and 120),
  email text not null check (char_length(email) between 5 and 200),
  whatsapp text check (whatsapp is null or char_length(whatsapp) <= 30),
  tipo text not null check (tipo in ('pacote', 'curso', 'certificado', 'apostila', 'empresa', 'outro')),
  descricao text not null check (char_length(descricao) between 20 and 3000),
  origem text check (origem is null or char_length(origem) <= 60),
  status text not null default 'nova' check (status in ('nova', 'em_analise', 'respondida', 'recusada')),
  nota_admin text check (nota_admin is null or char_length(nota_admin) <= 2000)
);

create index if not exists solicitacoes_criado_em_idx on public.solicitacoes (criado_em desc);
alter table public.solicitacoes enable row level security;
revoke all on public.solicitacoes from anon, authenticated;
