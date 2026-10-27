-- Aula sem vídeo (cursos só em texto, como Auxiliar Administrativo e Estoque): o aluno ficava preso.
-- A regra pedia 60 s de aula aberta e respondia "Assista à aula até o fim", mas não havia vídeo
-- para assistir. Agora:
--  * aula com vídeo: igual a antes (60% da duração do vídeo, no mínimo 60 s);
--  * aula sem vídeo: 15 s depois de abrir, com mensagem de leitura.
-- A prova final (nota mínima) continua sendo a garantia de que a pessoa estudou.

create or replace function public.concluir_aula(p_aula_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_iniciada timestamptz; v_dur integer; v_video text; v_min_seg numeric;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  select p.iniciada_em, a.duracao_video_min, a.youtube_id into v_iniciada, v_dur, v_video
  from progresso_aulas p join aulas a on a.id = p.aula_id
  where p.user_id = auth.uid() and p.aula_id = p_aula_id;
  if v_iniciada is null then raise exception 'Abra a aula antes de concluir'; end if;

  if v_video is null then
    if extract(epoch from (now() - v_iniciada)) < 15 then
      raise exception 'Leia o resumo e a atividade antes de concluir. Tente de novo em alguns segundos';
    end if;
  else
    v_min_seg := greatest(60, coalesce(v_dur, 0) * 60 * 0.6);
    if extract(epoch from (now() - v_iniciada)) < v_min_seg then
      raise exception 'Assista ao vídeo até o fim para concluir';
    end if;
  end if;

  update progresso_aulas set concluida_em = coalesce(concluida_em, now())
  where user_id = auth.uid() and aula_id = p_aula_id;
end $function$;
