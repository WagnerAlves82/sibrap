-- Depoimentos reais de alunos na página do curso (Wagner, 19/11/2026).
-- Só aparecem respostas da pesquisa de satisfação com depoimento escrito, autorização do aluno
-- E aprovação manual (depoimento_publicado), porque texto livre pode vir com erro de digitação ou palavrão.
-- Expõe apenas o primeiro nome, o texto e a nota de satisfação (nada de e-mail, CPF ou sobrenome).
alter table public.pesquisas_satisfacao add column if not exists depoimento_publicado boolean not null default false;

create or replace function public.depoimentos_curso(p_curso_id uuid)
returns table (nome text, texto text, nota smallint, criado_em timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select
    initcap(lower(split_part(trim(coalesce(u.raw_user_meta_data->>'nome', '')), ' ', 1))) as nome,
    trim(p.depoimento) as texto,
    p.satisfacao::smallint as nota,
    p.criado_em
  from pesquisas_satisfacao p
  left join auth.users u on u.id = p.user_id
  where p.curso_id = p_curso_id
    and p.autoriza_depoimento
    and p.depoimento_publicado
    and length(trim(coalesce(p.depoimento, ''))) >= 3
  order by p.criado_em desc
  limit 6;
$$;

revoke all on function public.depoimentos_curso(uuid) from public;
grant execute on function public.depoimentos_curso(uuid) to anon, authenticated;

-- primeiro aprovado: Jonas, TBO (16/11/2026)
update public.pesquisas_satisfacao p set depoimento_publicado = true
from public.cursos c
where c.id = p.curso_id and c.slug = 'tbo-treinamento-basico-operacional'
  and p.autoriza_depoimento and trim(p.depoimento) = 'Muito aprendizado';
