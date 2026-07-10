# BetCosturas

Ferramenta interna de gestão para uma confecção artesanal de mochilas, bolsas e
nécessaires. React + TypeScript + Vite, Supabase (Postgres + Edge Functions +
Storage/Drive integration), deploy alvo: Vercel.

100% interno — sem RBAC, sem telas públicas, sem login de cliente (ver
`skills/dominio-negocio-costura/SKILL.md`).

## Estrutura de pastas

```
src/
├── components/
│   ├── ui/          # primitivos estilo shadcn/ui (Radix + CVA + cn())
│   └── blocks/       # composições locais (vazio nesta fase)
├── features/
│   ├── pedidos/               # IMPLEMENTADO — vertical slice completa
│   │   ├── components/        # PedidoForm, PedidosTable
│   │   ├── hooks/              # usePedidos, usePedido, useCriarPedido, useAtualizarPedido, useUploadFotoPedido
│   │   ├── services/           # pedidosService.ts, fotoPedidoService.ts (nunca importados por componentes)
│   │   └── types/
│   ├── clientes/               # IMPLEMENTADO — CRUD completo (criar, listar, buscar, editar, excluir)
│   │   ├── components/         # ClienteForm, ClientesTable (busca, edição em Dialog, exclusão, export CSV)
│   │   ├── services/clientesService.ts
│   │   ├── hooks/useClientes.ts
│   │   └── types/cliente.types.ts
│   ├── producao/                # IMPLEMENTADO — kanban simplificado, reutiliza hooks de pedidos
│   ├── entregas/                 # IMPLEMENTADO — lista de despacho, reutiliza hooks de pedidos
│   ├── financeiro/                # IMPLEMENTADO — dashboard (faturamento, ticket médio, fluxo de caixa)
│   │   ├── components/DashboardFinanceiro.tsx
│   │   ├── services/financeiroService.ts   # consome vw_faturamento_mensal / vw_fluxo_caixa
│   │   ├── hooks/useFinanceiro.ts
│   │   └── types/
│   ├── compras/                    # IMPLEMENTADO — lançamento manual de compra + estoque
│   │   ├── components/             # CompraForm, ComprasTable, ComprasPage
│   │   ├── services/comprasService.ts
│   │   ├── hooks/useCompras.ts
│   │   └── types/
│   ├── estoque-materia-prima/       # IMPLEMENTADO — listagem, cadastro, saída manual, badge estoque baixo
│   │   ├── components/EstoqueMateriaPrimaTable.tsx
│   │   ├── services/estoqueMateriaPrimaService.ts
│   │   ├── hooks/useEstoqueMateriaPrima.ts
│   │   └── types/
│   └── estoque-produtos-prontos/     # IMPLEMENTADO — listagem, entrada manual, baixa (função exposta)
│       ├── components/EstoqueProdutosProntosTable.tsx
│       ├── services/estoqueProdutosProntosService.ts
│       ├── hooks/useEstoqueProdutosProntos.ts
│       └── types/
├── services/supabaseClient.ts
├── hooks/, types/, utils/, constants/  # compartilhados (vazios nesta fase)
├── lib/utils.ts   # cn() (clsx + tailwind-merge)
├── App.tsx         # navegação interna por abas (sem router): Pedidos / Novo pedido / Produção /
│                      Entregas / Clientes / Financeiro / Compras / Estoque (sub-abas Matéria-prima e Produtos prontos)
├── main.tsx        # QueryClientProvider + Toaster (sonner)
└── index.css        # tokens de design (CSS vars) + Tailwind

supabase/
├── migrations/       # SQL versionado (clientes, pedidos, itens_pedido, materia_prima,
│                        estoque_produtos_prontos, movimentacoes_estoque, compras,
│                        caixa_lancamentos, fotos_pendentes, vw_faturamento_mensal, vw_fluxo_caixa)
└── functions/upload-foto-pedido/index.ts   # Edge Function com integração real ao Google Drive API v3
```

## Escopo

Implementado ponta a ponta: **Pedidos → Produção → Entregas → Clientes →
Financeiro → Compras → Estoque (matéria-prima e produtos prontos)**,
incluindo cadastro rápido de cliente embutido no formulário de pedido e
integração real (não mais mockada) com o Google Drive na Edge Function de
upload de fotos.

