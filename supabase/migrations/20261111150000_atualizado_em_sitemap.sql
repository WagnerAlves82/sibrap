-- Data real de alteração para o sitemap.xml (lastmod) e o llms.txt.
-- Antes: apostilas.atualizado_em só tinha a data de criação (nenhum gatilho a atualizava) e cursos não tinha a coluna.
-- Agora: qualquer UPDATE em apostilas/cursos atualiza a data; alterar aulas ou módulos atualiza o curso dono.

alter table public.cursos add column if not exists atualizado_em timestamptz not null default now();
update public.cursos set atualizado_em = coalesce(criado_em, now());

create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- só conta como alteração de conteúdo se mudou algo além das colunas de controle
  -- (a rotina do Facebook grava facebook_postado_em/facebook_post_id todo dia)
  if (to_jsonb(new) - array['atualizado_em','facebook_postado_em','facebook_post_id'])
     is distinct from (to_jsonb(old) - array['atualizado_em','facebook_postado_em','facebook_post_id']) then
    new.atualizado_em := now();
  else
    new.atualizado_em := old.atualizado_em;
  end if;
  return new;
end;
$$;

drop trigger if exists apostilas_atualizado_em on public.apostilas;
create trigger apostilas_atualizado_em before update on public.apostilas
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists cursos_atualizado_em on public.cursos;
create trigger cursos_atualizado_em before update on public.cursos
  for each row execute function public.tocar_atualizado_em();

create or replace function public.tocar_curso_da_aula()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.cursos set atualizado_em = now()
   where id = coalesce(new.curso_id, old.curso_id);
  return null;
end;
$$;

drop trigger if exists aulas_tocam_curso on public.aulas;
create trigger aulas_tocam_curso after insert or update or delete on public.aulas
  for each row execute function public.tocar_curso_da_aula();

drop trigger if exists modulos_tocam_curso on public.modulos;
create trigger modulos_tocam_curso after insert or update or delete on public.modulos
  for each row execute function public.tocar_curso_da_aula();

-- produtos (preço, PDF) também contam como atualização da apostila ligada
create or replace function public.tocar_apostila_do_produto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.apostilas set atualizado_em = now() where produto_id = new.id;
  return null;
end;
$$;

drop trigger if exists produtos_tocam_apostila on public.produtos;
create trigger produtos_tocam_apostila after update on public.produtos
  for each row execute function public.tocar_apostila_do_produto();
