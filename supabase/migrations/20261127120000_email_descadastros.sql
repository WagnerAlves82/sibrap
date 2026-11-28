-- Descadastro de e-mails de comunicação (lembretes, ofertas, campanhas), LGPD art. 18 (27/11/2026).
-- E-mails transacionais (pagamento confirmado, entrega, certificado, senha) continuam sendo enviados.
create table if not exists public.email_descadastros (
  email text primary key check (email = lower(email)),
  origem text,
  criado_em timestamptz not null default now()
);

alter table public.email_descadastros enable row level security; -- sem políticas: só o servidor lê e grava
