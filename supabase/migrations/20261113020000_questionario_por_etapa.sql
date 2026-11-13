-- Questionário de etapa (12/11/2026, pedido do Wagner): nos cursos com certificado por etapas, cada carga
-- parcial (20 h, 40 h, 60 h) só libera com aprovação num questionário de 5 questões daquela etapa.
-- etapa_horas = null continua sendo a prova final do curso.

alter table public.quiz_questoes add column if not exists etapa_horas integer;
alter table public.tentativas_quiz add column if not exists etapa_horas integer;

-- a prova final ignora as questões de etapa; o questionário de etapa sorteia 5 questões da etapa
drop function if exists public.iniciar_quiz(uuid);
create or replace function public.iniciar_quiz(p_curso_id uuid, p_etapa_horas integer default null)
returns table (tentativa_id uuid, questao_id uuid, ordem integer, enunciado text, alternativas jsonb)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_tentativa uuid;
  v_n integer;
  v_feitas integer;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;
  if not exists (select 1 from matriculas where user_id = v_user and curso_id = p_curso_id) then
    raise exception 'Você não está matriculado neste curso';
  end if;

  if p_etapa_horas is null then
    if not curso_pronto_para_prova(v_user, p_curso_id) then
      raise exception 'Conclua todas as aulas para liberar a prova final';
    end if;
    select quiz_num_questoes into v_n from cursos where id = p_curso_id;
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
grant execute on function public.iniciar_quiz(uuid, integer) to authenticated;

