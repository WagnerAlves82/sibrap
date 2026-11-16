-- Depoimento opcional na pesquisa de satisfação, para usar no site só com autorização do aluno (LGPD).
alter table public.pesquisas_satisfacao add column if not exists depoimento text check (depoimento is null or length(depoimento) <= 600);
alter table public.pesquisas_satisfacao add column if not exists autoriza_depoimento boolean not null default false;
