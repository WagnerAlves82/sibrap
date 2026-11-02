-- Certificado por carga horária (ex.: 20 h, 30 h ou 40 h), com upgrade pagando a diferença.
-- O curso inteiro continua aberto a todos os matriculados; muda só a carga que sai no certificado.
-- produtos.certificado_horas: horas que o produto dá ao certificado (null = carga total do curso).
-- produtos.certificado_requer_horas: produto de upgrade; só pode ser comprado por quem já tem essa carga.

alter table public.produtos
  add column if not exists certificado_horas integer check (certificado_horas > 0),
  add column if not exists certificado_requer_horas integer check (certificado_requer_horas > 0);

-- Maior carga que o aluno comprou para o curso (upgrade só vale se ele tiver a carga de origem).
create or replace function public.horas_certificado(p_user uuid, p_curso_id uuid)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  with comprados as (
    select coalesce(p.certificado_horas, c.carga_horaria_horas) as horas, p.certificado_requer_horas as requer
    from acessos a
    join produtos p on p.id = a.produto_id
    join cursos c on c.id = p.curso_id
    where a.user_id = p_user and p.curso_id = p_curso_id
  ),
  base as (select horas from comprados where requer is null)
  select max(horas) from (
    select horas from base
    union all
    select u.horas from comprados u where u.requer is not null and exists (select 1 from base b where b.horas >= u.requer)
  ) t;
$$;

revoke all on function public.horas_certificado(uuid, uuid) from public, anon;
grant execute on function public.horas_certificado(uuid, uuid) to authenticated, service_role;

-- Pedido: bloqueia upgrade para quem não tem a carga de origem (ou já tem a de destino).
create or replace function public.criar_pedido_por_slug(p_slug text)
 returns table(pedido_id uuid, produto_nome text, valor_centavos integer)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare v_user uuid := auth.uid(); v_produto record; v_pedido uuid; v_horas integer;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;
  select id, nome, preco_centavos, curso_id, certificado_horas, certificado_requer_horas into v_produto from produtos
  where slug = p_slug and ativo and preco_centavos > 0 limit 1;
  if v_produto.id is null then raise exception 'Produto não encontrado'; end if;
  if exists (select 1 from acessos where user_id = v_user and produto_id = v_produto.id) then
    raise exception 'Você já possui este produto';
  end if;
  if v_produto.certificado_horas is not null and v_produto.curso_id is not null then
    v_horas := coalesce(horas_certificado(v_user, v_produto.curso_id), 0);
    if v_horas >= v_produto.certificado_horas then
      raise exception 'Você já tem o certificado com essa carga horária';
    end if;
    if v_produto.certificado_requer_horas is not null and v_horas <> v_produto.certificado_requer_horas then
      raise exception 'Este upgrade não corresponde ao seu certificado atual';
    end if;
  end if;
  insert into pedidos (user_id, produto_id, valor_centavos, status)
  values (v_user, v_produto.id, v_produto.preco_centavos, 'pendente')
  returning id into v_pedido;
  return query select v_pedido, v_produto.nome, v_produto.preco_centavos;
end $function$;

-- Emissão: a carga sai da compra (CadÚnico = carga total do curso).
create or replace function public.emitir_certificado(p_curso_id uuid, p_nome text, p_cpf text)
 returns text
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_nome text := btrim(coalesce(p_nome, ''));
  v_cpf text := regexp_replace(coalesce(p_cpf, ''), '[^0-9]', '', 'g');
  v_codigo text; v_hex text;
  v_horas integer; v_min integer; v_melhor numeric; v_forma text; v_isencao boolean; v_comprado integer;
