-- NR-10 e NR-35 também vendidos separados (além da Formação Inicial para Eletricista):
-- NR-10 R$ 59,90 e NR-35 R$ 45,90, com o certificado online incluso (mesmo modelo dos cursos pagos).
update public.produtos set preco_centavos = 5990,
  descricao = 'Curso online de 40 horas com certificado com QR Code incluso.'
where slug = 'curso-nr-10-basico';
update public.produtos set preco_centavos = 4590,
  descricao = 'Curso online de 8 horas com certificado com QR Code incluso.'
where slug = 'curso-seguranca-trabalho-em-altura';

insert into public.produto_combo_itens (produto_combo_id, produto_item_id)
select curso.id, cert.id
from public.produtos curso
join public.produtos cert on cert.slug = 'certificado-' || substr(curso.slug, 7)
where curso.slug in ('curso-nr-10-basico', 'curso-seguranca-trabalho-em-altura')
  and not exists (select 1 from public.produto_combo_itens x where x.produto_combo_id = curso.id and x.produto_item_id = cert.id);
