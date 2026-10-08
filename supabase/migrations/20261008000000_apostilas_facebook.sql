alter table public.apostilas
  add column if not exists facebook_postado_em timestamptz,
  add column if not exists facebook_post_id text;

comment on column public.apostilas.facebook_postado_em is 'Última vez que a apostila foi divulgada na Página do Facebook (rodízio: a mais antiga primeiro).';
