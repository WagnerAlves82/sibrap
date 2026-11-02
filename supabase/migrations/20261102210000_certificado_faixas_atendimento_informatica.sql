-- Atendimento ao Cliente (passa a 40 h) e Informática Básica com IA (40 h): certificado de 20, 30 ou 40 h,
-- mesmos preços do Auxiliar Administrativo; quem já comprou fica com a carga completa.
-- (aplicada pelo MCP em 02/11/2026; mesmo conteúdo)
do $$
declare v record;
begin
  for v in select id, slug, nome from cursos where slug in ('atendimento-ao-cliente', 'informatica-basica-ia') loop
    update cursos set carga_horaria_horas = 40 where id = v.id;
    update produtos set certificado_horas = 40, preco_centavos = 3990, nome = 'Certificado ' || v.nome || ' – 40 horas'
      where slug = 'certificado-' || v.slug;
    update produtos set certificado_horas = 40 where slug = 'certificado-impresso-' || v.slug;
    insert into produtos (slug, nome, descricao, preco_centavos, curso_id, tipo, ativo, inclui_apostila, inclui_simulado, certificado_horas, certificado_requer_horas)
    values
      ('certificado-' || v.slug || '-20h', 'Certificado ' || v.nome || ' – 20 horas', 'Certificado online (PDF) com 20 horas e QR Code de validação.', 2990, v.id, 'curso', true, false, false, 20, null),
      ('certificado-' || v.slug || '-30h', 'Certificado ' || v.nome || ' – 30 horas', 'Certificado online (PDF) com 30 horas e QR Code de validação.', 3490, v.id, 'curso', true, false, false, 30, null),
      ('certificado-' || v.slug || '-upgrade-20h-30h', 'Upgrade do certificado ' || v.nome || ': 20 h para 30 h', 'Diferença para passar o certificado de 20 para 30 horas.', 500, v.id, 'curso', true, false, false, 30, 20),
      ('certificado-' || v.slug || '-upgrade-20h-40h', 'Upgrade do certificado ' || v.nome || ': 20 h para 40 h', 'Diferença para passar o certificado de 20 para 40 horas.', 1000, v.id, 'curso', true, false, false, 40, 20),
      ('certificado-' || v.slug || '-upgrade-30h-40h', 'Upgrade do certificado ' || v.nome || ': 30 h para 40 h', 'Diferença para passar o certificado de 30 para 40 horas.', 500, v.id, 'curso', true, false, false, 40, 30)
    on conflict (slug) do nothing;
    update certificados set carga_horaria_horas = 40 where curso_id = v.id and carga_horaria_horas < 40;
  end loop;
end $$;
