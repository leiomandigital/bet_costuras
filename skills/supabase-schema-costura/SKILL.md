---
name: supabase-schema-costura
description: Padroniza como o schema Supabase é modelado, migrado e consultado para o domínio de uma confecção artesanal (pedidos, clientes, estoque, compras, financeiro).
---

# supabase-schema-costura

## Quando usar

Ao criar qualquer tabela, view, policy ou query do Supabase neste projeto.

## Como usar

1. Toda tabela nova nasce com uma migration SQL versionada em `/supabase/migrations/`, nunca alterada direto no painel do Supabase.
2. Toda tabela transacional (pedidos, itens de pedido, compras, movimentações de estoque) tem:
   - `id uuid primary key default gen_random_uuid()`
   - `created_at timestamptz default now()`
   - `updated_at timestamptz` mantido por trigger automático (`moddatetime` ou trigger custom)
3. Campos de valor monetário são sempre `numeric(10,2)`, nunca `float`/`real`.
4. RLS habilitada em todas as tabelas, mas apenas exigindo usuário autenticado — sem regras de papel/permissão:
   ```sql
   alter table public.<tabela> enable row level security;
   create policy "authenticated_full_access" on public.<tabela>
     for all using (auth.uid() is not null) with check (auth.uid() is not null);
   ```
5. Foreign keys:
   - `on delete restrict` para dados financeiros (ex.: cliente referenciado em pedido).
   - `on delete cascade` apenas para dados dependentes de exibição (ex.: itens_pedido quando pedido é excluído).
6. Nomenclatura: `snake_case`, em português, sem abreviações obscuras. Tabelas de referência: `clientes`, `pedidos`, `itens_pedido`, `materia_prima`, `estoque_produto_pronto`, `movimentacoes_estoque`, `compras`, `caixa_lancamentos`.
7. Toda métrica do dashboard financeiro vem de uma view SQL dedicada (`vw_faturamento_mensal`, `vw_fluxo_caixa`), nunca de agregação feita no frontend.

## Exemplo de migration mínima

```sql
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clientes enable row level security;
create policy "authenticated_full_access" on public.clientes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
```
