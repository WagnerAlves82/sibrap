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
