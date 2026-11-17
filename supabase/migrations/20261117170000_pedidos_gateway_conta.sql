-- Conta do AbacatePay em que a cobrança foi criada: 'sibrap' (padrão) ou 'senapro' (conta do filho do Wagner,
-- para alunos escolhidos; o restante do fluxo continua no SIBRAP). A confirmação consulta a conta gravada aqui.
alter table public.pedidos add column if not exists gateway_conta text not null default 'sibrap';
alter table public.pedidos drop constraint if exists pedidos_gateway_conta_check;
alter table public.pedidos add constraint pedidos_gateway_conta_check check (gateway_conta in ('sibrap', 'senapro'));
