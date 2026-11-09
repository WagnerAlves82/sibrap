-- Mensagens do WhatsApp (API de Nuvem da Meta): recebidas pelo webhook e enviadas pelo site.
-- Só o servidor lê e grava (RLS ligado, sem políticas).
create table if not exists public.whatsapp_mensagens (
  id uuid primary key default gen_random_uuid(),
  wamid text unique,
  telefone text not null,
  nome text,
  direcao text not null check (direcao in ('entrada', 'saida')),
  tipo text not null default 'text',
  texto text,
  criado_em timestamptz not null default now()
);
create index if not exists whatsapp_mensagens_tel_idx on public.whatsapp_mensagens (telefone, criado_em desc);
alter table public.whatsapp_mensagens enable row level security;
