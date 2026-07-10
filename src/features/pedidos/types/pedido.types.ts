export type StatusPedido =
  | 'a_produzir'
  | 'em_andamento'
  | 'finalizado'
  | 'aguardando_entrega'
  | 'entregue'

export const STATUS_PEDIDO_ORDEM: StatusPedido[] = [
  'a_produzir',
  'em_andamento',
  'finalizado',
  'aguardando_entrega',
  'entregue',
]

export const STATUS_PEDIDO_LABEL: Record<StatusPedido, string> = {
  a_produzir: 'A produzir',
  em_andamento: 'Em andamento',
  finalizado: 'Finalizado',
  aguardando_entrega: 'Aguardando entrega',
  entregue: 'Entregue',
}

// Status de item de pedido é sempre um dos três estados de produção —
// aguardando_entrega/entregue são estados do pedido inteiro, geridos no
// painel de Entregas, nunca por item (ver migration
// 20260710150000_status_por_item_carrinho.sql).
export type StatusItemPedido = 'a_produzir' | 'em_andamento' | 'finalizado'

export const STATUS_ITEM_PEDIDO_ORDEM: StatusItemPedido[] = [
  'a_produzir',
  'em_andamento',
  'finalizado',
]

export interface ItemPedido {
  id: string
  pedido_id: string
  produto_estoque_id: string | null
  categoria: string
  nome_produto: string
  quantidade: number
  cor: string
  valor: number
  status: StatusItemPedido
  drive_file_id: string | null
  drive_url: string | null
  created_at: string
  updated_at: string
}

export interface Pedido {
  id: string
  numero_pedido: string
  cliente_id: string
  status: StatusPedido
  pago: boolean
  valor_total: number
  observacoes: string | null
  created_at: string
  updated_at: string
  // relação opcional preenchida em queries com join
  cliente?: { id: string; nome: string; telefone: string } | null
  itens?: ItemPedido[]
}

export interface NovoItemPedidoInput {
  produto_estoque_id: string
  categoria: string
  nome_produto: string
  quantidade: number
  cor: string
  valor: number
  drive_file_id?: string | null
  drive_url?: string | null
}

export interface NovoPedidoInput {
  cliente_id: string
  observacoes?: string
  itens: NovoItemPedidoInput[]
}

export interface AtualizarPedidoInput {
  id: string
  status?: StatusPedido
  pago?: boolean
  observacoes?: string
  valor_total?: number
}
