export interface FaturamentoMensal {
  mes: string
  total_pedidos: number
  faturamento: number
}

export interface FluxoCaixaDia {
  data: string
  total_entradas: number
  total_saidas: number
  saldo_dia: number
}

export type TipoLancamentoCaixa = 'entrada' | 'saida'

export interface LancamentoCaixa {
  id: string
  tipo: TipoLancamentoCaixa
  descricao: string
  valor: number
  pedido_id: string | null
  compra_id: string | null
  data_lancamento: string
  created_at: string
  updated_at: string
}

export interface NovoLancamentoCaixaInput {
  tipo: TipoLancamentoCaixa
  descricao: string
  valor: number
  pedido_id?: string | null
  compra_id?: string | null
  data_lancamento?: string
}
