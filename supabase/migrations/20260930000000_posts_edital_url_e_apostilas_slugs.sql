alter table public.posts
  add column if not exists edital_url text,
  add column if not exists apostilas_slugs text[] not null default '{}';

comment on column public.posts.edital_url is 'Link do edital oficial (https://...), exibido no fim do post.';
comment on column public.posts.apostilas_slugs is 'Slugs das apostilas indicadas no fim do post; vazio = escolha automática por órgão/cargo.';
