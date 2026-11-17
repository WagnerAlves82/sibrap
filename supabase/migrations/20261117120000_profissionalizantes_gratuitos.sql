-- Cursos profissionalizantes, NR-10 e NR-35 passam a ser gratuitos (Wagner, 17/11/2026):
-- o produto 'curso-<slug>' sai de venda (sem ele o curso é gratuito, ver src/lib/curso-pago.ts)
-- e só o certificado online é pago. A apostila prática em PDF acompanha o certificado.
update produtos set ativo = false
where slug in (
  'curso-eletricista-residencial-basico',
  'curso-automacao-residencial-inteligente',
  'curso-bombeiro-hidraulico',
  'curso-nr-10-basico',
  'curso-seguranca-trabalho-em-altura'
);

update produtos set preco_centavos = 5490
where slug in (
  'certificado-eletricista-residencial-basico',
  'certificado-automacao-residencial-inteligente',
  'certificado-bombeiro-hidraulico'
);
update produtos set preco_centavos = 4990, certificado_horas = 40 where slug = 'certificado-nr-10-basico';
update produtos set preco_centavos = 3590, certificado_horas = 8 where slug = 'certificado-seguranca-trabalho-em-altura';

-- Formação Inicial para Eletricista: R$ 89,00 por enquanto (PIX e cartão)
update produtos set preco_centavos = 8900 where slug in ('formacao-eletricista', 'formacao-eletricista-cartao');
