-- Schema inicial BetCosturas
-- Segue skill supabase-schema-costura: snake_case pt-BR, RLS
-- "authenticated_full_access" em todas as tabelas, money = numeric(10,2),
-- created_at/updated_at + trigger, FKs restrict (financeiro) / cascade (exibição).

-- ============================================================
-- Função utilitária de updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- clientes
-- ============================================================
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

alter table public.clientes enable row level security;
create policy "authenticated_full_access" on public.clientes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- pedidos
-- ============================================================
create type public.status_pedido as enum (
  'a_produzir',
  'em_andamento',
  'finalizado',
  'aguardando_entrega',
  'entregue'
);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  numero_pedido text not null unique,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  status public.status_pedido not null default 'a_produzir',
  valor_total numeric(10,2) not null default 0,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_pedidos_updated_at
  before update on public.pedidos
  for each row execute function public.set_updated_at();

create index idx_pedidos_cliente_id on public.pedidos(cliente_id);
create index idx_pedidos_status on public.pedidos(status);

alter table public.pedidos enable row level security;
create policy "authenticated_full_access" on public.pedidos
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- itens_pedido
-- ============================================================
create table public.itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  categoria text not null,
  nome_produto text not null,
  quantidade integer not null default 1 check (quantidade > 0),
  cor text not null, -- sempre texto livre, nunca enum/catalogo fixo
  valor numeric(10,2) not null,
  drive_file_id text,
  drive_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_itens_pedido_updated_at
  before update on public.itens_pedido
  for each row execute function public.set_updated_at();

create index idx_itens_pedido_pedido_id on public.itens_pedido(pedido_id);

alter table public.itens_pedido enable row level security;
create policy "authenticated_full_access" on public.itens_pedido
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- materia_prima
-- ============================================================
create table public.materia_prima (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  unidade_medida text not null default 'un',
  quantidade_disponivel numeric(12,2) not null default 0,
  custo_unitario numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_materia_prima_updated_at
  before update on public.materia_prima
  for each row execute function public.set_updated_at();

alter table public.materia_prima enable row level security;
create policy "authenticated_full_access" on public.materia_prima
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- estoque_produtos_prontos
-- ============================================================
create table public.estoque_produtos_prontos (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,
  nome_produto text not null,
  cor text not null,
  quantidade integer not null default 0,
  valor numeric(10,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_estoque_produtos_prontos_updated_at
  before update on public.estoque_produtos_prontos
  for each row execute function public.set_updated_at();

alter table public.estoque_produtos_prontos enable row level security;
create policy "authenticated_full_access" on public.estoque_produtos_prontos
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- movimentacoes_estoque
-- ============================================================
create type public.tipo_movimentacao_estoque as enum ('entrada', 'saida');

create table public.movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_movimentacao_estoque not null,
  materia_prima_id uuid references public.materia_prima(id) on delete restrict,
  estoque_produto_pronto_id uuid references public.estoque_produtos_prontos(id) on delete restrict,
  quantidade numeric(12,2) not null,
  motivo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_movimentacao_referencia check (
    (materia_prima_id is not null and estoque_produto_pronto_id is null)
    or (materia_prima_id is null and estoque_produto_pronto_id is not null)
  )
);

create trigger trg_movimentacoes_estoque_updated_at
  before update on public.movimentacoes_estoque
  for each row execute function public.set_updated_at();

alter table public.movimentacoes_estoque enable row level security;
create policy "authenticated_full_access" on public.movimentacoes_estoque
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- compras
-- ============================================================
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  fornecedor text not null,
  materia_prima_id uuid references public.materia_prima(id) on delete restrict,
  quantidade numeric(12,2) not null,
  valor_total numeric(10,2) not null,
  data_compra date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_compras_updated_at
  before update on public.compras
  for each row execute function public.set_updated_at();

alter table public.compras enable row level security;
create policy "authenticated_full_access" on public.compras
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- caixa_lancamentos
-- ============================================================
create type public.tipo_lancamento_caixa as enum ('entrada', 'saida');

create table public.caixa_lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_lancamento_caixa not null,
  descricao text not null,
  valor numeric(10,2) not null,
  pedido_id uuid references public.pedidos(id) on delete restrict,
  compra_id uuid references public.compras(id) on delete restrict,
  data_lancamento date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_caixa_lancamentos_updated_at
  before update on public.caixa_lancamentos
  for each row execute function public.set_updated_at();

alter table public.caixa_lancamentos enable row level security;
create policy "authenticated_full_access" on public.caixa_lancamentos
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ============================================================
-- fotos_pendentes (fila de retry do upload para o Google Drive)
-- ============================================================
create table public.fotos_pendentes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  item_pedido_id uuid references public.itens_pedido(id) on delete cascade,
  categoria text not null,
  cliente_nome text not null,
  motivo text,
  tentativas integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_fotos_pendentes_updated_at
  before update on public.fotos_pendentes
  for each row execute function public.set_updated_at();

alter table public.fotos_pendentes enable row level security;
create policy "authenticated_full_access" on public.fotos_pendentes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
