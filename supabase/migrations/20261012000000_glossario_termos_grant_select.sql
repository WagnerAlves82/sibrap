-- A policy de RLS (glossario_leitura_autenticados) já existia, mas faltava o
-- GRANT de base: sem privilégio SELECT na tabela, o Postgres nega a consulta
-- antes mesmo de avaliar a policy — o glossário aparecia sempre vazio.
grant select on public.glossario_termos to authenticated;
