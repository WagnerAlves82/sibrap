-- Painel /admin/certificados (17/11/2026): ajustes feitos ANTES da emissão, aplicados quando o aluno emite.
-- Só age para quem tem ajuste salvo pelo painel; para todos os outros, a emissão continua igual.
-- Período (início e término) pelo painel: só no certificado de 80 h do Assistente Administrativo.
create table if not exists public.certificados_ajustes (
  user_id uuid not null references auth.users(id) on delete cascade,
  curso_id uuid not null references public.cursos(id) on delete cascade,
  nome_completo text,
  cpf text,
  data_inicio date,
  data_conclusao date,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, curso_id)
);
alter table public.certificados_ajustes enable row level security;
revoke all on public.certificados_ajustes from anon, authenticated;

-- Roda depois dos outros gatilhos de inserção (nome com zz) e recalcula o hash com os dados finais.
create or replace function public.certificados_aplicar_ajuste()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare a record; v_slug text;
begin
  select * into a from certificados_ajustes where user_id = new.user_id and curso_id = new.curso_id;
  if not found then return new; end if;
  if nullif(btrim(coalesce(a.nome_completo, '')), '') is not null then new.nome_completo := btrim(a.nome_completo); end if;
  if a.cpf ~ '^[0-9]{11}$' then new.cpf := a.cpf; end if;
  select slug into v_slug from cursos where id = new.curso_id;
  if v_slug = 'assistente-administrativo' and new.carga_horaria_horas = 80
     and a.data_inicio is not null and a.data_conclusao is not null then
    new.data_inicio := a.data_inicio;
    new.data_conclusao := a.data_conclusao;
  end if;
  new.hash_conferencia := certificado_hash(new.codigo, new.nome_completo, new.cpf, new.curso_id, new.carga_horaria_horas, new.emitido_em);
  return new;
end $$;
revoke execute on function public.certificados_aplicar_ajuste() from public, anon, authenticated;

drop trigger if exists certificados_zz_ajuste on public.certificados;
create trigger certificados_zz_ajuste
  before insert on public.certificados
  for each row execute function public.certificados_aplicar_ajuste();

create or replace function public.admin_matriculas_sem_certificado(p_email text)
returns table (user_id uuid, email text, curso_id uuid, curso_slug text, curso_nome text, carga_horaria_horas integer,
               matriculado_em timestamptz, nome_completo text, cpf text, data_inicio date, data_conclusao date)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.email::text, cu.id, cu.slug, cu.nome, cu.carga_horaria_horas, m.criado_em,
         a.nome_completo, a.cpf, a.data_inicio, a.data_conclusao
  from auth.users u
  join matriculas m on m.user_id = u.id
  join cursos cu on cu.id = m.curso_id
  left join certificados_ajustes a on a.user_id = u.id and a.curso_id = cu.id
  where nullif(trim(p_email), '') is not null and u.email ilike '%' || trim(p_email) || '%'
    and not exists (select 1 from certificados c where c.user_id = u.id and c.curso_id = cu.id)
  order by m.criado_em desc
  limit 50;
$$;
revoke execute on function public.admin_matriculas_sem_certificado(text) from public, anon, authenticated;
grant execute on function public.admin_matriculas_sem_certificado(text) to service_role;
