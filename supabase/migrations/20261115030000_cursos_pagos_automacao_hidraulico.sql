-- Cursos profissionalizantes pagos: Automação Residencial Inteligente (60 h) e Bombeiro Hidráulico (80 h),
-- R$ 59,90 cada, com o certificado online da carga completa incluso (mesmo modelo do Eletricista).
update public.cursos set profissionalizante = true, certificado_por_etapas = false
where slug in ('automacao-residencial-inteligente', 'bombeiro-hidraulico');

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id)
select 'Curso — ' || c.nome, 'curso-' || c.slug,
       'Curso online de ' || c.carga_horaria_horas || ' horas com apostila prática em PDF e certificado com QR Code incluso.',
       5990, false, false, true, 'curso', c.id
from public.cursos c
where c.slug in ('automacao-residencial-inteligente', 'bombeiro-hidraulico')
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, ativo = true, descricao = excluded.descricao;

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id, certificado_horas)
select 'Certificado — ' || c.nome, 'certificado-' || c.slug,
       'Certificado de conclusão (' || c.carga_horaria_horas || ' horas) com QR Code de validação.', 2990, false, false, true, 'curso', c.id, c.carga_horaria_horas
from public.cursos c
where c.slug in ('automacao-residencial-inteligente', 'bombeiro-hidraulico')
on conflict (slug) do nothing;

insert into public.produto_combo_itens (produto_combo_id, produto_item_id)
select curso.id, cert.id
from public.produtos curso
join public.produtos cert on cert.slug = 'certificado-' || substr(curso.slug, 7)
where curso.slug in ('curso-automacao-residencial-inteligente', 'curso-bombeiro-hidraulico')
  and not exists (select 1 from public.produto_combo_itens x where x.produto_combo_id = curso.id and x.produto_item_id = cert.id);
