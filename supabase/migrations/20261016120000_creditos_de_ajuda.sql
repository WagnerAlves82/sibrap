-- Créditos de ajuda do AVA.
-- Quem compra a apostila começa com 100 créditos (por apostila). O crédito só
-- é gasto ao pedir a Dica SIBRAP (5); errar questão não desconta nada. Ganha
-- crédito quem cria hábito: concluir simulado, marcar tópico do cronograma,
-- ler capítulo. Tudo registrado em creditos_movimentos (só as funções abaixo
-- escrevem; o aluno só lê o próprio saldo).

create table if not exists public.creditos_movimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  delta integer not null,
  motivo text not null,
  ref text not null default '',
  criado_em timestamptz not null default now(),
  unique (user_id, produto_id, motivo, ref)
);

create index if not exists creditos_movimentos_user_produto_idx
  on public.creditos_movimentos (user_id, produto_id, criado_em desc);

alter table public.creditos_movimentos enable row level security;

drop policy if exists creditos_movimentos_select_proprio on public.creditos_movimentos;
create policy creditos_movimentos_select_proprio on public.creditos_movimentos
  for select to authenticated using (user_id = auth.uid());

revoke all on public.creditos_movimentos from anon, authenticated;
grant select on public.creditos_movimentos to authenticated;

