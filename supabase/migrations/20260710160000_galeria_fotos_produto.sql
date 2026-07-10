-- Galeria de fotos por produto pronto: Supabase Storage é a fonte
-- editável (usada na exibição do app e nos pedidos); o Drive (via
-- webhook n8n, ver Edge Function upload-foto-produto) continua recebendo
-- uma cópia de cada foto enviada, mas nunca apaga — funciona como
-- histórico append-only mesmo quando a foto é trocada/removida no app.

-- ============================================================
-- Bucket de Storage
-- ============================================================
insert into storage.buckets (id, name, public)
values ('produtos-fotos', 'produtos-fotos', true)
on conflict (id) do nothing;

create policy "authenticated_insert_produtos_fotos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'produtos-fotos');

create policy "authenticated_delete_produtos_fotos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'produtos-fotos');

create policy "public_select_produtos_fotos" on storage.objects
  for select
  using (bucket_id = 'produtos-fotos');

-- ============================================================
-- produto_fotos
-- ============================================================
create table public.produto_fotos (
  id uuid primary key default gen_random_uuid(),
  produto_estoque_id uuid not null references public.estoque_produtos_prontos(id) on delete cascade,
  storage_path text not null,
  storage_url text not null,
  drive_file_id text,
  drive_url text,
  principal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_produto_fotos_updated_at
  before update on public.produto_fotos
  for each row execute function public.set_updated_at();

create index idx_produto_fotos_produto_id on public.produto_fotos(produto_estoque_id);

alter table public.produto_fotos enable row level security;
create policy "authenticated_full_access" on public.produto_fotos
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- As colunas antigas de foto única em estoque_produtos_prontos são
-- substituídas pela galeria acima.
alter table public.estoque_produtos_prontos
  drop column if exists drive_file_id,
  drop column if exists drive_url;
