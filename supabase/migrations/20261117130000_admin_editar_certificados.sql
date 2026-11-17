-- Painel /admin/certificados (17/11/2026): busca de certificados por e-mail ou CPF e edição dos dados.
-- O hash de conferência é recalculado sozinho pelo gatilho certificados_hash quando nome, CPF, carga ou emissão mudam.

-- Histórico de cada edição feita pelo painel (quem não tem service_role não lê nem grava).
create table if not exists public.certificados_edicoes (
  id bigint generated always as identity primary key,
  certificado_id uuid not null references public.certificados(id) on delete cascade,
  antes jsonb not null,
  depois jsonb not null,
  editado_em timestamptz not null default now()
);
alter table public.certificados_edicoes enable row level security;
revoke all on public.certificados_edicoes from anon, authenticated;

-- Busca para o painel: por e-mail do aluno (parcial, sem diferenciar maiúsculas) ou por CPF (só dígitos).
create or replace function public.admin_buscar_certificados(p_email text default null, p_cpf text default null)
returns table (
  id uuid, codigo text, user_id uuid, email text, curso_slug text, curso_nome text,
  nome_completo text, cpf text, carga_horaria_horas integer, forma text,
  emitido_em timestamptz, data_inicio date, data_conclusao date, hash_conferencia text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.codigo, c.user_id, u.email::text, cu.slug, cu.nome,
         c.nome_completo, c.cpf, c.carga_horaria_horas, c.forma,
         c.emitido_em, c.data_inicio, c.data_conclusao, c.hash_conferencia
  from certificados c
  join auth.users u on u.id = c.user_id
  join cursos cu on cu.id = c.curso_id
  where (nullif(trim(p_email), '') is not null and u.email ilike '%' || trim(p_email) || '%')
     or (nullif(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g'), '') is not null
         and c.cpf = regexp_replace(p_cpf, '\D', '', 'g'))
  order by c.emitido_em desc
  limit 50;
$$;
revoke execute on function public.admin_buscar_certificados(text, text) from public, anon, authenticated;
grant execute on function public.admin_buscar_certificados(text, text) to service_role;
