-- Restaura os privilégios originais da tabela leads (ela já existia e é usada pelo cadastro público e pelo admin)
-- e acrescenta as colunas usadas pelo pop-up de saída.
grant select, insert, update, delete on public.leads to anon, authenticated;
alter table public.leads add column if not exists pagina text;
alter table public.leads add column if not exists origem jsonb;
