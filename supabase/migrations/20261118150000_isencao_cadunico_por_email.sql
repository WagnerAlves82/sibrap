-- Isenção do certificado pelo CadÚnico, de volta em 18/11/2026 (Wagner), agora por e-mail:
-- o aluno manda o comprovante para contato@sibrap.tec.br, o Wagner confere, e a aprovação é registrada aqui por curso
-- (sem guardar o documento). Cota: 30 certificados por mês. O registro serve de comprovação do atendimento social.
alter table public.comprovantes_cadunico add column if not exists curso_id uuid references public.cursos(id) on delete cascade;
alter table public.comprovantes_cadunico add column if not exists observacao text;
create index if not exists comprovantes_cadunico_curso_idx on public.comprovantes_cadunico (user_id, curso_id);

create or replace function public.emitir_certificado(p_curso_id uuid, p_nome text, p_cpf text)
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
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
  -- isenção: aprovação para este curso (por e-mail, desde 18/11/2026) ou a antiga, geral, nos cursos que permitiam
  if exists (select 1 from comprovantes_cadunico where user_id = v_user and status = 'aprovado'
             and (curso_id = p_curso_id or (curso_id is null and v_isencao))) then
    v_forma := 'gratuito_cadunico';
    if v_etapas then v_horas := least(v_horas, v_liberadas); end if;
  elsif v_comprado is not null then
    v_forma := 'pago';
    v_horas := least(v_comprado, v_horas);
    if v_etapas then v_horas := least(v_horas, v_liberadas); end if;
  else
    raise exception 'Certificado disponível após o pagamento ou a aprovação da isenção';
  end if;
  v_hex := upper(replace(gen_random_uuid()::text, '-', ''));
  v_codigo := 'SIB-' || substr(v_hex, 1, 4) || '-' || substr(v_hex, 5, 4) || '-' || substr(v_hex, 9, 4);
  insert into certificados (codigo, user_id, curso_id, nome_completo, cpf, carga_horaria_horas, forma)
  values (v_codigo, v_user, p_curso_id, v_nome, v_cpf, v_horas, v_forma);
  return v_codigo;
end $function$;
