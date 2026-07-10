-- Views financeiras: agregações sempre em SQL, nunca no frontend.

create or replace view public.vw_faturamento_mensal as
select
  date_trunc('month', p.created_at)::date as mes,
  count(distinct p.id) as total_pedidos,
  coalesce(sum(ip.valor * ip.quantidade), 0)::numeric(12,2) as faturamento
from public.pedidos p
join public.itens_pedido ip on ip.pedido_id = p.id
group by 1
order by 1 desc;

create or replace view public.vw_fluxo_caixa as
select
  cl.data_lancamento as data,
  sum(case when cl.tipo = 'entrada' then cl.valor else 0 end)::numeric(12,2) as total_entradas,
  sum(case when cl.tipo = 'saida' then cl.valor else 0 end)::numeric(12,2) as total_saidas,
  (sum(case when cl.tipo = 'entrada' then cl.valor else 0 end)
    - sum(case when cl.tipo = 'saida' then cl.valor else 0 end))::numeric(12,2) as saldo_dia
from public.caixa_lancamentos cl
group by cl.data_lancamento
order by cl.data_lancamento desc;
