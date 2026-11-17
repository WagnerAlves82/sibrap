-- Wagner (17/11/2026): todo certificado editado pelo painel tem início e término editáveis (todos os cursos),
-- e o painel já traz os dados do aluno preenchidos. Só vale para o que é salvo no painel; o site segue igual.

-- O ajuste salvo pelo painel aplica nome, CPF e período em qualquer curso.
create or replace function public.certificados_aplicar_ajuste()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare a record;
begin
  select * into a from certificados_ajustes where user_id = new.user_id and curso_id = new.curso_id;
  if not found then return new; end if;
  if nullif(btrim(coalesce(a.nome_completo, '')), '') is not null then new.nome_completo := btrim(a.nome_completo); end if;
  if a.cpf ~ '^[0-9]{11}$' then new.cpf := a.cpf; end if;
  if a.data_inicio is not null and a.data_conclusao is not null then
    new.data_inicio := a.data_inicio;
    new.data_conclusao := a.data_conclusao;
  end if;
  new.hash_conferencia := certificado_hash(new.codigo, new.nome_completo, new.cpf, new.curso_id, new.carga_horaria_horas, new.emitido_em);
  return new;
end $$;
revoke execute on function public.certificados_aplicar_ajuste() from public, anon, authenticated;

-- Matrículas sem certificado, por e-mail ou por CPF (CPF já usado em certificado ou ajuste do aluno),
-- com sugestões: nome do cadastro, CPF de outro certificado, início = matrícula, término = última aula ou prova.
drop function if exists public.admin_matriculas_sem_certificado(text);
create or replace function public.admin_matriculas_sem_certificado(p_email text default null, p_cpf text default null)
returns table (user_id uuid, email text, curso_id uuid, curso_slug text, curso_nome text, carga_horaria_horas integer,
               matriculado_em timestamptz, tem_ajuste boolean, nome_completo text, cpf text, data_inicio date, data_conclusao date)
language sql
stable
security definer
set search_path = public
as $$
  with alvo as (
    select u.id from auth.users u
    where nullif(trim(p_email), '') is not null and u.email ilike '%' || trim(p_email) || '%'
    union
    select c.user_id from certificados c
    where nullif(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g'), '') is not null and c.cpf = regexp_replace(p_cpf, '\D', '', 'g')
    union
    select a.user_id from certificados_ajustes a
    where nullif(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g'), '') is not null and a.cpf = regexp_replace(p_cpf, '\D', '', 'g')
  )
  select u.id, u.email::text, cu.id, cu.slug, cu.nome, cu.carga_horaria_horas, m.criado_em,
         a.user_id is not null,
         coalesce(nullif(a.nome_completo, ''), nullif(pf.nome, ''), nullif(u.raw_user_meta_data->>'nome', '')),
         coalesce(a.cpf, (select c2.cpf from certificados c2 where c2.user_id = u.id and c2.cpf is not null order by c2.emitido_em desc limit 1)),
         coalesce(a.data_inicio, (m.criado_em at time zone 'America/Sao_Paulo')::date),
         coalesce(a.data_conclusao, (
           select (greatest(
             (select max(p.concluida_em) from progresso_aulas p join aulas au on au.id = p.aula_id join modulos mo on mo.id = au.modulo_id
               where p.user_id = u.id and mo.curso_id = cu.id),
             (select max(t.finalizado_em) from tentativas_quiz t where t.user_id = u.id and t.curso_id = cu.id)
           ) at time zone 'America/Sao_Paulo')::date))
  from alvo
  join auth.users u on u.id = alvo.id
  join matriculas m on m.user_id = u.id
  join cursos cu on cu.id = m.curso_id
  left join certificados_ajustes a on a.user_id = u.id and a.curso_id = cu.id
  left join profiles pf on pf.id = u.id
  where not exists (select 1 from certificados c where c.user_id = u.id and c.curso_id = cu.id)
  order by m.criado_em desc
  limit 50;
$$;
revoke execute on function public.admin_matriculas_sem_certificado(text, text) from public, anon, authenticated;
grant execute on function public.admin_matriculas_sem_certificado(text, text) to service_role;

-- Certificados emitidos: inclui a data da matrícula, para sugerir o início quando o certificado não tem período.
drop function if exists public.admin_buscar_certificados(text, text);
create or replace function public.admin_buscar_certificados(p_email text default null, p_cpf text default null)
returns table (
  id uuid, codigo text, user_id uuid, email text, curso_slug text, curso_nome text,
  nome_completo text, cpf text, carga_horaria_horas integer, forma text,
  emitido_em timestamptz, data_inicio date, data_conclusao date, hash_conferencia text, matriculado_em timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.codigo, c.user_id, u.email::text, cu.slug, cu.nome,
         c.nome_completo, c.cpf, c.carga_horaria_horas, c.forma,
         c.emitido_em, c.data_inicio, c.data_conclusao, c.hash_conferencia, m.criado_em
  from certificados c
  join auth.users u on u.id = c.user_id
  join cursos cu on cu.id = c.curso_id
  left join matriculas m on m.user_id = c.user_id and m.curso_id = c.curso_id
  where (nullif(trim(p_email), '') is not null and u.email ilike '%' || trim(p_email) || '%')
     or (nullif(regexp_replace(coalesce(p_cpf, ''), '\D', '', 'g'), '') is not null
         and c.cpf = regexp_replace(p_cpf, '\D', '', 'g'))
  order by c.emitido_em desc
  limit 50;
$$;
revoke execute on function public.admin_buscar_certificados(text, text) from public, anon, authenticated;
grant execute on function public.admin_buscar_certificados(text, text) to service_role;
