-- Ajustes de schema para o fluxo revisado de Pedidos:
-- 1) pedidos.pago: controle simples de pagamento (sem fluxo financeiro
--    associado nesta fase, apenas um marcador booleano).
-- 2) estoque_produtos_prontos ganha foto (mesmo padrão drive_file_id/
--    drive_url de itens_pedido) — produto pronto agora é a origem da
--    categoria/cor/valor/foto ao montar um pedido.
-- 3) itens_pedido ganha produto_estoque_id, referenciando de qual produto
--    pronto o item veio (nullable — segue existindo o modelo de item
--    "solto" para dados legados/itens sem produto associado).

alter table public.pedidos
  add column pago boolean not null default false;

alter table public.estoque_produtos_prontos
  add column drive_file_id text,
  add column drive_url text;

alter table public.itens_pedido
  add column produto_estoque_id uuid references public.estoque_produtos_prontos(id) on delete set null;

create index idx_itens_pedido_produto_estoque_id on public.itens_pedido(produto_estoque_id);

-- fotos_pendentes agora também recebe falhas de upload de foto de produto
-- pronto (sem pedido associado) — pedido_id passa a ser opcional, e ganha
-- produto_estoque_id como alternativa.
alter table public.fotos_pendentes
  alter column pedido_id drop not null,
  add column produto_estoque_id uuid references public.estoque_produtos_prontos(id) on delete cascade,
  add constraint chk_fotos_pendentes_origem check (
    pedido_id is not null or produto_estoque_id is not null
  );
