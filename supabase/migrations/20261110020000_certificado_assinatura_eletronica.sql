-- Assinatura eletrônica simples (Lei 14.063/2020) no certificado, mesma lógica da CENAPRO:
--  * aluno: assina ao emitir (aceite obrigatório na tela de emissão, logado) → assinado_aluno_em
--  * instituição (Wagner A. de S. Jr, Professor Habilitado): assinatura automática na emissão → assinado_instituicao_em
--  * código de conferência: SHA-256 dos dados do certificado; se alguém mudar nome, CPF, curso ou carga num PDF,
--    o código mostrado na validação deixa de bater.
alter table public.certificados
  add column if not exists assinado_aluno_em timestamptz not null default now(),
  add column if not exists assinado_instituicao_em timestamptz not null default now(),
  add column if not exists hash_conferencia text;

-- certificados antigos: as duas assinaturas passam a valer na data da emissão
update public.certificados set assinado_aluno_em = emitido_em, assinado_instituicao_em = emitido_em;

create or replace function public.certificado_hash(
  p_codigo text, p_nome text, p_cpf text, p_curso uuid, p_horas integer, p_emitido timestamptz
) returns text language sql immutable set search_path = public as $$
  select encode(sha256(convert_to(concat_ws('|',
    upper(p_codigo), p_nome, coalesce(p_cpf, ''), p_curso::text, p_horas::text,
    to_char(p_emitido at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS')
  ), 'UTF8')), 'hex');
$$;

create or replace function public.certificados_preencher_hash()
returns trigger language plpgsql set search_path = public as $$
begin
  new.hash_conferencia := certificado_hash(new.codigo, new.nome_completo, new.cpf, new.curso_id, new.carga_horaria_horas, new.emitido_em);
  return new;
end $$;

drop trigger if exists certificados_hash on public.certificados;
create trigger certificados_hash
  before insert or update of codigo, nome_completo, cpf, curso_id, carga_horaria_horas, emitido_em
  on public.certificados
  for each row execute function public.certificados_preencher_hash();

update public.certificados
  set hash_conferencia = certificado_hash(codigo, nome_completo, cpf, curso_id, carga_horaria_horas, emitido_em);

-- validação pública passa a mostrar as assinaturas e o código de conferência
drop function if exists public.validar_certificado(text);
create function public.validar_certificado(p_codigo text)
returns table(nome_completo text, cpf_mascarado text, curso_nome text, curso_slug text,
              carga_horaria_horas integer, emitido_em timestamptz,
              assinado_aluno_em timestamptz, assinado_instituicao_em timestamptz, hash_conferencia text)
language sql stable security definer set search_path = public as $$
  select
    c.nome_completo,
    case when c.cpf is null then null else substr(c.cpf,1,3) || '.***.***-' || substr(c.cpf,10,2) end,
    cu.nome, cu.slug, c.carga_horaria_horas, c.emitido_em,
    c.assinado_aluno_em, c.assinado_instituicao_em, c.hash_conferencia
  from certificados c join cursos cu on cu.id = c.curso_id
  where c.codigo = upper(btrim(p_codigo));
$$;

revoke execute on function public.validar_certificado(text) from public;
grant execute on function public.validar_certificado(text) to anon, authenticated, service_role;
revoke execute on function public.certificado_hash(text, text, text, uuid, integer, timestamptz) from public, anon, authenticated;
revoke execute on function public.certificados_preencher_hash() from public, anon, authenticated;
