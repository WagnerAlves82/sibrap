-- Formação Profissional em Portaria e Condomínios (Wagner, 25/11/2026): landing /cursos/formacao-portaria, fora da vitrine.
-- Cursos gratuitos; a formação vende os 3 certificados de carga completa por R$ 89,90 (separados R$ 109,70).
-- Produto tipo 'servico' (não preso a um curso). Ao aprovar, conceder_acesso_apos_pagamento libera os itens do combo;
-- a página /minha-area/formacao-portaria matricula o aluno nos 3 cursos (matricular_curso).
-- Pré-requisito: os certificados dos 2 cursos novos já criados (criar-curso.mjs com RASCUNHO=0).
insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo)
values ('Formação Profissional em Portaria e Condomínios', 'formacao-portaria',
        'Agente de Portaria (60 h) + Informática para Portaria e Condomínios (40 h) + LGPD na Prática (20 h), com os 3 certificados. PIX ou cartão em até 3x.',
        8990, false, false, true, 'servico')
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, descricao = excluded.descricao, ativo = true;

insert into public.produto_combo_itens (produto_combo_id, produto_item_id)
select f.id, item.id
from public.produtos f
join public.produtos item on item.slug in (
  'certificado-agente-de-portaria',
  'certificado-informatica-para-portaria-e-condominios',
  'certificado-lgpd-na-pratica'
)
where f.slug = 'formacao-portaria'
  and not exists (select 1 from public.produto_combo_itens x where x.produto_combo_id = f.id and x.produto_item_id = item.id);
