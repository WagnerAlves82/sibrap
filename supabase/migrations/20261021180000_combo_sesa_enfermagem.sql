-- Combo SESA-AP Técnico em Enfermagem: apostila + videoaulas (Informática e Legislação do SUS), R$ 54,90.
-- Comprar o combo concede também o acesso à apostila correspondente (slug 'combo-X' -> 'apostila-X').

insert into public.produtos (concurso_id, cargo_id, nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo)
select concurso_id, cargo_id,
       'Combo — Técnico em Enfermagem — SESA-AP (apostila + videoaulas)',
       'combo-sesa-ap-tecnico-enfermagem',
       'Apostila em PDF com capítulos online e simulado, mais videoaulas de Informática e Legislação do SUS',
       5490, true, true, true, 'apostila'
from public.produtos
where slug = 'apostila-sesa-ap-tecnico-enfermagem'
on conflict (slug) do nothing;

create or replace function public.conceder_acesso_apos_pagamento()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status = 'aprovado' and (old.status is distinct from 'aprovado') then
    insert into public.acessos (user_id, produto_id, pedido_id)
    values (new.user_id, new.produto_id, new.id)
    on conflict (user_id, produto_id) do nothing;

    -- combo: libera também a apostila que o compõe
    insert into public.acessos (user_id, produto_id, pedido_id)
    select new.user_id, base.id, new.id
    from public.produtos combo
    join public.produtos base on base.slug = 'apostila-' || substr(combo.slug, 7)
    where combo.id = new.produto_id and combo.slug like 'combo-%'
    on conflict (user_id, produto_id) do nothing;
  end if;
  return new;
end;
$function$;

-- Videoaulas do combo, liberadas uma a uma (liberada=true + video_url preenchida) conforme forem ficando prontas.
-- Só o servidor (chave de serviço) lê esta tabela; o aluno vê o título e, se liberada, o vídeo.
create table if not exists public.combo_videoaulas (
  id uuid primary key default gen_random_uuid(),
  combo_slug text not null,
  materia text not null,
  ordem integer not null,
  titulo text not null,
  video_url text,
  liberada boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (combo_slug, materia, ordem)
);
alter table public.combo_videoaulas enable row level security;

insert into public.combo_videoaulas (combo_slug, materia, ordem, titulo)
select 'sesa-ap-tecnico-enfermagem', m.materia, n, 'Videoaula ' || n
from (values ('Informática'), ('Legislação do SUS')) as m(materia), generate_series(1, 5) as n
on conflict do nothing;
