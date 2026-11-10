-- Testadores (contas do Wagner) também se matriculam em cursos em rascunho (ativo = false),
-- para testar antes de publicar. Para o público, continua valendo só curso ativo.
create or replace function public.matricular_curso(p_curso_slug text)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_curso uuid;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  select id into v_curso from cursos where slug = p_curso_slug and (ativo or public.eh_testador());
  if v_curso is null then raise exception 'Curso não encontrado'; end if;
  insert into matriculas (user_id, curso_id) values (auth.uid(), v_curso)
  on conflict do nothing;
  return v_curso;
end $function$;
