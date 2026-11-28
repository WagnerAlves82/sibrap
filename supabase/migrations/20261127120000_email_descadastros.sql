-- Descadastro de e-mails de comunicação (lembretes, ofertas, campanhas), LGPD art. 18 (27/11/2026).
-- E-mails transacionais (pagamento confirmado, entrega, certificado, senha) continuam sendo enviados.
create table if not exists public.email_descadastros (
  email text primary key check (email = lower(email)),
  origem text,
  criado_em timestamptz not null default now()
);

alter table public.email_descadastros enable row level security; -- sem políticas: só o servidor lê e grava

-- Token do link de descadastro (um por e-mail), gerado pelos scripts de envio; a página procura o e-mail pelo token.
create table if not exists public.email_descadastro_tokens (
  token text primary key check (length(token) between 20 and 64),
  email text not null unique check (email = lower(email)),
  criado_em timestamptz not null default now()
);
alter table public.email_descadastro_tokens enable row level security;
