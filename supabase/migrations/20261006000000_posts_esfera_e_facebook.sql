alter table public.posts
  add column if not exists esfera text
    check (esfera is null or esfera in ('nacional','estadual','economia_mista','municipal')),
  add column if not exists importancia integer not null default 0,
  add column if not exists facebook_postado_em timestamptz,
  add column if not exists facebook_post_id text;

comment on column public.posts.esfera is 'Âmbito do certame: nacional, estadual, economia_mista (sociedades de economia mista) ou municipal (prefeituras).';
comment on column public.posts.importancia is 'Ajuste manual (0 a 10) para priorizar a divulgação no Facebook; soma-se ao peso da esfera.';
comment on column public.posts.facebook_postado_em is 'Quando o post foi divulgado na Página do Facebook (null = ainda não).';

create index if not exists posts_facebook_pendentes_idx
  on public.posts (publicado_em desc)
  where status = 'publicada' and facebook_postado_em is null;
