alter table public.posts
  add column if not exists hashtags text[] not null default '{}',
  add column if not exists palavras_chave text[] not null default '{}',
  add column if not exists seo_titulo text,
  add column if not exists seo_descricao text;

comment on column public.posts.hashtags is 'Hashtags da matéria para o post do Facebook (com #, sem espaços), da mais específica à mais geral.';
comment on column public.posts.palavras_chave is 'Palavras-chave de busca (meta keywords e JSON-LD), em minúsculas.';
comment on column public.posts.seo_titulo is 'Título da página para buscadores (até ~60 caracteres). Vazio = usa o título da matéria.';
comment on column public.posts.seo_descricao is 'Meta description (até ~155 caracteres). Vazio = usa o resumo.';
