-- Curso pago "Registre Sua Marca no INPI" (20 h), R$ 89,00 com o certificado online de 20 h incluso,
-- no mesmo modelo do Eletricista (20261115010000_curso_pago_eletricista.sql).
-- E o Suporte Especializado (R$ 59,90): serviço avulso, atendimento remoto em até 24 h corridas após o pagamento.
-- A página do suporte fica em /minha-area/cursos/registro-de-marca-inpi/suporte.

update public.cursos set certificado_por_etapas = false where slug = 'registro-de-marca-inpi';

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id)
select 'Curso — Registre Sua Marca no INPI', 'curso-registro-de-marca-inpi',
       'Curso online de 20 horas: busca, classe, GRU com desconto de MEI e protocolo no e-Marcas, com certificado com QR Code incluso.',
       8900, false, false, true, 'curso', c.id
from public.cursos c
where c.slug = 'registro-de-marca-inpi'
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, ativo = true, descricao = excluded.descricao;

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id)
select 'Certificado — Registre Sua Marca no INPI', 'certificado-registro-de-marca-inpi',
       'Certificado de conclusão (20 horas) com QR Code de validação.', 2990, false, false, true, 'curso', c.id
from public.cursos c
where c.slug = 'registro-de-marca-inpi'
on conflict (slug) do nothing;

insert into public.produto_combo_itens (produto_combo_id, produto_item_id)
select curso.id, cert.id
from public.produtos curso, public.produtos cert
where curso.slug = 'curso-registro-de-marca-inpi'
  and cert.slug = 'certificado-registro-de-marca-inpi'
  and not exists (select 1 from public.produto_combo_itens x where x.produto_combo_id = curso.id and x.produto_item_id = cert.id);

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo)
values ('Suporte Especializado — Registro de Marca', 'suporte-registro-marca',
        'Atendimento remoto (AnyDesk) para concluir um pedido de registro de marca no INPI, iniciado em até 24 horas corridas após o pagamento.',
        5990, false, false, true, 'servico')
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, descricao = excluded.descricao;
