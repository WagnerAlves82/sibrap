-- Revisão de segurança (21/11/2026).

-- 1) Conteúdo das aulas não fica mais aberto na API pública.
--    A política "aulas: leitura publica" (true) deixava qualquer um baixar pela chave anon o conteúdo
--    completo dos cursos PAGOS. Agora anon/authenticated leem só as colunas de lista (título, ordem,
--    duração, vídeo); objetivo, resumo, atividade e conteudo só o servidor lê, depois de conferir a
--    matrícula (src/app/minha-area/cursos/[slug]/aula/[aulaId]/page.tsx).
revoke select on public.aulas from anon, authenticated;
grant select (id, modulo_id, curso_id, titulo, descricao, youtube_id, carga_min, ordem, duracao_video_min)
  on public.aulas to anon, authenticated;

-- 2) Funções com privilégio elevado que só fazem sentido logado: visitante anônimo não executa.
do $$
declare f text;
begin
  foreach f in array array[
    'abandonar_simulado(uuid)', 'capitulo_da_questao(uuid, uuid)', 'creditar_estudo(text, text, text)',
    'creditos_saldo(uuid)', 'emitir_certificado(uuid, text, text)', 'iniciar_quiz(uuid, integer)',
    'iniciar_simulado(uuid, uuid, integer)', 'marcar_item_plano(text, text, boolean)', 'parcial_simulado(uuid)',
    'retomar_simulado(uuid)', 'salvar_resposta_simulado(uuid, uuid, text)', 'usar_dica(uuid, uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;

  -- 3) Funções internas (chamadas só por outras funções ou por gatilhos): ninguém chama pela API.
  --    horas_certificado e minutos_concluidos_hoje recebiam o id de QUALQUER usuário.
  foreach f in array array[
    'horas_certificado(uuid, uuid)', 'minutos_concluidos_hoje(uuid, uuid)',
    'atualizar_horas_certificado()', 'exigir_compra_curso_pago()', 'matricular_apos_compra_curso()'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
end $$;
