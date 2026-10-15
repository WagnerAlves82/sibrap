-- Origem de marketing de cada pedido (campanha, gclid/fbclid, referenciador, cidade/UF),
-- gravada pelo servidor na hora de gerar o pagamento. Só o service role grava.
alter table public.pedidos add column if not exists origem jsonb;
