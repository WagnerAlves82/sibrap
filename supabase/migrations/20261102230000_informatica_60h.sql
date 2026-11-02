-- Informática Básica com IA passa a 60 h: certificado de 20, 40 ou 60 h (R$ 29,90 / 34,90 / 39,90),
-- como o de Agente de Portaria. Quem já comprou o certificado completo fica com 60 h.
-- Saem a faixa de 30 h e os upgrades que envolvem 30 h (ninguém comprou); entram 40 h e os upgrades para 60 h.
do $$
declare v record;
begin
  select id, slug, nome into v from cursos where slug = 'informatica-basica-ia';
  update cursos set carga_horaria_horas = 60 where id = v.id;
  -- as aulas somavam 40 h; a carga de cada uma sobe na mesma proporção
  update aulas set carga_min = carga_min * 3 / 2 where curso_id = v.id;

  update produtos set certificado_horas = 60, preco_centavos = 3990, nome = 'Certificado ' || v.nome || ' – 60 horas',
    descricao = 'Certificado online (PDF) com 60 horas e QR Code de validação.'
    where slug = 'certificado-' || v.slug;
  update produtos set certificado_horas = 60 where slug = 'certificado-impresso-' || v.slug;
  update produtos set ativo = false where slug in (
    'certificado-' || v.slug || '-30h',
    'certificado-' || v.slug || '-upgrade-20h-30h',
    'certificado-' || v.slug || '-upgrade-30h-40h');

  insert into produtos (slug, nome, descricao, preco_centavos, curso_id, tipo, ativo, inclui_apostila, inclui_simulado, certificado_horas, certificado_requer_horas)
  values
    ('certificado-' || v.slug || '-40h', 'Certificado ' || v.nome || ' – 40 horas', 'Certificado online (PDF) com 40 horas e QR Code de validação.', 3490, v.id, 'curso', true, false, false, 40, null),
    ('certificado-' || v.slug || '-upgrade-20h-60h', 'Upgrade do certificado ' || v.nome || ': 20 h para 60 h', 'Diferença para passar o certificado de 20 para 60 horas.', 1000, v.id, 'curso', true, false, false, 60, 20),
    ('certificado-' || v.slug || '-upgrade-40h-60h', 'Upgrade do certificado ' || v.nome || ': 40 h para 60 h', 'Diferença para passar o certificado de 40 para 60 horas.', 500, v.id, 'curso', true, false, false, 60, 40)
  on conflict (slug) do nothing;
  -- 20 h → 40 h continua, agora pela diferença de R$ 5 (40 h deixou de ser a carga máxima)
  update produtos set preco_centavos = 500 where slug = 'certificado-' || v.slug || '-upgrade-20h-40h';

  update certificados set carga_horaria_horas = 60 where curso_id = v.id and carga_horaria_horas = 40;
end $$;
