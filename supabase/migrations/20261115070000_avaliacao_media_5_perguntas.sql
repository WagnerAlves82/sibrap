-- Nota pública dos cursos = média das 5 perguntas de estrela da pesquisa (satisfação, clareza,
-- material, exercícios e aplicação), não só da satisfação geral: uma resposta isolada pesa menos.
create or replace function public.avaliacoes_cursos()
returns table(curso_id uuid, media numeric, total bigint)
language sql
stable security definer
set search_path to 'public'
as $function$
  select p.curso_id,
         round(avg((p.satisfacao + p.clareza + p.material + p.exercicios + p.aplicacao) / 5.0)::numeric, 1),
         count(*)
  from public.pesquisas_satisfacao p
  group by p.curso_id
  having count(*) >= 3;
$function$;
