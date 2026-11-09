-- Cupons de desconto (Black Friday: VOUPASSAR = 6,18% nas apostilas).
-- O desconto só entra quando o cliente digita o cupom; o preço final é calculado aqui no banco.

create table if not exists public.cupons (
  codigo text primary key check (codigo = lower(codigo)),
  percentual numeric(5, 2) not null check (percentual > 0 and percentual < 100),
  ativo boolean not null default true,
  valido_ate date,
  criado_em timestamptz not null default now()
);
alter table public.cupons enable row level security; -- sem políticas: só o servidor lê

insert into public.cupons (codigo, percentual) values ('voupassar', 6.18) on conflict (codigo) do nothing;

alter table public.pedidos add column if not exists cupom text;

-- O cupom vale para apostilas (e o combo apostila + extras), não para cursos, certificados e serviços.
create or replace function public.cupom_vale_para_produto(p_produto uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (select 1 from apostilas a where a.produto_id = p_produto)
      or exists (
        select 1 from produtos c join produtos base on base.slug = 'apostila-' || substr(c.slug, 7)
        where c.id = p_produto and c.slug like 'combo-%'
      );
$$;
revoke all on function public.cupom_vale_para_produto(uuid) from public, anon, authenticated;

-- Percentual do cupom para o produto, ou erro com mensagem amigável.
create or replace function public.percentual_cupom(p_cupom text, p_produto uuid)
returns numeric
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare v_pct numeric;
begin
  select percentual into v_pct from cupons
  where codigo = lower(trim(p_cupom)) and ativo
    and (valido_ate is null or valido_ate >= (now() at time zone 'America/Sao_Paulo')::date);
  if v_pct is null then raise exception 'Cupom inválido ou expirado'; end if;
  if not cupom_vale_para_produto(p_produto) then raise exception 'Este cupom vale só para apostilas'; end if;
  return v_pct;
end $$;
revoke all on function public.percentual_cupom(text, uuid) from public, anon, authenticated;

drop function if exists public.criar_pedido_por_slug(text);
create function public.criar_pedido_por_slug(p_slug text, p_cupom text default null)
 returns table(pedido_id uuid, produto_nome text, valor_centavos integer)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_user uuid := auth.uid(); v_produto record; v_pedido uuid; v_horas integer;
        v_cupom text := nullif(lower(trim(coalesce(p_cupom, ''))), ''); v_valor integer;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;
  select id, nome, preco_centavos, curso_id, certificado_horas, certificado_requer_horas, slug into v_produto from produtos
  where slug = p_slug and ativo and preco_centavos > 0 limit 1;
  if v_produto.id is null then raise exception 'Produto não encontrado'; end if;
  if v_produto.slug = 'redacao-extra-5' then
    if saldo_redacao(v_user) is null then
      raise exception 'O treino de redação é liberado para quem tem apostila de concurso com redação';
    end if;
  elsif exists (select 1 from acessos where user_id = v_user and produto_id = v_produto.id) then
    raise exception 'Você já possui este produto';
  end if;
  if v_produto.certificado_horas is not null and v_produto.curso_id is not null then
    v_horas := coalesce(horas_certificado(v_user, v_produto.curso_id), 0);
    if v_horas >= v_produto.certificado_horas then
      raise exception 'Você já tem o certificado com essa carga horária';
    end if;
    if v_produto.certificado_requer_horas is not null and v_horas <> v_produto.certificado_requer_horas then
      raise exception 'Este upgrade não corresponde ao seu certificado atual';
    end if;
  end if;
  v_valor := v_produto.preco_centavos;
  if v_cupom is not null then
    v_valor := round(v_valor * (100 - percentual_cupom(v_cupom, v_produto.id)) / 100.0)::integer;
  end if;
  insert into pedidos (user_id, produto_id, valor_centavos, status, cupom)
  values (v_user, v_produto.id, v_valor, 'pendente', v_cupom)
  returning id into v_pedido;
  return query select v_pedido, v_produto.nome, v_valor;
end $function$;
revoke all on function public.criar_pedido_por_slug(text, text) from public, anon;
grant execute on function public.criar_pedido_por_slug(text, text) to authenticated, service_role;
