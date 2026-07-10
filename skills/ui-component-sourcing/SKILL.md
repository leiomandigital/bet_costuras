---
name: ui-component-sourcing
description: Garante que componentes de UI sejam sourced de shadcn/ui e 21st.dev antes de escrever qualquer componente do zero, seguindo o design system acessível do projeto.
---

# ui-component-sourcing

## Quando usar

Em toda tarefa que envolva criar, ajustar ou revisar qualquer elemento de UI do app (formulário, tabela, modal, card, stepper, upload de arquivo, dashboard, badge de status, kanban, etc.).

## Como usar

1. Antes de criar qualquer componente visual, consulte nesta ordem:
   - `https://ui.shadcn.com/` — biblioteca base (Radix + Tailwind). Fundação de todos os primitivos: Button, Input, Select, Dialog, Table, Tabs, Badge, Card, Form, Toast, Combobox, DatePicker, Sheet.
   - `https://21st.dev/` — variações mais elaboradas e blocos prontos (dashboards, formulários compostos, upload de imagem com preview, kanban de produção, timelines de status) já construídos sobre shadcn/ui.
2. Nunca reimplemente um componente que já existe pronto nessas fontes. Adapte ao design system do projeto (cores, espaçamento, tipografia — ver seção "Design system e acessibilidade" do projeto).
3. Local de arquivo:
   - Primitivos shadcn/ui → `/src/components/ui/`
   - Composições (21st.dev ou locais) → `/src/components/blocks/`
   - Nunca misturar lógica de negócio nesses arquivos.
4. Documente a origem no topo do arquivo:
   - `// Base: shadcn/ui - Table`
   - `// Base: 21st.dev - <nome do bloco>`
5. Instale via CLI oficial sempre que possível: `npx shadcn@latest add <componente>`, em vez de copiar código manualmente.
6. Priorize componentes acessíveis (ARIA, navegação por teclado) — não regrida essa qualidade ao customizar.
7. Entre variantes de um mesmo componente, prefira sempre a de maior contraste e texto maior — público inclui colaboradores acima de 60 anos, legibilidade tem prioridade sobre estética minimalista.

## Design tokens de referência (aplicar via tema, nunca hardcode)

- Fundo: `#FAFAFA` / `#F4F4F5`
- Texto principal: `#18181B`
- Accent único: `#1D4ED8` ou `#15803D`
- Status: verde (finalizado/entregue), amarelo (em andamento), cinza (a produzir), vermelho (pendência) — sempre com texto/ícone, nunca só cor
- Contraste mínimo WCAG AA (4.5:1 texto normal, 3:1 texto grande/ícones)
- Corpo de texto 16-18px, títulos 20-24px (peso 600-700), números de dashboard 28-32px
- Alvo de toque/clique mínimo 44px de altura
- Ícones sempre com rótulo em texto, exceto ações universais ("X" de fechar)

## Exemplo

Precisa de uma tabela de pedidos com filtros → primeiro checar `Table` do shadcn/ui + procurar em 21st.dev um bloco de "data table with filters" já pronto sobre Radix, adaptar cores/tipografia ao tema do projeto, salvar em `/src/components/blocks/pedidos-table.tsx` com comentário de origem.
