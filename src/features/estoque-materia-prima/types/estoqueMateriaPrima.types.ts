export interface MateriaPrima {
  id: string
  nome: string
  unidade_medida: string
  quantidade_disponivel: number
  custo_unitario: number | null
  created_at: string
  updated_at: string
}

export interface NovaMateriaPrimaInput {
  nome: string
  unidade_medida: string
  quantidade_disponivel?: number
  custo_unitario?: number | null
}

export interface RegistrarSaidaEstoqueInput {
  materia_prima_id: string
  quantidade: number
  motivo?: string
}

// Limite fixo hardcoded como MVP para o badge de "estoque baixo" — não é
// configurável ainda, ver EstoqueMateriaPrimaTable.tsx.
export const LIMITE_ESTOQUE_BAIXO = 10
