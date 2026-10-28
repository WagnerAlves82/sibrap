-- 1) Conteúdo interativo das aulas (cards que viram, abas, diálogos, áudios, exercícios), em blocos JSON.
--    As aulas antigas continuam só com objetivo/resumo/atividade; o campo é opcional.
alter table public.aulas add column if not exists conteudo jsonb;

-- 2) Pesquisa de satisfação ao final do curso, respondida antes de emitir o certificado.
--    7 perguntas: satisfação, clareza, material, exercícios, duração, aplicação e recomendação (0 a 10).
create table if not exists public.pesquisas_satisfacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  curso_id uuid not null references public.cursos (id) on delete cascade,
  satisfacao smallint not null check (satisfacao between 1 and 5),
  clareza smallint not null check (clareza between 1 and 5),
  material smallint not null check (material between 1 and 5),
  exercicios smallint not null check (exercicios between 1 and 5),
  duracao text not null check (duracao in ('curta', 'adequada', 'longa')),
  aplicacao smallint not null check (aplicacao between 1 and 5),
  recomendacao smallint not null check (recomendacao between 0 and 10),
  comentario text check (comentario is null or length(comentario) <= 1000),
  criado_em timestamptz not null default now(),
  unique (user_id, curso_id)
);

alter table public.pesquisas_satisfacao enable row level security;

-- o aluno vê e responde só a própria pesquisa, e só de curso em que está matriculado
drop policy if exists "pesquisas_select_propria" on public.pesquisas_satisfacao;
create policy "pesquisas_select_propria" on public.pesquisas_satisfacao
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "pesquisas_insert_propria" on public.pesquisas_satisfacao;
create policy "pesquisas_insert_propria" on public.pesquisas_satisfacao
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.matriculas m where m.user_id = auth.uid() and m.curso_id = pesquisas_satisfacao.curso_id)
  );

revoke all on public.pesquisas_satisfacao from anon;
grant select, insert on public.pesquisas_satisfacao to authenticated;
