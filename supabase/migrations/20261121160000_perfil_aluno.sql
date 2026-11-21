-- Perfil do aluno na área logada (Wagner, 21/11/2026): "Meus dados" com profissão (opcional) e foto de até 50 KB.
-- A foto vai para o bucket público 'avatares' (o upload é feito pelo servidor com a chave de serviço,
-- depois de conferir o login, o tipo e o tamanho; por isso não há política de escrita no storage).
alter table public.profiles add column if not exists profissao text;
alter table public.profiles add column if not exists foto_url text;
alter table public.profiles add column if not exists atualizado_em timestamptz;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 51200, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 51200, allowed_mime_types = excluded.allowed_mime_types;