**Limitações conhecidas / fora de escopo por design:**
- Leitura automática (OCR) de cupom fiscal em Compras **não foi
  implementada** — é fora de escopo viável para este ambiente. O botão
  "Ler cupom fiscal (em breve)" fica desabilitado com tooltip explicativo;
  o lançamento manual (sempre disponível) é o caminho funcional.
- A baixa de estoque de produtos prontos vinculada automaticamente a uma
  venda/pedido não foi implementada — a função `darBaixaProdutoPronto` já
  existe e está exposta via hook, pronta para essa integração futura.
- O limite de "estoque baixo" (10 unidades) é um valor fixo (hardcoded)
  como MVP, comentado no código — não é configurável ainda.
- A integração real com o Google Drive na Edge Function não pôde ser
  testada de ponta a ponta nesta sessão por não haver credenciais reais de
  Service Account disponíveis; a implementação segue o contrato oficial da
  API (JWT RS256 assinado via Web Crypto, troca por access token, busca/
  criação de subpasta por categoria, upload multipart, permissão pública de
  leitura) e mantém o fallback para a fila `fotos_pendentes` em caso de
  falha.

## Google Drive — variáveis de ambiente da Edge Function

A Edge Function `supabase/functions/upload-foto-pedido/index.ts` chama a
Google Drive API v3 diretamente (sem libs Node, via Web Crypto/SubtleCrypto
para assinar o JWT RS256 da Service Account). Ela depende de 3 variáveis de
ambiente que **nunca vão no `.env` do frontend** — são segredos da function,
configurados via Supabase CLI:

```bash
supabase secrets set GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxx@xxxx.iam.gserviceaccount.com
supabase secrets set GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
supabase secrets set GOOGLE_DRIVE_ROOT_FOLDER_ID=<id da pasta raiz no Drive>
```

Ver `.env.example` na raiz para uma referência comentada dessas 3 variáveis
(documentativa apenas — não use o `.env` do Vite para elas).

## Como rodar

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

## Variáveis de ambiente

Ver `.env.example`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Migrations

Aplicar em ordem via Supabase CLI (`supabase db push`) ou colar no SQL editor,
na ordem dos timestamps em `/supabase/migrations/`.

## Status real de build/typecheck (verificado nesta sessão, não estimado)

- `npm install`: **sucesso**. Rodou em ~28s no primeiro `npm install` a
  partir do `package.json`; dependências `sonner` e `@radix-ui/react-popover`
  não foram resolvidas nesse primeiro passe (motivo não identificado — não
  houve erro no log) e precisaram de um segundo `npm install sonner
  @radix-ui/react-popover` explícito, que funcionou em ~4s. Se após clonar
  este repo `npm run dev`/`build` reclamar de módulo não encontrado para
  `sonner` ou `@radix-ui/react-popover`, rode `npm install` novamente.
- `npx tsc --noEmit`: **sucesso, sem erros** (após instalar as duas
  dependências acima e corrigir um `implicitly has an 'any' type` em
  `src/components/ui/combobox.tsx`, já corrigido no código commitado).
- `npm run build` (`tsc --noEmit && vite build`): **sucesso**. Build gerado
  em `dist/` em ~7s. Único aviso (não é erro): chunk JS final de ~670kB
  (196kB gzip) acima do limite de aviso padrão do Vite de 500kB — aceitável
  para esta fase, mas candidato a code-splitting (`React.lazy`) por feature
  se o app crescer.

Nenhum erro de tipo ou de build foi deixado sem correção nesta entrega.

### Atualização — módulos Clientes/Financeiro/Compras/Estoque + Drive real

- `npx tsc --noEmit`: **sucesso, sem erros** após adicionar os módulos de
  Clientes (CRUD completo), Financeiro, Compras, Estoque de matéria-prima e
  Estoque de produtos prontos, além da integração real com o Google Drive na
  Edge Function.
- `npm run build`: **sucesso**. Chunk final ~707kB (205kB gzip), acima do
  limite de aviso padrão do Vite — mesmo candidato a code-splitting já
  citado acima, agora mais relevante com mais features.
