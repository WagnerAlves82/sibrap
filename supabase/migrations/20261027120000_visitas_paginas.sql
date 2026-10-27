-- Contador de visitas por página (cursos). O total só é exibido no site a partir de 1.000 visitas.
-- Gravação só pela chave de serviço (rota /api/visita, com limite por IP); leitura pública do total.
create table if not exists public.visitas_paginas (
  caminho text primary key,
  total bigint not null default 0,
  atualizado_em timestamptz not null default now()
);

alter table public.visitas_paginas enable row level security;

drop policy if exists "visitas_paginas_leitura_publica" on public.visitas_paginas;
create policy "visitas_paginas_leitura_publica" on public.visitas_paginas for select using (true);

revoke all on public.visitas_paginas from anon, authenticated;
grant select on public.visitas_paginas to anon, authenticated;

create or replace function public.registrar_visita(p_caminho text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  novo bigint;
begin
  if p_caminho is null or length(p_caminho) > 200 or p_caminho !~ '^/[a-z0-9/_-]*$' then
    return null;
  end if;
  insert into public.visitas_paginas as v (caminho, total, atualizado_em)
  values (p_caminho, 1, now())
  on conflict (caminho) do update set total = v.total + 1, atualizado_em = now()
  returning v.total into novo;
  return novo;
end;
$$;

revoke all on function public.registrar_visita(text) from public, anon, authenticated;
grant execute on function public.registrar_visita(text) to service_role;
