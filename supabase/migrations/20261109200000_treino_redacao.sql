-- Treinamento de Redação com IA (Claude Haiku 5.5).
-- Quem comprou apostila de concurso com redação ganha 6 correções; o pacote "+5 correções" (R$ 6,90)
-- pode ser comprado várias vezes. Saldo = 6 + 5 × pacotes pagos − redações corrigidas (sem tabela de saldo).

-- 1) quais apostilas têm prova de redação (e a escala da nota da banca)
alter table public.apostilas add column if not exists tem_redacao boolean not null default false;
alter table public.apostilas add column if not exists redacao_nota_max integer;
update public.apostilas set tem_redacao = true, redacao_nota_max = 40 where slug = 'pmsp-soldado';
update public.apostilas set tem_redacao = true, redacao_nota_max = 20 where slug = 'pmsc-soldado';
update public.apostilas set tem_redacao = true, redacao_nota_max = 30 where slug = 'sead-ap-assistente-administrativo';

-- 2) produto do pacote extra (tipo 'servico': não pede concurso nem curso)
insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo)
values ('Pacote +5 correções de redação', 'redacao-extra-5',
        'Mais 5 correções no Treinamento de Redação do SIBRAP', 690, false, false, true, 'servico')
on conflict (slug) do nothing;

-- 3) redações do aluno
create table if not exists public.redacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  apostila_id uuid references public.apostilas(id) on delete set null,
  tema text not null,
  texto text not null default '',
  modo text not null default 'treino' check (modo in ('treino', 'simulado')),
  status text not null default 'rascunho' check (status in ('rascunho', 'corrigida')),
  nota numeric(5, 2),
  nota_max integer,
  avaliacao jsonb,
  sugestoes_usadas integer not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  corrigida_em timestamptz
);
create index if not exists redacoes_user_idx on public.redacoes (user_id, criado_em desc);

alter table public.redacoes enable row level security;
-- o aluno só lê as próprias redações; toda escrita passa pelo servidor (chave de serviço),
-- que confere login, saldo e limite de uso antes de chamar a IA
drop policy if exists "redacoes: dono le" on public.redacoes;
create policy "redacoes: dono le" on public.redacoes for select using (auth.uid() = user_id);

-- 4) saldo de correções do usuário (null = não tem apostila com redação)
create or replace function public.saldo_redacao(p_user uuid)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select case
    when not exists (
      select 1 from acessos ac join apostilas a on a.produto_id = ac.produto_id
      where ac.user_id = p_user and a.tem_redacao
    ) then null
    else 6
      + 5 * (select count(*) from pedidos pe join produtos pr on pr.id = pe.produto_id
             where pe.user_id = p_user and pe.status = 'aprovado' and pr.slug = 'redacao-extra-5')::integer
      - (select count(*) from redacoes r where r.user_id = p_user and r.status = 'corrigida')::integer
  end;
$$;
revoke all on function public.saldo_redacao(uuid) from public, anon, authenticated;

-- 5) o pacote extra pode ser comprado de novo (os demais produtos continuam com compra única)
create or replace function public.criar_pedido_por_slug(p_slug text)
 returns table(pedido_id uuid, produto_nome text, valor_centavos integer)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_user uuid := auth.uid(); v_produto record; v_pedido uuid; v_horas integer;
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
  insert into pedidos (user_id, produto_id, valor_centavos, status)
  values (v_user, v_produto.id, v_produto.preco_centavos, 'pendente')
  returning id into v_pedido;
  return query select v_pedido, v_produto.nome, v_produto.preco_centavos;
end $function$;
