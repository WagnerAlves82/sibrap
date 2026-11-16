-- Cupons por escopo: além das apostilas, agora há cupom só para certificados de curso.
-- Campanha "Esquenta Fim de Ano" (pedido do Wagner, 16/11/2026): ESQUENTA10 = 10% em qualquer certificado
-- (online, impresso, por carga horária e upgrades), até 22/11/2026. Só vale se o aluno digitar o cupom.

alter table public.cupons add column if not exists escopo text not null default 'apostilas';
alter table public.cupons drop constraint if exists cupons_escopo_check;
alter table public.cupons add constraint cupons_escopo_check check (escopo in ('apostilas', 'certificados'));

create or replace function public.percentual_cupom(p_cupom text, p_produto uuid)
returns numeric
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare v_pct numeric; v_escopo text;
begin
  select percentual, escopo into v_pct, v_escopo from cupons
  where codigo = lower(trim(p_cupom)) and ativo
    and (valido_ate is null or valido_ate >= (now() at time zone 'America/Sao_Paulo')::date);
  if v_pct is null then raise exception 'Cupom inválido ou expirado'; end if;
  if v_escopo = 'certificados' then
    if not exists (select 1 from produtos where id = p_produto and slug like 'certificado-%') then
      raise exception 'Este cupom vale só para certificados de cursos';
    end if;
  elsif not cupom_vale_para_produto(p_produto) then
    raise exception 'Este cupom vale só para apostilas';
  end if;
  return v_pct;
end $$;
revoke all on function public.percentual_cupom(text, uuid) from public, anon, authenticated;

insert into public.cupons (codigo, percentual, valido_ate, escopo)
values ('esquenta10', 10, '2026-11-22', 'certificados')
on conflict (codigo) do update set percentual = excluded.percentual, valido_ate = excluded.valido_ate, escopo = excluded.escopo, ativo = true;
