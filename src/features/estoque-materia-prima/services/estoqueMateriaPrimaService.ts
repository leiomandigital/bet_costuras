import { supabase } from '@/services/supabaseClient'
import type {
  MateriaPrima,
  NovaMateriaPrimaInput,
  RegistrarSaidaEstoqueInput,
} from '../types/estoqueMateriaPrima.types'

/**
 * Serviço de estoque de matéria-prima. Este arquivo nunca deve ser
 * importado diretamente por componentes, apenas pelos hooks em
 * features/estoque-materia-prima/hooks (e por features/compras/services,
 * que reaproveita listarMateriaPrima e a lógica de entrada de estoque).
 */

export async function listarMateriaPrima(): Promise<MateriaPrima[]> {
  const { data, error } = await supabase
    .from('materia_prima')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    throw new Error(`Falha ao listar matéria-prima: ${error.message}`)
  }

  return (data ?? []) as MateriaPrima[]
}

export async function criarMateriaPrima(
  input: NovaMateriaPrimaInput
): Promise<MateriaPrima> {
  const { data, error } = await supabase
    .from('materia_prima')
    .insert({
      nome: input.nome,
      unidade_medida: input.unidade_medida,
      quantidade_disponivel: input.quantidade_disponivel ?? 0,
      custo_unitario: input.custo_unitario ?? null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Falha ao criar matéria-prima: ${error.message}`)
  }

  return data as MateriaPrima
}

export async function excluirMateriaPrima(id: string): Promise<void> {
  const { error } = await supabase.from('materia_prima').delete().eq('id', id)

  if (error) {
    // Código 23503 = violação de foreign key (postgres) — matéria-prima
    // com compras ou movimentações de estoque vinculadas não pode ser
    // excluída (FK restrict, ver skill supabase-schema-costura).
    if (error.code === '23503') {
      throw new Error(
        'Não é possível excluir esta matéria-prima: existem compras ou movimentações vinculadas a ela.'
      )
    }
    throw new Error(`Falha ao excluir matéria-prima: ${error.message}`)
  }
}

/**
 * Registra uma saída manual de matéria-prima: insere o registro de
 * movimentação e decrementa a quantidade disponível. Feito em duas
 * chamadas sequenciais (sem função SQL/transação) — MVP, ver instrução
 * da tarefa original.
 */
export async function registrarSaidaEstoque(
  input: RegistrarSaidaEstoqueInput
): Promise<void> {
  const { data: materiaPrima, error: erroBusca } = await supabase
    .from('materia_prima')
    .select('quantidade_disponivel')
    .eq('id', input.materia_prima_id)
    .single()

  if (erroBusca || !materiaPrima) {
    throw new Error('Falha ao localizar matéria-prima para registrar saída.')
  }

  const { error: erroMovimentacao } = await supabase.from('movimentacoes_estoque').insert({
    tipo: 'saida',
    materia_prima_id: input.materia_prima_id,
    quantidade: input.quantidade,
    motivo: input.motivo ?? null,
  })

  if (erroMovimentacao) {
    throw new Error(`Falha ao registrar movimentação de saída: ${erroMovimentacao.message}`)
  }

  const novaQuantidade = Number(materiaPrima.quantidade_disponivel) - input.quantidade

  const { error: erroUpdate } = await supabase
    .from('materia_prima')
    .update({ quantidade_disponivel: novaQuantidade })
    .eq('id', input.materia_prima_id)

  if (erroUpdate) {
    throw new Error(
      `Movimentação registrada, mas falha ao atualizar quantidade disponível: ${erroUpdate.message}`
    )
  }
}
