-- Certificado por etapas (12/11/2026, pedido do Wagner): em cursos longos, cada carga horária do
-- certificado libera com a fração proporcional de aulas concluídas, em vez de exigir o curso inteiro.
-- Ex.: Assistente Administrativo (40 aulas, 80 h): 20 h = 10 aulas, 40 h = 20, 60 h = 30, 80 h = 40 + prova.
-- Quem compra uma carga maior do que a já liberada emite com a carga liberada, e o certificado sobe
-- sozinho (mesmo código e QR Code) ao concluir as aulas que faltam.

alter table public.cursos add column if not exists certificado_por_etapas boolean not null default false;
update public.cursos set certificado_por_etapas = true where slug = 'assistente-administrativo';

-- quantas aulas concluídas são exigidas para uma carga de p_horas
create or replace function public.aulas_exigidas_certificado(p_curso uuid, p_horas integer)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when c.certificado_por_etapas and p_horas < c.carga_horaria_horas
      then ceil((select count(*) from aulas a where a.curso_id = c.id)::numeric * p_horas / c.carga_horaria_horas)::integer
    else (select count(*) from aulas a where a.curso_id = c.id)::integer
  end
  from cursos c where c.id = p_curso;
$$;

-- maior carga já liberada pelo progresso do aluno (0 = nenhuma)
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
    where user_id = p_user and curso_id = p_curso and finalizado_em is not null;

  -- curso completo + prova: carga total
  if v_total > 0 and v_feitas >= v_total and coalesce(v_melhor, -1) >= v_min then
    return v_carga;
  end if;
  if not v_etapas then return 0; end if;

  select max(pr.certificado_horas) into v_horas
  from produtos pr
  where pr.curso_id = p_curso and pr.certificado_horas is not null and pr.certificado_requer_horas is null
    and pr.certificado_horas < v_carga
    and aulas_exigidas_certificado(p_curso, pr.certificado_horas) <= v_feitas;
  return coalesce(v_horas, 0);
end $$;

-- leva o certificado pago até as horas compradas, limitado ao que o progresso já liberou (só sobe)
create or replace function public.sincronizar_horas_certificado(p_user uuid, p_curso uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_comprado integer; v_liberadas integer; v_etapas boolean; v_alvo integer;
begin
  v_comprado := horas_certificado(p_user, p_curso);
  if v_comprado is null then return; end if;
  select certificado_por_etapas into v_etapas from cursos where id = p_curso;
  v_alvo := v_comprado;
  if v_etapas then
    v_liberadas := horas_liberadas_certificado(p_user, p_curso);
    v_alvo := least(v_comprado, v_liberadas);
  end if;
  update certificados set carga_horaria_horas = v_alvo
  where user_id = p_user and curso_id = p_curso and forma = 'pago' and carga_horaria_horas < v_alvo;
end $$;

-- upgrade pago (acessos): agora respeita o que já foi liberado
create or replace function public.atualizar_horas_certificado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_curso uuid;
begin
  select curso_id into v_curso from produtos where id = new.produto_id and certificado_horas is not null;
  if v_curso is null then return new; end if;
  perform sincronizar_horas_certificado(new.user_id, v_curso);
  return new;
end $$;

-- progresso nas aulas ou prova aprovada: sobe o certificado de quem já pagou carga maior
create or replace function public.progresso_sobe_certificado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_curso uuid;
begin
  if tg_table_name = 'progresso_aulas' then
    if new.concluida_em is null then return new; end if;
    select curso_id into v_curso from aulas where id = new.aula_id;
  else
    if new.finalizado_em is null then return new; end if;
    v_curso := new.curso_id;
  end if;
  if v_curso is not null and exists (
    select 1 from cursos where id = v_curso and certificado_por_etapas
  ) and exists (
    select 1 from certificados where user_id = new.user_id and curso_id = v_curso and forma = 'pago'
  ) then
    perform sincronizar_horas_certificado(new.user_id, v_curso);
  end if;
  return new;
end $$;

drop trigger if exists progresso_sobe_certificado on public.progresso_aulas;
create trigger progresso_sobe_certificado after insert or update of concluida_em on public.progresso_aulas
  for each row execute function public.progresso_sobe_certificado();

drop trigger if exists prova_sobe_certificado on public.tentativas_quiz;
create trigger prova_sobe_certificado after insert or update of finalizado_em on public.tentativas_quiz
  for each row execute function public.progresso_sobe_certificado();

-- emissão: nos cursos por etapas, emite com a carga já liberada (até a comprada)
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
      raise exception 'Conclua pelo menos % aulas para emitir o certificado', aulas_exigidas_certificado(p_curso_id, coalesce(v_menor, v_horas));
    end if;
  else
    if not curso_pronto_para_prova(v_user, p_curso_id) then
      raise exception 'Conclua todas as aulas antes de emitir o certificado';
    end if;
    select max(nota) into v_melhor from tentativas_quiz
    where user_id = v_user and curso_id = p_curso_id and finalizado_em is not null;
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

-- leitura para a página do certificado (só do próprio aluno)
create or replace function public.minha_etapa_certificado(p_curso uuid)
returns table (feitas integer, total integer, liberadas integer, compradas integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::integer from aulas a where a.curso_id = p_curso
       and exists (select 1 from progresso_aulas p where p.aula_id = a.id and p.user_id = auth.uid() and p.concluida_em is not null)),
    (select count(*)::integer from aulas a where a.curso_id = p_curso),
    horas_liberadas_certificado(auth.uid(), p_curso),
    horas_certificado(auth.uid(), p_curso);
$$;

revoke all on function public.aulas_exigidas_certificado(uuid, integer) from public, anon;
revoke all on function public.horas_liberadas_certificado(uuid, uuid) from public, anon, authenticated;
revoke all on function public.sincronizar_horas_certificado(uuid, uuid) from public, anon, authenticated;
revoke all on function public.progresso_sobe_certificado() from public, anon, authenticated;
revoke all on function public.minha_etapa_certificado(uuid) from public, anon;
grant execute on function public.aulas_exigidas_certificado(uuid, integer) to authenticated;
grant execute on function public.minha_etapa_certificado(uuid) to authenticated;
