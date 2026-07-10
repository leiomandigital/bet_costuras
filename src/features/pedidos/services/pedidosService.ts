import { supabase } from '@/services/supabaseClient'
import type {
  AtualizarPedidoInput,
  NovoItemPedidoInput,
  NovoPedidoInput,
  Pedido,
  StatusItemPedido,
} from '../types/pedido.types'

/**
 * Este arquivo nunca deve ser importado diretamente por componentes —
 * apenas pelos hooks em features/pedidos/hooks.
 */

function gerarNumeroPedido(): string {
  const agora = new Date()
  const yyyy = agora.getFullYear()
  const mm = String(agora.getMonth() + 1).padStart(2, '0')
  const dd = String(agora.getDate()).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `${yyyy}${mm}${dd}-${rand}`
}

export async function listarPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, cliente:clientes(id, nome, telefone), itens:itens_pedido(*)')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Falha ao listar pedidos: ${error.message}`)
  }

  return (data ?? []) as unknown as Pedido[]
}

export async function buscarPedidoPorId(id: string): Promise<Pedido | null> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, cliente:clientes(id, nome, telefone), itens:itens_pedido(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Falha ao buscar pedido: ${error.message}`)
  }

  return data as unknown as Pedido | null
}

export async function criarPedido(input: NovoPedidoInput): Promise<Pedido> {
  const valorTotal = input.itens.reduce(
    (acc, item) => acc + item.valor * item.quantidade,
    0
  )

  const { data: pedido, error: erroPedido } = await supabase
    .from('pedidos')
    .insert({
      numero_pedido: gerarNumeroPedido(),
      cliente_id: input.cliente_id,
      observacoes: input.observacoes ?? null,
      valor_total: valorTotal,
      status: 'a_produzir',
    })
    .select()
    .single()

  if (erroPedido) {
    throw new Error(`Falha ao criar pedido: ${erroPedido.message}`)
  }

  const itensParaInserir = input.itens.map((item) => ({
    pedido_id: pedido.id,
    produto_estoque_id: item.produto_estoque_id,
    categoria: item.categoria,
    nome_produto: item.nome_produto,
    quantidade: item.quantidade,
    cor: item.cor,
    valor: item.valor,
    drive_file_id: item.drive_file_id ?? null,
    drive_url: item.drive_url ?? null,
  }))

  const { error: erroItens } = await supabase
    .from('itens_pedido')
    .insert(itensParaInserir)

  if (erroItens) {
    throw new Error(`Pedido criado, mas falha ao salvar itens: ${erroItens.message}`)
  }

  const pedidoCompleto = await buscarPedidoPorId(pedido.id)
  if (!pedidoCompleto) {
    throw new Error('Pedido criado mas não foi possível recarregá-lo.')
  }
  return pedidoCompleto
}

export async function atualizarPedido(input: AtualizarPedidoInput): Promise<Pedido> {
  const { id, ...campos } = input

  const { error } = await supabase.from('pedidos').update(campos).eq('id', id)

  if (error) {
    throw new Error(`Falha ao atualizar pedido: ${error.message}`)
  }

  const pedidoAtualizado = await buscarPedidoPorId(id)
  if (!pedidoAtualizado) {
    throw new Error('Pedido atualizado mas não foi possível recarregá-lo.')
  }
  return pedidoAtualizado
}

export async function excluirPedido(id: string): Promise<void> {
  const { error } = await supabase.from('pedidos').delete().eq('id', id)

  if (error) {
    throw new Error(`Falha ao excluir pedido: ${error.message}`)
  }
}

export interface AtualizarItemPedidoInput {
  id: string
  quantidade: number
  valor: number
}

/**
 * Atualiza quantidade/valor de um item e recalcula o valor_total do pedido
 * (soma de todos os itens) em seguida.
 */
export async function atualizarItemPedido(input: AtualizarItemPedidoInput): Promise<Pedido> {
  const { data: item, error: erroItem } = await supabase
    .from('itens_pedido')
    .update({ quantidade: input.quantidade, valor: input.valor })
    .eq('id', input.id)
    .select('pedido_id')
    .single()

  if (erroItem || !item) {
    throw new Error(`Falha ao atualizar item do pedido: ${erroItem?.message ?? 'item não encontrado'}`)
  }

  const pedidoAtual = await buscarPedidoPorId(item.pedido_id)
  if (!pedidoAtual) {
    throw new Error('Item atualizado mas pedido não foi encontrado.')
  }

  const novoValorTotal = (pedidoAtual.itens ?? []).reduce(
    (acc, i) => acc + i.valor * i.quantidade,
    0
  )

  return atualizarPedido({ id: item.pedido_id, valor_total: novoValorTotal })
}

/**
 * Avança/ajusta o status de produção de um único item. O status agregado
 * do pedido (pedidos.status) é recalculado automaticamente por trigger no
 * banco a partir dos status de todos os itens — não é setado aqui.
 */
export async function atualizarStatusItemPedido(
  itemId: string,
  status: StatusItemPedido
): Promise<void> {
  const { error } = await supabase.from('itens_pedido').update({ status }).eq('id', itemId)

  if (error) {
    throw new Error(`Falha ao atualizar status do item: ${error.message}`)
  }
}

/**
 * Adiciona um item a um pedido já existente (edição do carrinho) e
 * recalcula o valor_total do pedido.
 */
export async function adicionarItemPedido(
  pedidoId: string,
  item: NovoItemPedidoInput
): Promise<Pedido> {
  const { error: erroInsercao } = await supabase.from('itens_pedido').insert({
    pedido_id: pedidoId,
    produto_estoque_id: item.produto_estoque_id,
    categoria: item.categoria,
    nome_produto: item.nome_produto,
    quantidade: item.quantidade,
    cor: item.cor,
    valor: item.valor,
    drive_file_id: item.drive_file_id ?? null,
    drive_url: item.drive_url ?? null,
  })

  if (erroInsercao) {
    throw new Error(`Falha ao adicionar item ao pedido: ${erroInsercao.message}`)
  }

  const pedidoAtual = await buscarPedidoPorId(pedidoId)
  if (!pedidoAtual) {
    throw new Error('Item adicionado mas pedido não foi encontrado.')
  }

  const novoValorTotal = (pedidoAtual.itens ?? []).reduce(
    (acc, i) => acc + i.valor * i.quantidade,
    0
  )

  return atualizarPedido({ id: pedidoId, valor_total: novoValorTotal })
}

/**
 * Remove um item do pedido (edição do carrinho) e recalcula o valor_total.
 * Não permite remover o último item — um pedido sem itens não faz sentido
 * no domínio; para isso, o pedido inteiro deve ser excluído.
 */
export async function removerItemPedido(itemId: string, pedidoId: string): Promise<Pedido> {
  const pedidoAntes = await buscarPedidoPorId(pedidoId)
  if ((pedidoAntes?.itens?.length ?? 0) <= 1) {
    throw new Error(
      'Não é possível remover o último item do pedido. Exclua o pedido inteiro se necessário.'
    )
  }

  const { error } = await supabase.from('itens_pedido').delete().eq('id', itemId)

  if (error) {
    throw new Error(`Falha ao remover item do pedido: ${error.message}`)
  }

  const pedidoAtual = await buscarPedidoPorId(pedidoId)
  if (!pedidoAtual) {
    throw new Error('Item removido mas pedido não foi encontrado.')
  }

  const novoValorTotal = (pedidoAtual.itens ?? []).reduce(
    (acc, i) => acc + i.valor * i.quantidade,
    0
  )

  return atualizarPedido({ id: pedidoId, valor_total: novoValorTotal })
}
