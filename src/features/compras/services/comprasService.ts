import { supabase } from '@/services/supabaseClient'
import type { Compra, NovaCompraInput } from '../types/compra.types'

/**
 * Serviço de compras. Este arquivo nunca deve ser importado diretamente por
 * componentes, apenas pelos hooks em features/compras/hooks.
 */

export async function listarCompras(): Promise<Compra[]> {
  const { data, error } = await supabase
    .from('compras')
    .select('*, materia_prima:materia_prima(id, nome, unidade_medida)')
    .order('data_compra', { ascending: false })

  if (error) {
    throw new Error(`Falha ao listar compras: ${error.message}`)
  }

  return (data ?? []) as unknown as Compra[]
}

/**
 * Lança uma compra manual: insere em `compras` e registra a entrada
 * correspondente em `movimentacoes_estoque`, incrementando
 * `materia_prima.quantidade_disponivel`. Feito em chamadas sequenciais
 * (sem função SQL/transação) — MVP, ver instrução da tarefa original.
 */
export async function criarCompra(input: NovaCompraInput): Promise<Compra> {
  const { data: compra, error: erroCompra } = await supabase
    .from('compras')
    .insert({
      fornecedor: input.fornecedor,
      materia_prima_id: input.materia_prima_id,
      quantidade: input.quantidade,
      valor_total: input.valor_total,
      data_compra: input.data_compra ?? new Date().toISOString().slice(0, 10),
    })
    .select('*, materia_prima:materia_prima(id, nome, unidade_medida)')
    .single()

  if (erroCompra) {
    throw new Error(`Falha ao registrar compra: ${erroCompra.message}`)
  }

  const { data: materiaPrima, error: erroBusca } = await supabase
    .from('materia_prima')
    .select('quantidade_disponivel')
    .eq('id', input.materia_prima_id)
    .single()

  if (erroBusca || !materiaPrima) {
    throw new Error(
      'Compra registrada, mas falha ao localizar matéria-prima para atualizar estoque.'
    )
  }

  const { error: erroMovimentacao } = await supabase.from('movimentacoes_estoque').insert({
    tipo: 'entrada',
    materia_prima_id: input.materia_prima_id,
    quantidade: input.quantidade,
    motivo: `Compra — ${input.fornecedor}`,
  })

  if (erroMovimentacao) {
    throw new Error(
      `Compra registrada, mas falha ao registrar movimentação de entrada: ${erroMovimentacao.message}`
    )
  }

  const novaQuantidade = Number(materiaPrima.quantidade_disponivel) + input.quantidade

  const { error: erroUpdate } = await supabase
    .from('materia_prima')
    .update({ quantidade_disponivel: novaQuantidade })
    .eq('id', input.materia_prima_id)

  if (erroUpdate) {
    throw new Error(
      `Compra registrada, mas falha ao atualizar quantidade disponível: ${erroUpdate.message}`
    )
  }

  const { error: erroCaixa } = await supabase.from('caixa_lancamentos').insert({
    tipo: 'saida',
    descricao: `Compra — ${input.fornecedor}`,
    valor: input.valor_total,
    compra_id: compra.id,
    data_lancamento: input.data_compra ?? new Date().toISOString().slice(0, 10),
  })

  if (erroCaixa) {
    throw new Error(
      `Compra registrada, mas falha ao lançar saída no caixa: ${erroCaixa.message}`
    )
  }

  return compra as unknown as Compra
}

/**
 * Exclui o registro da compra. Não reverte a quantidade em estoque
 * automaticamente — não há vínculo direto entre `compras` e a
 * movimentação de estoque gerada por ela (ver `criarCompra`), então
 * desfazer a entrada exigiria ajuste manual em Estoque, se necessário.
 * Remove primeiro o lançamento de caixa gerado automaticamente pela
 * compra (ver `criarCompra`), já que `caixa_lancamentos.compra_id` é
 * FK restrict.
 */
export async function excluirCompra(id: string): Promise<void> {
  const { error: erroCaixa } = await supabase
    .from('caixa_lancamentos')
    .delete()
    .eq('compra_id', id)

  if (erroCaixa) {
    throw new Error(`Falha ao remover lançamento de caixa da compra: ${erroCaixa.message}`)
  }

  const { error } = await supabase.from('compras').delete().eq('id', id)

  if (error) {
    throw new Error(`Falha ao excluir compra: ${error.message}`)
  }
}
