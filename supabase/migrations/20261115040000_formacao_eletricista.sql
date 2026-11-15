-- Formação Inicial para Eletricista: Eletricista Residencial Básico + NR-10 Básico + preparatório NR-35.
-- Dois produtos (tipo 'servico': não ficam presos a um curso só) com o mesmo conteúdo (o cartão usa o seu, com o preço cheio):
--   formacao-eletricista         R$ 129,90 (PIX, promoção até 31/12/2026; depois o site usa o do cartão também no PIX)
--   formacao-eletricista-cartao  R$ 149,90 (cartão em até 3x sem juros)
-- Ao aprovar o pagamento, conceder_acesso_apos_pagamento libera os itens de produto_combo_itens:
-- os 3 produtos curso-* (o trigger acessos_matricular_curso já matricula) e os 3 certificados.

-- os dois cursos novos são pagos (vendidos só dentro da formação) e seguem a regra dos profissionalizantes
update public.cursos set profissionalizante = true, certificado_por_etapas = false
where slug in ('nr-10-basico', 'seguranca-trabalho-em-altura');

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id)
select 'Curso — ' || c.nome, 'curso-' || c.slug,
       'Curso online de ' || c.carga_horaria_horas || ' horas com certificado com QR Code incluso. Vendido na Formação Inicial para Eletricista.',
       14990, false, false, true, 'curso', c.id
from public.cursos c
where c.slug in ('nr-10-basico', 'seguranca-trabalho-em-altura')
on conflict (slug) do update set ativo = true, curso_id = excluded.curso_id, descricao = excluded.descricao;

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo)
values
  ('Formação Inicial para Eletricista', 'formacao-eletricista',
   'Eletricista Residencial Básico (40 h) + NR-10 Básico (40 h) + Segurança no Trabalho em Altura (8 h), com os 3 certificados. Pagamento no PIX.',
   12990, false, false, true, 'servico'),
  ('Formação Inicial para Eletricista (cartão)', 'formacao-eletricista-cartao',
   'Eletricista Residencial Básico (40 h) + NR-10 Básico (40 h) + Segurança no Trabalho em Altura (8 h), com os 3 certificados. Cartão em até 3x.',
   14990, false, false, true, 'servico')
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, descricao = excluded.descricao, ativo = true;

insert into public.produto_combo_itens (produto_combo_id, produto_item_id)
select f.id, item.id
from public.produtos f
join public.produtos item on item.slug in (
  'curso-eletricista-residencial-basico', 'certificado-eletricista-residencial-basico',
  'curso-nr-10-basico', 'certificado-nr-10-basico',
  'curso-seguranca-trabalho-em-altura', 'certificado-seguranca-trabalho-em-altura'
)
where f.slug in ('formacao-eletricista', 'formacao-eletricista-cartao')
  and not exists (select 1 from public.produto_combo_itens x where x.produto_combo_id = f.id and x.produto_item_id = item.id);

-- cursos visíveis (a compra é travada pelo produto curso-*; as páginas públicas levam para a formação)
update public.cursos set ativo = true where slug in ('nr-10-basico', 'seguranca-trabalho-em-altura');
