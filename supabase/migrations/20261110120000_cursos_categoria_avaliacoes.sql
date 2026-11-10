-- Categoria dos cursos (página /cursos separada por categoria; novos cursos são planejados por categoria)
alter table public.cursos add column if not exists categoria text;

update public.cursos set categoria = case slug
  when 'auxiliar-administrativo' then 'Administração e escritório'
  when 'excel-basico-ao-intermediario' then 'Administração e escritório'
  when 'informatica-basica-ia' then 'Tecnologia'
  when 'conserto-e-manutencao-de-celulares' then 'Tecnologia'
  when 'atendimento-ao-cliente' then 'Atendimento e comunicação'
  when 'atendente-de-call-center' then 'Atendimento e comunicação'
  when 'ingles-basico-atendimento-ao-publico' then 'Atendimento e comunicação'
  when 'libras-iniciante' then 'Atendimento e comunicação'
  when 'agente-de-portaria' then 'Serviços e hotelaria'
  when 'camareira' then 'Serviços e hotelaria'
  when 'estoque-logistica-controle-de-mercadorias' then 'Indústria e logística'
  when 'tbo-treinamento-basico-operacional' then 'Indústria e logística'
  else categoria end
where categoria is null;

-- Média real da pesquisa de satisfação por curso (só agregados, nada individual).
-- Só devolve cursos com pelo menos 3 respostas, para a nota não depender de uma pessoa.
create or replace function public.avaliacoes_cursos()
returns table (curso_id uuid, media numeric, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.curso_id, round(avg(p.satisfacao)::numeric, 1), count(*)
  from public.pesquisas_satisfacao p
  where p.satisfacao between 1 and 5
  group by p.curso_id
  having count(*) >= 3;
$$;

revoke all on function public.avaliacoes_cursos() from public;
grant execute on function public.avaliacoes_cursos() to anon, authenticated;
