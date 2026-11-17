-- Seção "Educação: formação continuada" (pedido do Wagner, 17/11/2026): cursos livres para professores,
-- gratuitos, com certificado pago. Regras do certificado (sem cronômetro):
--   * prazo mínimo desde a matrícula, conforme a carga: 20 h = 5 dias, 40 h = 7, 60 h = 10, 80 h = 12;
--   * o certificado traz início (matrícula) e conclusão (data em que o sistema emitiu ou subiu a carga).

alter table public.cursos add column if not exists formacao_continuada boolean not null default false;

create or replace function public.dias_minimos_carga(p_horas integer)
returns integer language sql immutable as $$
  select case when p_horas <= 20 then 5 when p_horas <= 40 then 7 when p_horas <= 60 then 10 else 12 end;
$$;

-- carga máxima que o tempo de matrícula já permite (null = sem limite)
create or replace function public.teto_horas_por_prazo(p_user uuid, p_curso uuid)
returns integer
language plpgsql stable security definer set search_path = public
as $$
declare v_fc boolean; v_inicio timestamptz; v_dias numeric;
begin
  select formacao_continuada into v_fc from cursos where id = p_curso;
  if not coalesce(v_fc, false) then return null; end if;
  select criado_em into v_inicio from matriculas where user_id = p_user and curso_id = p_curso;
  if v_inicio is null then return 0; end if;
  v_dias := extract(epoch from now() - v_inicio) / 86400;
  return case when v_dias < 5 then 0 when v_dias < 7 then 20 when v_dias < 10 then 40 when v_dias < 12 then 60 else null end;
end $$;
revoke all on function public.teto_horas_por_prazo(uuid, uuid) from public, anon, authenticated;

-- horas liberadas: mesma regra de antes, agora limitada pelo prazo nos cursos de formação continuada
alter function public.horas_liberadas_certificado(uuid, uuid) rename to horas_liberadas_progresso;
revoke all on function public.horas_liberadas_progresso(uuid, uuid) from public, anon, authenticated;

create or replace function public.horas_liberadas_certificado(p_user uuid, p_curso uuid)
returns integer
language plpgsql stable security definer set search_path = public
as $$
declare v_horas integer; v_teto integer;
begin
  v_horas := horas_liberadas_progresso(p_user, p_curso);
  v_teto := teto_horas_por_prazo(p_user, p_curso);
  if v_teto is null then return v_horas; end if;
  -- só cargas que existem no curso: a maior carga à venda que cabe no teto
  if v_horas <= v_teto then return v_horas; end if;
  return coalesce((
    select max(h) from (
      select pr.certificado_horas h from produtos pr
      where pr.curso_id = p_curso and pr.certificado_horas is not null and pr.certificado_requer_horas is null
    ) x where h <= v_teto and h <= v_horas), 0);
end $$;
revoke all on function public.horas_liberadas_certificado(uuid, uuid) from public, anon, authenticated;

-- emissão: confere o prazo da carga emitida e grava o período
create or replace function public.certificados_formacao_continuada()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare v_fc boolean; v_inicio timestamptz; v_libera timestamptz;
begin
  select formacao_continuada into v_fc from cursos where id = new.curso_id;
  if not coalesce(v_fc, false) then return new; end if;
  if tg_op = 'UPDATE' and new.carga_horaria_horas is not distinct from old.carga_horaria_horas then return new; end if;

  select criado_em into v_inicio from matriculas where user_id = new.user_id and curso_id = new.curso_id;
  if v_inicio is null then raise exception 'Matrícula não encontrada para este curso.'; end if;
  v_libera := v_inicio + make_interval(days => dias_minimos_carga(new.carga_horaria_horas));
  if now() < v_libera then
    raise exception 'O certificado de % h deste curso pode ser emitido a partir de %.', new.carga_horaria_horas,
      to_char(v_libera at time zone 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI');
  end if;
  new.data_inicio := (v_inicio at time zone 'America/Sao_Paulo')::date;
  new.data_conclusao := (now() at time zone 'America/Sao_Paulo')::date;
  return new;
end $$;
revoke execute on function public.certificados_formacao_continuada() from public, anon, authenticated;

drop trigger if exists certificados_formacao_continuada on public.certificados;
create trigger certificados_formacao_continuada
  before insert or update of carga_horaria_horas on public.certificados
  for each row execute function public.certificados_formacao_continuada();

-- o prazo vence sem nenhum evento de progresso: a página do certificado chama isto para subir a carga já paga
create or replace function public.sincronizar_meu_certificado(p_curso uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  perform sincronizar_horas_certificado(auth.uid(), p_curso);
end $$;
revoke execute on function public.sincronizar_meu_certificado(uuid) from public, anon;
grant execute on function public.sincronizar_meu_certificado(uuid) to authenticated;