-- Crédito por hábito, com teto de 40 por dia (fuso de Brasília) para não dar
-- para "farmar". Interno: ninguém de fora chama.
create or replace function public._creditar(p_user uuid, p_produto uuid, p_motivo text, p_ref text, p_valor integer)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_hoje integer;
begin
  if p_valor <= 0 then
    return false;
  end if;

  select coalesce(sum(delta), 0) into v_hoje
  from public.creditos_movimentos
  where user_id = p_user and produto_id = p_produto and delta > 0 and motivo <> 'boas_vindas'
    and (criado_em at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date;

  if v_hoje >= 40 then
    return false;
  end if;

  insert into public.creditos_movimentos (user_id, produto_id, delta, motivo, ref)
  values (p_user, p_produto, p_valor, p_motivo, coalesce(p_ref, ''))
  on conflict (user_id, produto_id, motivo, ref) do nothing;

  return found;
end;
$function$;

revoke all on function public._creditar(uuid, uuid, text, text, integer) from public, anon, authenticated;

-- Saldo da apostila; na primeira consulta de quem tem acesso entram os 100
-- créditos de boas-vindas.
create or replace function public.creditos_saldo(p_produto_id uuid)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  if not exists (select 1 from public.acessos a where a.user_id = v_user and a.produto_id = p_produto_id) then
    raise exception 'Sem acesso a esse produto';
  end if;

  insert into public.creditos_movimentos (user_id, produto_id, delta, motivo, ref)
  values (v_user, p_produto_id, 100, 'boas_vindas', '')
  on conflict (user_id, produto_id, motivo, ref) do nothing;

  return (select coalesce(sum(delta), 0)::integer from public.creditos_movimentos
          where user_id = v_user and produto_id = p_produto_id);
end;
$function$;

-- Dica SIBRAP: 5 créditos, cobrados uma vez por questão (abrir de novo é
-- grátis). A dica só sai para questão do simulado do próprio aluno.
create or replace function public.usar_dica(p_produto_id uuid, p_questao_id uuid)
returns table(ok boolean, dica text, saldo integer, cobrado boolean, motivo text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_dica text;
  v_saldo integer;
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  v_saldo := public.creditos_saldo(p_produto_id);

  if not exists (
    select 1 from public.tentativas_simulado t
    where t.user_id = v_user and t.produto_id = p_produto_id and p_questao_id = any(t.questoes_ids)
  ) then
    return query select false, null::text, v_saldo, false, 'questao_invalida'::text;
    return;
  end if;

  select q.dica into v_dica from public.questoes q where q.id = p_questao_id;
  if v_dica is null or btrim(v_dica) = '' then
    return query select false, null::text, v_saldo, false, 'sem_dica'::text;
    return;
  end if;

  if exists (select 1 from public.creditos_movimentos m
             where m.user_id = v_user and m.produto_id = p_produto_id and m.motivo = 'dica' and m.ref = p_questao_id::text) then
    return query select true, v_dica, v_saldo, false, 'ja_usada'::text;
    return;
  end if;

  if v_saldo < 5 then
    return query select false, null::text, v_saldo, false, 'sem_saldo'::text;
    return;
  end if;

  insert into public.creditos_movimentos (user_id, produto_id, delta, motivo, ref)
  values (v_user, p_produto_id, -5, 'dica', p_questao_id::text)
  on conflict (user_id, produto_id, motivo, ref) do nothing;

  return query select true, v_dica, v_saldo - 5, true, 'ok'::text;
end;
$function$;

-- Crédito por estudo (cronograma, capítulo lido, capítulo aberto depois de
-- errar). Valores fixos aqui, no servidor; o aluno só informa o motivo.
create or replace function public.creditar_estudo(p_slug text, p_motivo text, p_ref text)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_produto uuid;
  v_valor integer;
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;

  v_valor := case p_motivo
    when 'cronograma' then 3
    when 'capitulo_lido' then 2
    when 'capitulo_apos_erro' then 5
    else 0
  end;
  if v_valor = 0 then
    raise exception 'Motivo inválido';
  end if;

  select a.produto_id into v_produto from public.apostilas a where a.slug = p_slug;
  if v_produto is null or not exists (select 1 from public.acessos x where x.user_id = v_user and x.produto_id = v_produto) then
    raise exception 'Sem acesso a esse produto';
  end if;

  perform public.creditos_saldo(v_produto);
  perform public._creditar(v_user, v_produto, p_motivo, p_ref, v_valor);

  return (select coalesce(sum(delta), 0)::integer from public.creditos_movimentos
          where user_id = v_user and produto_id = v_produto);
end;
$function$;

-- finalizar_simulado: concluir (com 10+ questões respondidas) rende +10; o
-- primeiro simulado concluído rende +10 a mais. Nota e acertos não entram.
create or replace function public.finalizar_simulado(p_tentativa_id uuid, p_respostas jsonb)
returns table(nota numeric, total integer, acertos integer)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_questoes_ids uuid[];
  v_produto uuid;
  v_total integer;
  v_acertos integer;
begin
  select questoes_ids, produto_id into v_questoes_ids, v_produto
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

  if v_total >= 10 and v_produto is not null then
    perform public.creditos_saldo(v_produto);
    perform public._creditar(v_user_id, v_produto, 'simulado', p_tentativa_id::text, 10);
    perform public._creditar(v_user_id, v_produto, 'primeiro_simulado', '', 10);
  end if;

  return query select round((v_acertos::numeric / v_total) * 100, 2), v_total, v_acertos;
end;
$function$;

-- iniciar_simulado / retomar_simulado: a coluna "dica" passa a ser só um
-- marcador ('' = a questão tem dica). O texto sai por usar_dica(), que cobra.
create or replace function public.iniciar_simulado(p_produto_id uuid, p_cargo_id uuid, p_quantidade integer default null::integer)
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

create or replace function public.retomar_simulado(p_produto_id uuid)
returns table(tentativa_id uuid, questao_id uuid, ordem integer, disciplina_nome text, enunciado text, alternativas jsonb, diagrama_svg text, inspirada_em text, dica text, resposta text)
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
         case when q.dica is not null and btrim(q.dica) <> '' then ''::text else null::text end,
         t.respostas->>u.questao_id::text
  from public.tentativas_simulado t
  join lateral unnest(t.questoes_ids) with ordinality as u(questao_id, ordem) on true
  join public.questoes q on q.id = u.questao_id
  join public.disciplinas d on d.id = q.disciplina_id
  where t.id = v_tentativa_id
  order by u.ordem;
end;
$function$;

grant execute on function public.creditos_saldo(uuid) to authenticated;
grant execute on function public.usar_dica(uuid, uuid) to authenticated;
grant execute on function public.creditar_estudo(text, text, text) to authenticated;
