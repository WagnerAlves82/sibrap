-- Cursos profissionalizantes: o certificado traz a data de início (compra/matrícula) e a de conclusão
-- (última aula ou aprovação na prova final) e só pode ser emitido a partir de 5 dias após a compra.
-- A regra não é anunciada no site: o aluno é avisado na área do curso, depois de comprar.

alter table public.cursos add column if not exists profissionalizante boolean not null default false;
update public.cursos set profissionalizante = true where slug = 'eletricista-residencial-basico';

alter table public.certificados add column if not exists data_inicio date;
alter table public.certificados add column if not exists data_conclusao date;

create or replace function public.certificados_profissionalizante()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prof boolean;
  v_nota numeric;
  v_inicio timestamptz;
  v_aulas timestamptz;
  v_prova timestamptz;
  v_libera timestamptz;
begin
  select profissionalizante, nota_minima into v_prof, v_nota from cursos where id = new.curso_id;
  if not coalesce(v_prof, false) then
    return new;
  end if;

  select criado_em into v_inicio from matriculas where user_id = new.user_id and curso_id = new.curso_id;
  if v_inicio is null then
    raise exception 'Matrícula não encontrada para este curso.';
  end if;

  v_libera := v_inicio + interval '5 days';
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
  -- conclusão = o que terminou por último entre as aulas e a prova final (sem registro, a data de hoje)
  new.data_conclusao := (coalesce(greatest(v_aulas, v_prova), now()) at time zone 'America/Sao_Paulo')::date;
  return new;
end;
$$;

revoke execute on function public.certificados_profissionalizante() from public, anon, authenticated;

drop trigger if exists certificados_profissionalizante on public.certificados;
create trigger certificados_profissionalizante
  before insert on public.certificados
  for each row execute function public.certificados_profissionalizante();

-- a validação pública passa a devolver o período do curso
drop function if exists public.validar_certificado(text);
create function public.validar_certificado(p_codigo text)
returns table(nome_completo text, cpf_mascarado text, curso_nome text, curso_slug text, carga_horaria_horas integer,
              emitido_em timestamptz, assinado_aluno_em timestamptz, assinado_instituicao_em timestamptz, hash_conferencia text,
              data_inicio date, data_conclusao date)
language sql
stable security definer
set search_path = public
as $$
  select
    c.nome_completo,
    case when c.cpf is null then null else substr(c.cpf,1,3) || '.***.***-' || substr(c.cpf,10,2) end,
    cu.nome, cu.slug, c.carga_horaria_horas, c.emitido_em,
    c.assinado_aluno_em, c.assinado_instituicao_em, c.hash_conferencia,
    c.data_inicio, c.data_conclusao
  from certificados c join cursos cu on cu.id = c.curso_id
  where c.codigo = upper(btrim(p_codigo));
$$;
grant execute on function public.validar_certificado(text) to anon, authenticated;
