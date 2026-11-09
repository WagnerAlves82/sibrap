-- O bônus de redação vale até o dia da prova do concurso da apostila (horário de Brasília).
-- Depois disso saldo_redacao devolve null (módulo indisponível) e o pacote extra não pode ser comprado.
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
        and (a.data_prova is null or a.data_prova >= (now() at time zone 'America/Sao_Paulo')::date)
    ) then null
    else 6
      + 5 * (select count(*) from pedidos pe join produtos pr on pr.id = pe.produto_id
             where pe.user_id = p_user and pe.status = 'aprovado' and pr.slug = 'redacao-extra-5')::integer
      - (select count(*) from redacoes r where r.user_id = p_user and r.status = 'corrigida')::integer
  end;
$$;
revoke all on function public.saldo_redacao(uuid) from public, anon, authenticated;
