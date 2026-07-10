export interface ProdutoFoto {
  id: string
  produto_estoque_id: string
  storage_path: string
  storage_url: string
  drive_file_id: string | null
  drive_url: string | null
  principal: boolean
  created_at: string
  updated_at: string
}

export interface ProdutoPronto {
  id: string
  categoria: string
  nome_produto: string
  cor: string
  quantidade: number
  valor: number
  created_at: string
  updated_at: string
  // relação opcional preenchida em queries com join
  fotos?: ProdutoFoto[]
  // conveniência: url da foto marcada como principal (ou a primeira, se
  // nenhuma estiver marcada) — calculada no service ao listar.
  foto_principal_url?: string | null
}

export interface NovoProdutoProntoInput {
  categoria: string
  nome_produto: string
  cor: string
  quantidade: number
  valor: number
}

export interface AtualizarProdutoProntoInput {
  id: string
  categoria: string
  nome_produto: string
  cor: string
  quantidade: number
  valor: number
}

export interface DarBaixaProdutoProntoInput {
  estoque_produto_pronto_id: string
  quantidade: number
  motivo?: string
}
