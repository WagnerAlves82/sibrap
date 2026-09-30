-- O trigger handle_new_user() concedia acesso ao produto "simulado-gratis"
-- pra TODO cadastro novo, sem nenhuma condição. Passa a checar
-- produtos.ativo, e desativa esse produto agora — reativar depois
-- (quando o formulário próprio da isca do Transpetro existir) é só voltar
-- ativo=true, sem precisar mexer em código nem nesta function de novo.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_produto_gratis_id uuid;
begin
  insert into public.profiles (id, nome)
  values (new.id, new.raw_user_meta_data->>'nome');

  select id into v_produto_gratis_id
  from public.produtos
  where slug = 'simulado-gratis' and ativo
  limit 1;

  if v_produto_gratis_id is not null then
    insert into public.acessos (user_id, produto_id)
    values (new.id, v_produto_gratis_id)
    on conflict (user_id, produto_id) do nothing;
  end if;

  return new;
end;
$function$;

update public.produtos set ativo = false where slug = 'simulado-gratis';
