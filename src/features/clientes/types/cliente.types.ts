export interface Cliente {
  id: string
  nome: string
  telefone: string
  email: string | null
  created_at: string
  updated_at: string
}

export interface NovoClienteInput {
  nome: string
  telefone: string
  email?: string | null
}

export interface AtualizarClienteInput {
  id: string
  nome?: string
  telefone?: string
  email?: string | null
}
