-- Plano de estudos automático: o aluno conclui itens (capítulos da apostila) e o site
-- redistribui o que falta pelos dias que restam até a prova.
create table if not exists public.plano_progresso (
  user_id uuid not null references auth.users(id) on delete cascade,
  produto_id uuid not null references public.produtos(id) on delete cascade,
  item text not null,
  concluido_em timestamptz not null default now(),
  primary key (user_id, produto_id, item)
);

alter table public.plano_progresso enable row level security;

drop policy if exists plano_progresso_select_proprio on public.plano_progresso;
create policy plano_progresso_select_proprio on public.plano_progresso
  for select to authenticated using (user_id = auth.uid());

revoke all on public.plano_progresso from anon, authenticated;
grant select on public.plano_progresso to authenticated;

-- Marca ou desmarca um item do plano (só de quem comprou a apostila); concluir rende o crédito de estudo do cronograma.
create or replace function public.marcar_item_plano(p_slug text, p_item text, p_concluido boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_produto uuid;
begin
  if v_user is null then
    raise exception 'Não autenticado';
  end if;
  if p_item is null or p_item !~ '^cap[0-9]{1,3}$' then
    raise exception 'Item inválido';
  end if;

  select a.produto_id into v_produto from public.apostilas a where a.slug = p_slug;
  if v_produto is null or not exists (select 1 from public.acessos x where x.user_id = v_user and x.produto_id = v_produto) then
    raise exception 'Sem acesso a esse produto';
  end if;

  if p_concluido then
    insert into public.plano_progresso (user_id, produto_id, item)
    values (v_user, v_produto, p_item)
    on conflict (user_id, produto_id, item) do nothing;
  else
    delete from public.plano_progresso where user_id = v_user and produto_id = v_produto and item = p_item;
  end if;
end;
$function$;

grant execute on function public.marcar_item_plano(text, text, boolean) to authenticated;
