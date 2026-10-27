-- Gerador de currículos (fase 2): download pago depois de 1.000 currículos gerados.
--  * produto 'download-curriculo' (R$ 3,90), de um novo tipo 'servico' (consumível, não é apostila nem curso);
--  * cada pedido aprovado vale UM download: curriculo_downloads.pedido_id é único, então o mesmo
--    pagamento não baixa duas vezes. Para baixar de novo, novo pagamento.
-- O acesso em 'acessos' continua sendo criado pelo trigger de sempre (on conflict do nothing), sem efeito aqui.

alter table public.produtos drop constraint produtos_tipo_check;
alter table public.produtos add constraint produtos_tipo_check
  check (tipo = any (array['curso', 'concurso', 'apostila', 'servico']));
alter table public.produtos drop constraint produtos_origem_check;
alter table public.produtos add constraint produtos_origem_check
  check (concurso_id is not null or curso_id is not null or tipo in ('apostila', 'servico'));

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo)
values ('Download do currículo em PDF', 'download-curriculo', 'Um download do currículo montado no gerador do SIBRAP.', 390, false, false, true, 'servico')
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, ativo = true, tipo = 'servico';

alter table public.curriculo_downloads add column pedido_id uuid unique references public.pedidos(id);
