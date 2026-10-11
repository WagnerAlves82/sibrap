-- Simulado livre: a pessoa escolhe quantas questões quer, pode parar e ver os
-- acertos a qualquer momento e retomar de onde parou (respostas salvas a cada clique).

-- 1) iniciar_simulado ganha p_quantidade (null = proporção da prova, como antes).
--    Com quantidade, sorteia respeitando a proporção das matérias (numero_questoes).
drop function if exists public.iniciar_simulado(uuid, uuid);

create or replace function public.iniciar_simulado(p_produto_id uuid, p_cargo_id uuid, p_quantidade integer default null)
returns table(tentativa_id uuid, questao_id uuid, ordem integer, disciplina_nome text, enunciado text, alternativas jsonb, diagrama_svg text, inspirada_em text)
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

  with ranqueadas as (
    select q.id,
           cd.disciplina_id,
           cd.numero_questoes,
           row_number() over (partition by cd.disciplina_id order by random()) as rn
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
  select t.id, u.questao_id, u.ordem::integer, d.nome, q.enunciado, q.alternativas, q.diagrama_svg, q.inspirada_em
  from public.tentativas_simulado t
  join lateral unnest(t.questoes_ids) with ordinality as u(questao_id, ordem) on true
  join public.questoes q on q.id = u.questao_id
  join public.disciplinas d on d.id = q.disciplina_id
  where t.id = v_tentativa_id
  order by u.ordem;
end;
$function$;

-- 2) salva uma resposta (a cada clique), só em tentativa em aberto da própria pessoa
create or replace function public.salvar_resposta_simulado(p_tentativa_id uuid, p_questao_id uuid, p_letra text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.tentativas_simulado
  set respostas = jsonb_set(coalesce(respostas, '{}'::jsonb), array[p_questao_id::text], to_jsonb(p_letra), true)
  where id = p_tentativa_id
    and user_id = auth.uid()
    and finalizado_em is null
    and p_questao_id = any(questoes_ids);
end;
$function$;

-- 3) retoma a tentativa em aberto mais recente do produto (questões + respostas já dadas)
create or replace function public.retomar_simulado(p_produto_id uuid)
returns table(tentativa_id uuid, questao_id uuid, ordem integer, disciplina_nome text, enunciado text, alternativas jsonb, diagrama_svg text, inspirada_em text, resposta text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tentativa_id uuid;
begin
  select t.id into v_tentativa_id
  from public.tentativas_simulado t
  where t.user_id = auth.uid() and t.produto_id = p_produto_id and t.finalizado_em is null
  order by t.iniciado_em desc
  limit 1;

  if v_tentativa_id is null then
    return;
  end if;

  return query
  select t.id, u.questao_id, u.ordem::integer, d.nome, q.enunciado, q.alternativas, q.diagrama_svg, q.inspirada_em,
         t.respostas->>u.questao_id::text
  from public.tentativas_simulado t
  join lateral unnest(t.questoes_ids) with ordinality as u(questao_id, ordem) on true
  join public.questoes q on q.id = u.questao_id
  join public.disciplinas d on d.id = q.disciplina_id
  where t.id = v_tentativa_id
  order by u.ordem;
end;
$function$;

-- 4) resultado parcial (sem encerrar): por matéria, quantas respondeu e quantas acertou
create or replace function public.parcial_simulado(p_tentativa_id uuid)
returns table(disciplina_nome text, respondidas integer, acertos integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  return query
  select d.nome,
         (count(*) filter (where t.respostas ? q.id::text))::integer,
         (count(*) filter (where t.respostas->>q.id::text = q.gabarito))::integer
  from public.tentativas_simulado t
  join public.questoes q on q.id = any(t.questoes_ids)
  join public.disciplinas d on d.id = q.disciplina_id
  where t.id = p_tentativa_id and t.user_id = auth.uid()
  group by d.nome;
end;
$function$;

-- 5) finalizar: o total passa a ser o das respondidas (permite encerrar no meio)
create or replace function public.finalizar_simulado(p_tentativa_id uuid, p_respostas jsonb)
returns table(nota numeric, total integer, acertos integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_questoes_ids uuid[];
  v_total integer;
  v_acertos integer;
begin
  select questoes_ids into v_questoes_ids
  from public.tentativas_simulado
  where id = p_tentativa_id and user_id = v_user_id and finalizado_em is null;

  if v_questoes_ids is null then
    raise exception 'Tentativa não encontrada ou já finalizada';
  end if;

  select count(*) into v_total
  from public.questoes q
  where q.id = any(v_questoes_ids) and p_respostas ? q.id::text;

  if v_total = 0 then
    raise exception 'Responda ao menos uma questão para ver o resultado';
  end if;

  select count(*) into v_acertos
  from public.questoes q
  where q.id = any(v_questoes_ids)
    and p_respostas->>q.id::text = q.gabarito;

  update public.tentativas_simulado
  set respostas = p_respostas,
      nota = round((v_acertos::numeric / v_total) * 100, 2),
      finalizado_em = now()
  where id = p_tentativa_id;

  return query select round((v_acertos::numeric / v_total) * 100, 2), v_total, v_acertos;
end;
$function$;

-- 6) desempenho por matéria considera só as respondidas
create or replace function public.desempenho_simulado(p_tentativa_id uuid)
returns table(disciplina_nome text, total integer, acertos integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  return query
  select d.nome,
         count(*)::integer as total,
         (count(*) filter (where t.respostas->>q.id::text = q.gabarito))::integer as acertos
  from public.tentativas_simulado t
  join public.questoes q on q.id = any(t.questoes_ids)
  join public.disciplinas d on d.id = q.disciplina_id
  where t.id = p_tentativa_id and t.user_id = v_user_id and t.finalizado_em is not null
    and t.respostas ? q.id::text
  group by d.nome;
end;
$function$;

grant execute on function public.iniciar_simulado(uuid, uuid, integer) to authenticated;
grant execute on function public.salvar_resposta_simulado(uuid, uuid, text) to authenticated;
grant execute on function public.retomar_simulado(uuid) to authenticated;
grant execute on function public.parcial_simulado(uuid) to authenticated;
