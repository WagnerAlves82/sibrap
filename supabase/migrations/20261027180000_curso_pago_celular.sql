-- Curso pago: Conserto e Manutenção de Celulares, R$ 54,90 (os demais cursos seguem gratuitos; só o certificado é pago).
-- Regra geral: um curso é PAGO quando existe produto ativo 'curso-<slug>' ligado a ele.
--  * a matrícula só é aceita para quem tem acesso a esse produto (trava no banco, não só na tela);
--  * ao liberar o acesso (pagamento aprovado), o aluno já fica matriculado;
--  * a compra inclui o certificado online (produto_combo_itens: curso -> certificado-<slug>).

insert into public.produtos (nome, slug, descricao, preco_centavos, inclui_apostila, inclui_simulado, ativo, tipo, curso_id)
select 'Curso — Conserto e Manutenção de Celulares', 'curso-conserto-e-manutencao-de-celulares',
       'Acesso ao curso de 40 horas, com certificado online incluso.', 5490, false, false, true, 'curso', c.id
from public.cursos c
where c.slug = 'conserto-e-manutencao-de-celulares'
on conflict (slug) do update set preco_centavos = excluded.preco_centavos, ativo = true, curso_id = excluded.curso_id;

insert into public.produto_combo_itens (produto_combo_id, produto_item_id)
select curso.id, cert.id
from public.produtos curso
join public.produtos cert on cert.slug = 'certificado-' || substr(curso.slug, 7)
where curso.slug = 'curso-conserto-e-manutencao-de-celulares'
  and not exists (select 1 from public.produto_combo_itens x where x.produto_combo_id = curso.id and x.produto_item_id = cert.id);

create or replace function public.exigir_compra_curso_pago()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if exists (select 1 from produtos p where p.curso_id = new.curso_id and p.slug like 'curso-%' and p.ativo)
     and not exists (
       select 1 from acessos a join produtos p on p.id = a.produto_id
       where a.user_id = new.user_id and p.curso_id = new.curso_id and p.slug like 'curso-%'
     ) then
    raise exception 'Este curso é pago: conclua a compra para acessar';
  end if;
  return new;
end;
$function$;

drop trigger if exists matriculas_exigir_compra on public.matriculas;
create trigger matriculas_exigir_compra before insert on public.matriculas
for each row execute function public.exigir_compra_curso_pago();

create or replace function public.matricular_apos_compra_curso()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into matriculas (user_id, curso_id)
  select new.user_id, p.curso_id from produtos p
  where p.id = new.produto_id and p.slug like 'curso-%' and p.curso_id is not null
  on conflict do nothing;
  return new;
end;
$function$;

drop trigger if exists acessos_matricular_curso on public.acessos;
create trigger acessos_matricular_curso after insert on public.acessos
for each row execute function public.matricular_apos_compra_curso();
