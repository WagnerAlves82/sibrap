-- 21/11/2026: três tabelas tinham política de RLS mas nenhum GRANT para os papéis da API, então o Postgres
-- negava a consulta antes de olhar a política ("permission denied for table"). Efeito no site:
--   redacoes            -> /minha-area/redacao/[id] dava 404 (Treino de Redação inutilizável)
--   curriculos          -> "Meus currículos" não listava nem apagava
--   produto_combo_itens -> composição dos combos não carregava
-- As migrations originais dependiam do grant automático do Supabase para tabelas novas, que não veio.
-- As políticas existentes continuam limitando as linhas (dono lê o que é seu; combos são catálogo público).
grant select on public.redacoes to authenticated;
grant select, delete on public.curriculos to authenticated;
grant select on public.produto_combo_itens to anon, authenticated;
