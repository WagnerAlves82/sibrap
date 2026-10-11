-- retomar_simulado também precisa devolver questoes.dica, senão o menu de
-- ajuda perde a "Dica" quando a pessoa retoma um simulado em andamento
-- (ela só aparecia no iniciar_simulado).
drop function if exists public.retomar_simulado(uuid);

create function public.retomar_simulado(p_produto_id uuid)
returns table(tentativa_id uuid, questao_id uuid, ordem integer, disciplina_nome text, enunciado text, alternativas jsonb, diagrama_svg text, inspirada_em text, dica text, resposta text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tentativa_id uuid;
begin
  select t.id into v_tentativa_id
  from public.tentativas_simulado t
  where t.user_id = auth.uid() and t.produto_id = p_produto_id and t.finalizado_em is null
  order by t.iniciado_em desc
  limit 1;

  if v_tentativa_id is null then
    return;
  end if;

  return query
  select t.id, u.questao_id, u.ordem::integer, d.nome, q.enunciado, q.alternativas, q.diagrama_svg, q.inspirada_em, q.dica,
         t.respostas->>u.questao_id::text
  from public.tentativas_simulado t
  join lateral unnest(t.questoes_ids) with ordinality as u(questao_id, ordem) on true
  join public.questoes q on q.id = u.questao_id
  join public.disciplinas d on d.id = q.disciplina_id
  where t.id = v_tentativa_id
  order by u.ordem;
end;
$function$;
