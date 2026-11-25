-- Curso pago "Segurança Digital na Prática" (20 h), R$ 39,90 com o certificado online de 20 h incluso,
-- no mesmo modelo do Registro de Marca (20261116200000_curso_registro_marca.sql).
-- Suporte Especializado (R$ 89,90): serviço EXTRA, opcional e pago à parte, NÃO incluso no curso
-- (limpeza por acesso remoto). Wagner, 25/11/2026.

update public.cursos set certificado_por_etapas = false where slug = 'seguranca-digital-na-pratica';

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id)
select 'Curso — Segurança Digital na Prática', 'curso-seguranca-digital-na-pratica',
       'Curso online de 20 horas: encontre e remova o que abre sites impróprios sozinho, sem formatar, com certificado com QR Code incluso.',
       3990, false, false, true, 'curso', c.id
from public.cursos c
where c.slug = 'seguranca-digital-na-pratica'
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, ativo = true, descricao = excluded.descricao;

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id)
select 'Certificado — Segurança Digital na Prática', 'certificado-seguranca-digital-na-pratica',
       'Certificado de conclusão (20 horas) com QR Code de validação.', 2990, false, false, true, 'curso', c.id
from public.cursos c
where c.slug = 'seguranca-digital-na-pratica'
on conflict (slug) do nothing;

insert into public.produto_combo_itens (produto_combo_id, produto_item_id)
select curso.id, cert.id
from public.produtos curso, public.produtos cert
where curso.slug = 'curso-seguranca-digital-na-pratica'
  and cert.slug = 'certificado-seguranca-digital-na-pratica'
  and not exists (select 1 from public.produto_combo_itens x where x.produto_combo_id = curso.id and x.produto_item_id = cert.id);

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo)
values ('Suporte Especializado — Segurança Digital', 'suporte-seguranca-digital',
        'Serviço extra e opcional, não incluso no curso: limpeza por acesso remoto do vírus que abre sites sozinho.',
        8990, false, false, true, 'servico')
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, descricao = excluded.descricao;
