-- Ritmo de estudo dos cursos da Formação Inicial para Eletricista (NR-1, Anexo II: EaD com controle de
-- tempo, dedicação diária e prazo). Sem vídeo: o controle é o tempo com a aula aberta na tela.
--   tempo_min_aula_pct : % da carga da aula que o aluno precisa ficar com ela aberta antes de concluir
--   minutos_dia_max    : depois de concluir esse total de carga no dia, a próxima aula só abre amanhã
--   dias_minimos_prova : a prova final (e o certificado) só a partir de N dias da matrícula (= compra)
-- Colunas nulas = curso sem a regra (comportamento antigo).

alter table public.cursos add column if not exists tempo_min_aula_pct integer;
alter table public.cursos add column if not exists minutos_dia_max integer;
alter table public.cursos add column if not exists dias_minimos_prova integer;

alter table public.progresso_aulas add column if not exists tempo_seg integer not null default 0;
alter table public.progresso_aulas add column if not exists ultimo_ping timestamptz;

update public.cursos set tempo_min_aula_pct = 10, minutos_dia_max = 240, dias_minimos_prova = 15
where slug in ('eletricista-residencial-basico', 'nr-10-basico');
update public.cursos set tempo_min_aula_pct = 10, minutos_dia_max = 240, dias_minimos_prova = 5
where slug = 'seguranca-trabalho-em-altura';

