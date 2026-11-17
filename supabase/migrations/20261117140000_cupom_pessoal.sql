-- Cupom pessoal (17/11/2026): cupom ligado a um e-mail, aplicado sozinho na compra do certificado
-- e recusado para qualquer outra conta. Primeiro uso: 10% para jusapavine@gmail.com até segunda, 23/11/2026.
alter table public.cupons add column if not exists email text;

create or replace function public.percentual_cupom(p_cupom text, p_produto uuid)
returns numeric
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare v_pct numeric; v_escopo text; v_email text;
begin
  select percentual, escopo, email into v_pct, v_escopo, v_email from cupons
  where codigo = lower(trim(p_cupom)) and ativo
    and (valido_ate is null or valido_ate >= (now() at time zone 'America/Sao_Paulo')::date);
  if v_pct is null then raise exception 'Cupom inválido ou expirado'; end if;
  -- cupom pessoal: na criação do pedido (com usuário logado) só vale para a conta do e-mail do cupom
  if v_email is not null and auth.uid() is not null
     and not exists (select 1 from auth.users where id = auth.uid() and lower(email) = lower(v_email)) then
    raise exception 'Cupom inválido ou expirado';
  end if;
  if v_escopo = 'certificados' then
    if not exists (select 1 from produtos where id = p_produto and slug like 'certificado-%') then
      raise exception 'Este cupom vale só para certificados de cursos';
    end if;
  elsif not cupom_vale_para_produto(p_produto) then
    raise exception 'Este cupom vale só para apostilas';
  end if;
  return v_pct;
end $function$;

insert into public.cupons (codigo, percentual, ativo, valido_ate, escopo, email)
values ('presente10', 10, true, '2026-11-23', 'certificados', 'jusapavine@gmail.com')
on conflict (codigo) do update set percentual = excluded.percentual, ativo = true,
  valido_ate = excluded.valido_ate, escopo = excluded.escopo, email = excluded.email;

-- Wagner (17/11): o desconto pessoal vale só no PIX. Cupons com so_pix não são aceitos no cartão
-- (pagarComCartaoAction cobra o preço cheio) e a tela mostra o preço cheio na opção cartão.
alter table public.cupons add column if not exists so_pix boolean not null default false;
update public.cupons set so_pix = true where codigo = 'presente10';
