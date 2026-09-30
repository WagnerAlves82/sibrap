alter table public.posts
  add column if not exists certame_tipo text,
  add column if not exists edital_numero text,
  add column if not exists retificacoes text;

comment on column public.posts.certame_tipo is 'Tipo do certame (ex.: "Concurso Público", "Processo Seletivo"), exibido em destaque no post.';
comment on column public.posts.edital_numero is 'Número/ano do edital (ex.: "Edital nº 183/2026"), exibido em destaque no post.';
comment on column public.posts.retificacoes is 'Retificações conhecidas do edital, texto livre; vazio = nenhuma até o momento.';
