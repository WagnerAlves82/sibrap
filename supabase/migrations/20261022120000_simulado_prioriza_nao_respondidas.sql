-- Simulado: ao sortear as questões, dá prioridade às que a pessoa ainda NÃO respondeu naquele produto/cargo.
-- Só muda a ordem do sorteio dentro de cada disciplina; quantidade, proporção da prova e regras de acesso ficam iguais.
create or replace function public.iniciar_simulado(p_produto_id uuid, p_cargo_id uuid, p_quantidade integer default null)
returns table(tentativa_id uuid, questao_id uuid, ordem integer, disciplina_nome text, enunciado text, alternativas jsonb, diagrama_svg text, inspirada_em text, dica text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_concurso_id uuid;
  v_produto_cargo_id uuid;
  v_tentativa_id uuid;
begin
  if v_user_id is null then
    raise exception 'Não autenticado';
  end if;

  if not exists (select 1 from public.acessos a where a.user_id = v_user_id and a.produto_id = p_produto_id) then
    raise exception 'Sem acesso a esse produto';
  end if;

  select p.concurso_id, p.cargo_id into v_concurso_id, v_produto_cargo_id
  from public.produtos p
  where p.id = p_produto_id and p.inclui_simulado;

  if v_concurso_id is null then
    raise exception 'Produto não encontrado ou sem simulado';
  end if;

  if v_produto_cargo_id is not null and v_produto_cargo_id <> p_cargo_id then
    raise exception 'Esse produto não cobre esse cargo';
  end if;

  if not exists (select 1 from public.cargos c where c.id = p_cargo_id and c.concurso_id = v_concurso_id) then
    raise exception 'Cargo inválido pra esse concurso';
  end if;

  if not exists (select 1 from public.cargo_disciplinas cd where cd.cargo_id = p_cargo_id) then
    raise exception 'Esse cargo ainda não tem disciplinas configuradas';
  end if;

  if p_quantidade is not null and p_quantidade < 1 then
    raise exception 'Quantidade inválida';
  end if;

  with vistas as (
    -- questões já respondidas pela pessoa neste produto e cargo
    select distinct k::uuid as id
    from public.tentativas_simulado t
    cross join lateral jsonb_object_keys(coalesce(t.respostas, '{}'::jsonb)) as k
    where t.user_id = v_user_id and t.produto_id = p_produto_id and t.cargo_id = p_cargo_id
  ),
  ranqueadas as (
    select q.id,
           cd.disciplina_id,
           cd.numero_questoes,
           row_number() over (
             partition by cd.disciplina_id
             order by (q.id in (select id from vistas)), random()
           ) as rn
    from public.cargo_disciplinas cd
    join public.questoes q on q.disciplina_id = cd.disciplina_id
    where cd.cargo_id = p_cargo_id
      and q.concurso_id = v_concurso_id
      and (q.cargo_id is null or q.cargo_id = p_cargo_id)
      and q.ativa
  ),
  escolhidas as (
    select id, disciplina_id
    from ranqueadas
    where p_quantidade is not null or rn <= numero_questoes
    order by case when p_quantidade is null then 0
                  else rn::numeric / greatest(numero_questoes, 1) end,
             random()
    limit coalesce(p_quantidade, 1000000)
  )
  insert into public.tentativas_simulado (user_id, produto_id, cargo_id, questoes_ids)
  select v_user_id, p_produto_id, p_cargo_id, array_agg(id order by disciplina_id, random())
  from escolhidas
  having count(*) > 0
  returning id into v_tentativa_id;

  if v_tentativa_id is null then
    raise exception 'Ainda não há questões suficientes cadastradas';
  end if;

  return query
  select t.id, u.questao_id, u.ordem::integer, d.nome, q.enunciado, q.alternativas, q.diagrama_svg, q.inspirada_em,
         case when q.dica is not null and btrim(q.dica) <> '' then ''::text else null::text end
  from public.tentativas_simulado t
  join lateral unnest(t.questoes_ids) with ordinality as u(questao_id, ordem) on true
  join public.questoes q on q.id = u.questao_id
  join public.disciplinas d on d.id = q.disciplina_id
  where t.id = v_tentativa_id
  order by u.ordem;
end;
$function$;