-- carga já concluída hoje (fuso de Brasília) num curso
create or replace function public.minutos_concluidos_hoje(p_user uuid, p_curso uuid)
returns integer
language sql
stable security definer
set search_path = public
as $$
  select coalesce(sum(a.carga_min), 0)::integer
  from progresso_aulas p join aulas a on a.id = p.aula_id
  where p.user_id = p_user and a.curso_id = p_curso and p.concluida_em is not null
    and (p.concluida_em at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date;
$$;
revoke execute on function public.minutos_concluidos_hoje(uuid, uuid) from public, anon;
grant execute on function public.minutos_concluidos_hoje(uuid, uuid) to authenticated;

-- Cronômetro: a aula aberta e visível manda um sinal a cada ~30 s; cada sinal soma no máximo 30 s
-- (abas duplicadas ou sinais em rajada não contam em dobro).
create or replace function public.registrar_tempo_aula(p_aula_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_tempo integer;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  update progresso_aulas
  set tempo_seg = tempo_seg + case
        when ultimo_ping is null then 0
        when now() - ultimo_ping < interval '25 seconds' then 0
        else least(30, extract(epoch from now() - ultimo_ping)::integer)
      end,
      ultimo_ping = case
        when ultimo_ping is not null and now() - ultimo_ping < interval '25 seconds' then ultimo_ping
        else now()
      end
  where user_id = auth.uid() and aula_id = p_aula_id
  returning tempo_seg into v_tempo;
  return coalesce(v_tempo, 0);
end;
$$;
revoke execute on function public.registrar_tempo_aula(uuid) from public, anon;
grant execute on function public.registrar_tempo_aula(uuid) to authenticated;

-- abrir aula: além da ordem, respeita o limite de horas do dia (aula já começada continua abrindo)
create or replace function public.abrir_aula(p_aula_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_curso uuid; v_prev uuid; v_seq boolean; v_max integer;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  select curso_id into v_curso from aulas where id = p_aula_id;
  if v_curso is null then raise exception 'Aula não disponível'; end if;
  if not exists (select 1 from matriculas where user_id = auth.uid() and curso_id = v_curso) then
    raise exception 'Você não está matriculado neste curso';
  end if;

  select ordem_obrigatoria, minutos_dia_max into v_seq, v_max from cursos where id = v_curso;
  if v_seq then
    select prev into v_prev from (
      select a.id, lag(a.id) over (order by m.ordem, a.ordem) as prev
      from aulas a join modulos m on m.id = a.modulo_id
      where a.curso_id = v_curso
    ) l where l.id = p_aula_id;
    if v_prev is not null and not exists (
      select 1 from progresso_aulas
      where user_id = auth.uid() and aula_id = v_prev and concluida_em is not null
    ) then
      raise exception 'Conclua a aula anterior para liberar esta';
    end if;
  end if;

  if v_max is not null
     and not exists (select 1 from progresso_aulas where user_id = auth.uid() and aula_id = p_aula_id)
     and minutos_concluidos_hoje(auth.uid(), v_curso) >= v_max then
    raise exception 'Limite de estudo de hoje atingido. A próxima aula libera amanhã';
  end if;

  insert into progresso_aulas (user_id, aula_id) values (auth.uid(), p_aula_id)
  on conflict do nothing;
end;
$$;

create or replace function public.concluir_aula(p_aula_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_iniciada timestamptz; v_concluida timestamptz; v_tempo integer;
  v_carga integer; v_pct integer; v_exigido integer;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  select p.iniciada_em, p.concluida_em, p.tempo_seg into v_iniciada, v_concluida, v_tempo
  from progresso_aulas p
  where p.user_id = auth.uid() and p.aula_id = p_aula_id;
  if v_iniciada is null then raise exception 'Abra a aula antes de concluir'; end if;
  if v_concluida is not null then return; end if;

  select a.carga_min, c.tempo_min_aula_pct into v_carga, v_pct
  from aulas a join cursos c on c.id = a.curso_id where a.id = p_aula_id;

  if v_pct is not null then
    v_exigido := ceil(coalesce(v_carga, 0) * 60 * v_pct / 100.0);
    if v_tempo < v_exigido then
      raise exception 'Faltam % min de estudo nesta aula. O tempo conta enquanto a aula está aberta na tela',
        ceil((v_exigido - v_tempo) / 60.0)::integer;
    end if;
  elsif extract(epoch from (now() - v_iniciada)) < 15 then
    raise exception 'Leia a aula antes de concluir. Tente de novo em alguns segundos';
  end if;

  update progresso_aulas set concluida_em = now()
  where user_id = auth.uid() and aula_id = p_aula_id;
end;
$$;

-- prova final só a partir de dias_minimos_prova da matrícula
create or replace function public.iniciar_quiz(p_curso_id uuid, p_etapa_horas integer default null)
returns table(tentativa_id uuid, questao_id uuid, ordem integer, enunciado text, alternativas jsonb)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_tentativa uuid;
  v_n integer;
  v_feitas integer;
  v_dias integer;
  v_matricula timestamptz;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;
  select criado_em into v_matricula from matriculas where user_id = v_user and curso_id = p_curso_id;
  if v_matricula is null then
    raise exception 'Você não está matriculado neste curso';
  end if;
  if p_etapa_horas is null then
    if not curso_pronto_para_prova(v_user, p_curso_id) then
      raise exception 'Conclua todas as aulas para liberar a prova final';
    end if;
    select quiz_num_questoes, dias_minimos_prova into v_n, v_dias from cursos where id = p_curso_id;
    if v_dias is not null and now() < v_matricula + make_interval(days => v_dias) then
      raise exception 'A prova final libera em % (% dias após a matrícula)',
        to_char((v_matricula + make_interval(days => v_dias)) at time zone 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI'), v_dias;
    end if;
  else
    if not exists (select 1 from cursos where id = p_curso_id and certificado_por_etapas) then
      raise exception 'Este curso não tem questionário por etapa';
    end if;
    select count(*) into v_feitas from aulas a
      where a.curso_id = p_curso_id
        and exists (select 1 from progresso_aulas p where p.aula_id = a.id and p.user_id = v_user and p.concluida_em is not null);
    if v_feitas < aulas_exigidas_certificado(p_curso_id, p_etapa_horas) then
      raise exception 'Conclua % aulas para liberar o questionário desta etapa', aulas_exigidas_certificado(p_curso_id, p_etapa_horas);
    end if;
    v_n := 5;
  end if;
  select id into v_tentativa from tentativas_quiz
  where user_id = v_user and curso_id = p_curso_id and finalizado_em is null
    and etapa_horas is not distinct from p_etapa_horas
  order by iniciado_em desc limit 1;
  if v_tentativa is null then
    insert into tentativas_quiz (user_id, curso_id, questoes_ids, etapa_horas)
    select v_user, p_curso_id, array_agg(id), p_etapa_horas from (
      select id from quiz_questoes
      where curso_id = p_curso_id and ativa and etapa_horas is not distinct from p_etapa_horas
      order by random() limit v_n
    ) s
    having count(*) > 0
    returning id into v_tentativa;
  end if;
  if v_tentativa is null then return; end if;
  return query
  select t.id, u.qid, u.ord::integer, q.enunciado, q.alternativas
  from tentativas_quiz t
  join lateral unnest(t.questoes_ids) with ordinality as u(qid, ord) on true
  join quiz_questoes q on q.id = u.qid
  where t.id = v_tentativa
  order by u.ord;
end $function$;

-- certificado profissionalizante: prazo = o maior entre 5 dias e o dias_minimos_prova do curso
create or replace function public.certificados_profissionalizante()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prof boolean;
  v_nota numeric;
  v_dias integer;
  v_inicio timestamptz;
  v_aulas timestamptz;
  v_prova timestamptz;
  v_libera timestamptz;
begin
  select profissionalizante, nota_minima, greatest(5, coalesce(dias_minimos_prova, 5))
    into v_prof, v_nota, v_dias from cursos where id = new.curso_id;
  if not coalesce(v_prof, false) then
    return new;
  end if;

  select criado_em into v_inicio from matriculas where user_id = new.user_id and curso_id = new.curso_id;
  if v_inicio is null then
    raise exception 'Matrícula não encontrada para este curso.';
  end if;

  v_libera := v_inicio + make_interval(days => v_dias);
  if now() < v_libera then
    raise exception 'O certificado deste curso pode ser emitido a partir de %. Continue estudando e volte nessa data.',
      to_char(v_libera at time zone 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI');
  end if;

  select max(p.concluida_em) into v_aulas
  from progresso_aulas p join aulas a on a.id = p.aula_id join modulos m on m.id = a.modulo_id
  where p.user_id = new.user_id and m.curso_id = new.curso_id and p.concluida_em is not null;

  select min(t.finalizado_em) into v_prova
  from tentativas_quiz t
  where t.user_id = new.user_id and t.curso_id = new.curso_id and t.etapa_horas is null
    and t.finalizado_em is not null and t.nota >= coalesce(v_nota, 70);

  new.data_inicio := (v_inicio at time zone 'America/Sao_Paulo')::date;
  new.data_conclusao := (coalesce(greatest(v_aulas, v_prova), now()) at time zone 'America/Sao_Paulo')::date;
  return new;
end;
$$;
revoke execute on function public.certificados_profissionalizante() from public, anon, authenticated;