-- etapa liberada = aulas da etapa + aprovação no questionário (se a etapa tiver questões);
-- carga completa = todas as aulas + prova final (só tentativas sem etapa)
create or replace function public.horas_liberadas_certificado(p_user uuid, p_curso uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_carga integer; v_min integer; v_etapas boolean; v_total integer; v_feitas integer; v_melhor numeric; v_horas integer;
begin
  select carga_horaria_horas, nota_minima, certificado_por_etapas into v_carga, v_min, v_etapas from cursos where id = p_curso;
  if v_carga is null then return 0; end if;
  select count(*) into v_total from aulas where curso_id = p_curso;
  select count(*) into v_feitas from aulas a
    where a.curso_id = p_curso
      and exists (select 1 from progresso_aulas p where p.aula_id = a.id and p.user_id = p_user and p.concluida_em is not null);
  select max(nota) into v_melhor from tentativas_quiz
    where user_id = p_user and curso_id = p_curso and finalizado_em is not null and etapa_horas is null;

  if v_total > 0 and v_feitas >= v_total and coalesce(v_melhor, -1) >= v_min then
    return v_carga;
  end if;
  if not v_etapas then return 0; end if;

  select max(pr.certificado_horas) into v_horas
  from produtos pr
  where pr.curso_id = p_curso and pr.certificado_horas is not null and pr.certificado_requer_horas is null
    and pr.certificado_horas < v_carga
    and aulas_exigidas_certificado(p_curso, pr.certificado_horas) <= v_feitas
    and (
      not exists (select 1 from quiz_questoes q where q.curso_id = p_curso and q.ativa and q.etapa_horas = pr.certificado_horas)
      or exists (
        select 1 from tentativas_quiz t
        where t.user_id = p_user and t.curso_id = p_curso and t.etapa_horas = pr.certificado_horas
          and t.finalizado_em is not null and t.nota >= v_min
      )
    );
  return coalesce(v_horas, 0);
end $$;
revoke all on function public.horas_liberadas_certificado(uuid, uuid) from public, anon, authenticated;

-- emissão nos cursos sem etapas: a prova final não conta nota de questionário de etapa
create or replace function public.emitir_certificado(p_curso_id uuid, p_nome text, p_cpf text)
returns text
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_user uuid := auth.uid();
  v_nome text := btrim(coalesce(p_nome, ''));
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');
  v_codigo text; v_hex text;
  v_horas integer; v_min integer; v_melhor numeric; v_forma text; v_isencao boolean; v_comprado integer;
  v_etapas boolean; v_liberadas integer; v_menor integer;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;
  select codigo into v_codigo from certificados where user_id = v_user and curso_id = p_curso_id;
  if v_codigo is not null then return v_codigo; end if;
  if length(v_nome) < 5 or position(' ' in v_nome) = 0 then
    raise exception 'Digite seu nome completo, como deve aparecer no certificado';
  end if;
  if v_cpf !~ '^[0-9]{11}$' then
    raise exception 'CPF inválido';
  end if;
  select carga_horaria_horas, nota_minima, permite_isencao_cadunico, certificado_por_etapas
    into v_horas, v_min, v_isencao, v_etapas from cursos where id = p_curso_id;
  if v_horas is null then raise exception 'Curso não encontrado'; end if;
  if not exists (select 1 from matriculas where user_id = v_user and curso_id = p_curso_id) then
    raise exception 'Você não está matriculado neste curso';
  end if;
  if v_etapas then
    v_liberadas := horas_liberadas_certificado(v_user, p_curso_id);
    if v_liberadas = 0 then
      select min(certificado_horas) into v_menor from produtos
        where curso_id = p_curso_id and certificado_horas is not null and certificado_requer_horas is null;
      raise exception 'Conclua % aulas e o questionário da primeira etapa para emitir o certificado',
        aulas_exigidas_certificado(p_curso_id, coalesce(v_menor, v_horas));
    end if;
  else
    if not curso_pronto_para_prova(v_user, p_curso_id) then
      raise exception 'Conclua todas as aulas antes de emitir o certificado';
    end if;
    select max(nota) into v_melhor from tentativas_quiz
    where user_id = v_user and curso_id = p_curso_id and finalizado_em is not null and etapa_horas is null;
    if v_melhor is null or v_melhor < v_min then
      raise exception 'Você precisa de nota mínima % na prova final', v_min;
    end if;
  end if;
  v_comprado := horas_certificado(v_user, p_curso_id);
  if v_isencao and exists (select 1 from comprovantes_cadunico where user_id = v_user and status = 'aprovado') then
    v_forma := 'gratuito_cadunico';
    if v_etapas then v_horas := least(v_horas, v_liberadas); end if;
  elsif v_comprado is not null then
    v_forma := 'pago';
    v_horas := least(v_comprado, v_horas);
    if v_etapas then v_horas := least(v_horas, v_liberadas); end if;
  else
    raise exception 'Certificado disponível após aprovação do comprovante do CadÚnico ou pagamento';
  end if;
  v_hex := upper(replace(gen_random_uuid()::text, '-', ''));
  v_codigo := 'SIB-' || substr(v_hex, 1, 4) || '-' || substr(v_hex, 5, 4) || '-' || substr(v_hex, 9, 4);
  insert into certificados (codigo, user_id, curso_id, nome_completo, cpf, carga_horaria_horas, forma)
  values (v_codigo, v_user, p_curso_id, v_nome, v_cpf, v_horas, v_forma);
  return v_codigo;
end $function$;

-- situação de cada etapa para o aluno (página do curso, certificado e tour)
create or replace function public.minhas_etapas_curso(p_curso uuid)
returns table (horas integer, aulas_exigidas integer, tem_questionario boolean, aprovado boolean, melhor_nota numeric)
language sql
stable
security definer
set search_path = public
as $$
  select pr.certificado_horas,
    aulas_exigidas_certificado(p_curso, pr.certificado_horas),
    exists (select 1 from quiz_questoes q where q.curso_id = p_curso and q.ativa and q.etapa_horas = pr.certificado_horas),
    exists (select 1 from tentativas_quiz t where t.user_id = auth.uid() and t.curso_id = p_curso
             and t.etapa_horas = pr.certificado_horas and t.finalizado_em is not null
             and t.nota >= (select nota_minima from cursos where id = p_curso)),
    (select max(t.nota) from tentativas_quiz t where t.user_id = auth.uid() and t.curso_id = p_curso
       and t.etapa_horas = pr.certificado_horas and t.finalizado_em is not null)
  from produtos pr
  join cursos c on c.id = pr.curso_id
  where pr.curso_id = p_curso and c.certificado_por_etapas and pr.certificado_horas is not null
    and pr.certificado_requer_horas is null and pr.certificado_horas < c.carga_horaria_horas and pr.ativo
  order by pr.certificado_horas;
$$;
revoke all on function public.minhas_etapas_curso(uuid) from public, anon;
grant execute on function public.minhas_etapas_curso(uuid) to authenticated;
