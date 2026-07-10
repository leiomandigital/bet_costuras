export interface Compra {
  id: string
  fornecedor: string
  materia_prima_id: string | null
  quantidade: number
  valor_total: number
  data_compra: string
  created_at: string
  updated_at: string
  // relação opcional preenchida em queries com join
  materia_prima?: { id: string; nome: string; unidade_medida: string } | null
}

export interface NovaCompraInput {
  fornecedor: string
  materia_prima_id: string
  quantidade: number
  valor_total: number
  data_compra?: string
}
