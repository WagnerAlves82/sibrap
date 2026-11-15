-- Curso pago: Eletricista Residencial Básico, R$ 59,90, com o certificado online de 40 h incluso.
-- Mesmo modelo do curso de celulares (20261027180000_curso_pago_celular.sql): produto 'curso-<slug>'
-- trava a matrícula até o pagamento e libera o certificado pelo produto_combo_itens.
-- Sem certificado por etapas: a carga é a completa.

update public.cursos set certificado_por_etapas = false where slug = 'eletricista-residencial-basico';

delete from public.quiz_questoes
where etapa_horas is not null
  and curso_id = (select id from public.cursos where slug = 'eletricista-residencial-basico');

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id)
select 'Curso — Eletricista Residencial Básico', 'curso-eletricista-residencial-basico',
       'Curso online de 40 horas com apostila prática em PDF e certificado com QR Code incluso.',
       5990, false, false, true, 'curso', c.id
from public.cursos c
where c.slug = 'eletricista-residencial-basico'
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, ativo = true, descricao = excluded.descricao;

-- certificado online (o que o combo libera); criado aqui para não depender da ordem do criar-curso.mjs
insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id, certificado_horas)
select 'Certificado — Eletricista Residencial Básico', 'certificado-eletricista-residencial-basico',
       'Certificado de conclusão (40 horas) com QR Code de validação.', 2990, false, false, true, 'curso', c.id, 40
from public.cursos c
where c.slug = 'eletricista-residencial-basico'
on conflict (slug) do nothing;

insert into public.produto_combo_itens (produto_combo_id, produto_item_id)
select curso.id, cert.id
from public.produtos curso, public.produtos cert
where curso.slug = 'curso-eletricista-residencial-basico'
  and cert.slug = 'certificado-eletricista-residencial-basico'
  and not exists (select 1 from public.produto_combo_itens x where x.produto_combo_id = curso.id and x.produto_item_id = cert.id);