begin
  if v_user is null then raise exception 'Não autenticado'; end if;

  select codigo into v_codigo from certificados where user_id = v_user and curso_id = p_curso_id;
  if v_codigo is not null then return v_codigo; end if;

  if length(v_nome) < 5 or position(' ' in v_nome) = 0 then
    raise exception 'Digite seu nome completo, como deve aparecer no certificado';
  end if;
  if v_cpf !~ '^[0-9]{11}$' then
    raise exception 'CPF inválido';
  end if;

  select carga_horaria_horas, nota_minima, permite_isencao_cadunico into v_horas, v_min, v_isencao from cursos where id = p_curso_id;
  if v_horas is null then raise exception 'Curso não encontrado'; end if;

  if not exists (select 1 from matriculas where user_id = v_user and curso_id = p_curso_id) then
    raise exception 'Você não está matriculado neste curso';
  end if;
  if not curso_pronto_para_prova(v_user, p_curso_id) then
    raise exception 'Conclua todas as aulas antes de emitir o certificado';
  end if;

  select max(nota) into v_melhor from tentativas_quiz
  where user_id = v_user and curso_id = p_curso_id and finalizado_em is not null;
  if v_melhor is null or v_melhor < v_min then
    raise exception 'Você precisa de nota mínima % na prova final', v_min;
  end if;

  v_comprado := horas_certificado(v_user, p_curso_id);
  if v_isencao and exists (select 1 from comprovantes_cadunico where user_id = v_user and status = 'aprovado') then
    v_forma := 'gratuito_cadunico';
  elsif v_comprado is not null then
    v_forma := 'pago';
    v_horas := least(v_comprado, v_horas);
  else
    raise exception 'Certificado disponível após aprovação do comprovante do CadÚnico ou pagamento';
  end if;

  v_hex := upper(replace(gen_random_uuid()::text, '-', ''));
  v_codigo := 'SIB-' || substr(v_hex, 1, 4) || '-' || substr(v_hex, 5, 4) || '-' || substr(v_hex, 9, 4);

  insert into certificados (codigo, user_id, curso_id, nome_completo, cpf, carga_horaria_horas, forma)
  values (v_codigo, v_user, p_curso_id, v_nome, v_cpf, v_horas, v_forma);
  return v_codigo;
end $function$;

-- Upgrade pago depois da emissão: o certificado já emitido passa para a nova carga (mesmo código e QR Code).
create or replace function public.atualizar_horas_certificado()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_curso uuid; v_horas integer;
begin
  select curso_id into v_curso from produtos where id = new.produto_id and certificado_horas is not null;
  if v_curso is null then return new; end if;
  v_horas := horas_certificado(new.user_id, v_curso);
  if v_horas is not null then
    update certificados set carga_horaria_horas = v_horas
    where user_id = new.user_id and curso_id = v_curso and forma = 'pago' and carga_horaria_horas < v_horas;
  end if;
  return new;
end $$;

drop trigger if exists acessos_atualizar_horas_certificado on public.acessos;
create trigger acessos_atualizar_horas_certificado after insert on public.acessos
  for each row execute function public.atualizar_horas_certificado();

-- Auxiliar Administrativo: 40 h, certificado de 20 h (R$ 29,90), 30 h (R$ 34,90) ou 40 h (R$ 39,90).
-- O produto antigo (R$ 29,90, 30 h) vira o de 40 h: quem já comprou fica com 40 h.
do $$
declare v_curso uuid;
begin
  select id into v_curso from cursos where slug = 'auxiliar-administrativo';
  if v_curso is null then return; end if;

  update cursos set carga_horaria_horas = 40 where id = v_curso;

  update produtos set certificado_horas = 40, preco_centavos = 3990,
    nome = 'Certificado Auxiliar Administrativo – 40 horas'
  where slug = 'certificado-auxiliar-administrativo';
  update produtos set certificado_horas = 40 where slug = 'certificado-impresso-auxiliar-administrativo';

  insert into produtos (slug, nome, descricao, preco_centavos, curso_id, tipo, ativo, inclui_apostila, inclui_simulado, certificado_horas, certificado_requer_horas)
  values
    ('certificado-auxiliar-administrativo-20h', 'Certificado Auxiliar Administrativo – 20 horas', 'Certificado online (PDF) com 20 horas.', 2990, v_curso, 'curso', true, false, false, 20, null),
    ('certificado-auxiliar-administrativo-30h', 'Certificado Auxiliar Administrativo – 30 horas', 'Certificado online (PDF) com 30 horas.', 3490, v_curso, 'curso', true, false, false, 30, null),
    ('certificado-auxiliar-administrativo-upgrade-20h-30h', 'Upgrade do certificado Auxiliar Administrativo: 20 h para 30 h', 'Diferença para passar o certificado de 20 para 30 horas.', 500, v_curso, 'curso', true, false, false, 30, 20),
    ('certificado-auxiliar-administrativo-upgrade-20h-40h', 'Upgrade do certificado Auxiliar Administrativo: 20 h para 40 h', 'Diferença para passar o certificado de 20 para 40 horas.', 1000, v_curso, 'curso', true, false, false, 40, 20),
    ('certificado-auxiliar-administrativo-upgrade-30h-40h', 'Upgrade do certificado Auxiliar Administrativo: 30 h para 40 h', 'Diferença para passar o certificado de 30 para 40 horas.', 500, v_curso, 'curso', true, false, false, 40, 30)
  on conflict (slug) do nothing;

  update certificados set carga_horaria_horas = 40 where curso_id = v_curso and carga_horaria_horas < 40;
end $$;
