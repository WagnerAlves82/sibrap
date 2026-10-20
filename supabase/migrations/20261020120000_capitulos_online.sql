-- Leitor de capítulos online: o texto das apostilas no AVA e a ligação questão -> capítulo/seção.
create table if not exists public.apostila_capitulos (
  id uuid primary key default gen_random_uuid(),
  apostila_id uuid not null references public.apostilas(id) on delete cascade,
  numero integer not null,
  titulo text not null,
  secoes jsonb not null default '[]'::jsonb,
  html text not null,
  criado_em timestamptz not null default now(),
  unique (apostila_id, numero)
);

alter table public.apostila_capitulos enable row level security;

-- Só lê quem comprou a apostila (tem acesso ao produto dela).
drop policy if exists apostila_capitulos_select_com_acesso on public.apostila_capitulos;
create policy apostila_capitulos_select_com_acesso on public.apostila_capitulos
  for select to authenticated
  using (exists (
    select 1 from public.apostilas ap
    join public.acessos ac on ac.produto_id = ap.produto_id
    where ap.id = apostila_capitulos.apostila_id and ac.user_id = auth.uid()
  ));

revoke all on public.apostila_capitulos from anon, authenticated;
grant select on public.apostila_capitulos to authenticated;

-- Ligação da questão ao capítulo (número) e à seção (âncora, ex.: s22-4) da apostila.
alter table public.questoes add column if not exists capitulo integer;
alter table public.questoes add column if not exists capitulo_secao text;

-- Capítulo e seção de uma questão do simulado do próprio aluno.
create or replace function public.capitulo_da_questao(p_produto_id uuid, p_questao_id uuid)
returns table(numero integer, secao text)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if not exists (select 1 from public.acessos a where a.user_id = auth.uid() and a.produto_id = p_produto_id) then
    raise exception 'Sem acesso a esse produto';
  end if;
  if not exists (
    select 1 from public.tentativas_simulado t
    where t.user_id = auth.uid() and t.produto_id = p_produto_id and p_questao_id = any(t.questoes_ids)
  ) then
    return;
  end if;
  return query
  select q.capitulo, q.capitulo_secao from public.questoes q
  where q.id = p_questao_id and q.capitulo is not null;
end;
$function$;

grant execute on function public.capitulo_da_questao(uuid, uuid) to authenticated;
