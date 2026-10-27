-- Pedido do Wagner (27/10/2026): nenhuma aula exige assistir à videoaula para seguir no curso.
-- Com ou sem vídeo, o aluno conclui 15 s depois de abrir a aula (o vídeo, quando existe, é apoio;
-- a aula também se marca sozinha quando o vídeo termina). A prova final continua com nota mínima.

create or replace function public.concluir_aula(p_aula_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_iniciada timestamptz;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  select p.iniciada_em into v_iniciada
  from progresso_aulas p
  where p.user_id = auth.uid() and p.aula_id = p_aula_id;
  if v_iniciada is null then raise exception 'Abra a aula antes de concluir'; end if;
  if extract(epoch from (now() - v_iniciada)) < 15 then
    raise exception 'Leia a aula antes de concluir. Tente de novo em alguns segundos';
  end if;
  update progresso_aulas set concluida_em = coalesce(concluida_em, now())
  where user_id = auth.uid() and aula_id = p_aula_id;
end $function$;
