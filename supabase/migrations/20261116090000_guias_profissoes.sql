-- Canal "Profissões" (16/11/2026): matérias diárias sobre profissões (o que faz, quanto ganha, o que diz a lei,
-- como começar), com oferta discreta do curso ligado. Tabela própria para não misturar com as notícias de concursos.
create table if not exists public.guias_profissoes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo text not null,
  profissao text not null,
  area text not null default 'Geral',
  resumo text not null,
  conteudo text not null,
  faq jsonb not null default '[]'::jsonb,
  cursos_slugs text[] not null default '{}',
  curso_link text,
  curso_chamada text,
  capa_path text,
  capa_url text,
  capa_credito text,
  hashtags text[] not null default '{}',
  palavras_chave text[] not null default '{}',
  seo_titulo text,
  seo_descricao text,
  status text not null default 'rascunho' check (status in ('rascunho','publicada')),
  publicado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  facebook_postado_em timestamptz,
  facebook_post_id text,
  instagram_postado_em timestamptz
);
alter table public.guias_profissoes enable row level security;
drop policy if exists "guias_profissoes_leitura_publica" on public.guias_profissoes;
create policy "guias_profissoes_leitura_publica" on public.guias_profissoes for select using (status = 'publicada');
create index if not exists guias_profissoes_publicado_idx on public.guias_profissoes (publicado_em desc) where status = 'publicada';
drop trigger if exists guias_profissoes_tocar on public.guias_profissoes;
create trigger guias_profissoes_tocar before update on public.guias_profissoes for each row execute function public.tocar_atualizado_em();
