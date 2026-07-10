import { supabase } from '@/services/supabaseClient'
import type { AtualizarClienteInput, Cliente, NovoClienteInput } from '../types/cliente.types'

/**
 * Serviço de clientes: criação, busca, listagem, edição e exclusão.
 *
 * Este arquivo nunca deve ser importado diretamente por componentes,
 * apenas por hooks (ex.: features/clientes/hooks ou o PedidoForm via hook).
 */

export async function criarCliente(input: NovoClienteInput): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: input.nome,
      telefone: input.telefone,
      email: input.email ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Falha ao criar cliente: ${error.message}`)
  }

  return data as Cliente
}

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    throw new Error(`Falha ao listar clientes: ${error.message}`)
  }

  return (data ?? []) as Cliente[]
}

export async function atualizarCliente(input: AtualizarClienteInput): Promise<Cliente> {
  const { id, ...campos } = input

  const { data, error } = await supabase
    .from('clientes')
    .update(campos)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Falha ao atualizar cliente: ${error.message}`)
  }

  return data as Cliente
}

export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id)

  if (error) {
    // Código 23503 = violação de foreign key (postgres) — cliente com
    // pedidos vinculados não pode ser excluído (FK restrict, ver skill
    // supabase-schema-costura).
    if (error.code === '23503') {
      throw new Error(
        'Não é possível excluir este cliente: existem pedidos vinculados a ele.'
      )
    }
    throw new Error(`Falha ao excluir cliente: ${error.message}`)
  }
}
