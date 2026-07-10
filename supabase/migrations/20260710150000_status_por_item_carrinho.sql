-- Suporte a "carrinho" (múltiplos itens por pedido) com produção
-- individual por item, mantendo o status do pedido como valor agregado.
--
-- Regras:
--   - itens_pedido.status percorre apenas a_produzir -> em_andamento ->
--     finalizado (produção é por item).
--   - pedidos.status continua com o enum completo (inclui
--     aguardando_entrega/entregue), mas para a_produzir/em_andamento/
--     finalizado passa a ser CALCULADO a partir dos itens via trigger:
--       * algum item a_produzir       -> pedido a_produzir
--       * nenhum a_produzir, algum em_andamento -> pedido em_andamento
--       * todos finalizado             -> pedido finalizado
--   - aguardando_entrega/entregue continuam sendo definidos manualmente
--     (painel de Entregas), e o trigger não sobrescreve esses dois estados
--     — assim o pedido só pode ser movido para aguardando_entrega quando o
--     cálculo acima já o colocou em "finalizado" (todos os itens prontos).

alter table public.itens_pedido
  add column status public.status_pedido not null default 'a_produzir';

create or replace function public.recalcular_status_pedido()
returns trigger
language plpgsql
as $$
declare
  v_pedido_id uuid;
  v_status_atual public.status_pedido;
  v_novo_status public.status_pedido;
  v_qtd_a_produzir integer;
  v_qtd_em_andamento integer;
  v_qtd_itens integer;
  v_qtd_finalizado integer;
begin
  v_pedido_id := coalesce(new.pedido_id, old.pedido_id);

  select status into v_status_atual from public.pedidos where id = v_pedido_id;

  -- Não sobrescreve pedidos já em aguardando_entrega/entregue — esses
  -- estados são geridos manualmente pelo painel de Entregas.
  if v_status_atual in ('aguardando_entrega', 'entregue') then
    return new;
  end if;

  select
    count(*) filter (where status = 'a_produzir'),
    count(*) filter (where status = 'em_andamento'),
    count(*) filter (where status = 'finalizado'),
    count(*)
  into v_qtd_a_produzir, v_qtd_em_andamento, v_qtd_finalizado, v_qtd_itens
  from public.itens_pedido
  where pedido_id = v_pedido_id;

  if v_qtd_itens = 0 then
    return new;
  elsif v_qtd_a_produzir > 0 then
    v_novo_status := 'a_produzir';
  elsif v_qtd_em_andamento > 0 then
    v_novo_status := 'em_andamento';
  else
    v_novo_status := 'finalizado';
  end if;

  if v_novo_status is distinct from v_status_atual then
    update public.pedidos set status = v_novo_status where id = v_pedido_id;
  end if;

  return new;
end;
$$;

create trigger trg_recalcular_status_pedido
  after insert or update of status or delete on public.itens_pedido
  for each row execute function public.recalcular_status_pedido();
