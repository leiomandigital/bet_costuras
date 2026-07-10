import { supabase } from '@/services/supabaseClient'
import type {
  AtualizarProdutoProntoInput,
  DarBaixaProdutoProntoInput,
  NovoProdutoProntoInput,
  ProdutoPronto,
} from '../types/estoqueProdutosProntos.types'

/**
 * Serviço de estoque de produtos prontos. Este arquivo nunca deve ser
 * importado diretamente por componentes, apenas pelos hooks em
 * features/estoque-produtos-prontos/hooks. Fotos são geridas em
 * produtoFotosService.ts (galeria em Supabase Storage + espelho no Drive).
 */

function comFotoPrincipal(produto: ProdutoPronto): ProdutoPronto {
  const fotos = produto.fotos ?? []
  const principal = fotos.find((f) => f.principal) ?? fotos[0] ?? null
  return { ...produto, foto_principal_url: principal?.storage_url ?? null }
}

export async function listarProdutosProntos(): Promise<ProdutoPronto[]> {
  const { data, error } = await supabase
    .from('estoque_produtos_prontos')
    .select('*, fotos:produto_fotos(*)')
    .order('nome_produto', { ascending: true })

  if (error) {
    throw new Error(`Falha ao listar produtos prontos: ${error.message}`)
  }

  return ((data ?? []) as unknown as ProdutoPronto[]).map(comFotoPrincipal)
}

export async function criarProdutoPronto(
  input: NovoProdutoProntoInput
): Promise<ProdutoPronto> {
  const { data, error } = await supabase
    .from('estoque_produtos_prontos')
    .insert({
      categoria: input.categoria,
      nome_produto: input.nome_produto,
      cor: input.cor,
      quantidade: input.quantidade,
      valor: input.valor,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Falha ao criar produto pronto: ${error.message}`)
  }

  return data as ProdutoPronto
}

export async function atualizarProdutoPronto(
  input: AtualizarProdutoProntoInput
): Promise<ProdutoPronto> {
  const { id, ...campos } = input

  const { data, error } = await supabase
    .from('estoque_produtos_prontos')
    .update(campos)
    .eq('id', id)
    .select('*, fotos:produto_fotos(*)')
    .single()

  if (error) {
    throw new Error(`Falha ao atualizar produto: ${error.message}`)
  }

  return comFotoPrincipal(data as unknown as ProdutoPronto)
}

export async function excluirProdutoPronto(id: string): Promise<void> {
  // Limpa os arquivos no Storage antes de excluir o produto — o cascade
  // no banco apaga as linhas de produto_fotos, mas não os objetos no
  // bucket (ficariam órfãos). A cópia no Drive é preservada de propósito
  // (histórico append-only, ver produtoFotosService).
  const { data: fotos } = await supabase
    .from('produto_fotos')
    .select('storage_path')
    .eq('produto_estoque_id', id)

  if (fotos && fotos.length > 0) {
    await supabase.storage.from('produtos-fotos').remove(fotos.map((f) => f.storage_path))
  }

  const { error } = await supabase.from('estoque_produtos_prontos').delete().eq('id', id)

  if (error) {
    // Código 23503 = violação de foreign key (postgres) — produto com
    // movimentações de estoque vinculadas não pode ser excluído (FK
    // restrict, ver skill supabase-schema-costura). Pedidos que já usaram
    // este produto não bloqueiam a exclusão: produto_estoque_id em
    // itens_pedido é "on delete set null".
    if (error.code === '23503') {
      throw new Error(
        'Não é possível excluir este produto: existem movimentações de estoque vinculadas a ele.'
      )
    }
    throw new Error(`Falha ao excluir produto: ${error.message}`)
  }
}

/**
 * Dá baixa em uma unidade de produto pronto (ex.: vinculada a uma venda).
 * A integração automática com pedidos fica para uma fase futura — aqui
 * apenas expomos a função de baixa manual/pontual.
 */
export async function darBaixaProdutoPronto(
  input: DarBaixaProdutoProntoInput
): Promise<void> {
  const { data: produto, error: erroBusca } = await supabase
    .from('estoque_produtos_prontos')
    .select('quantidade')
    .eq('id', input.estoque_produto_pronto_id)
    .single()

  if (erroBusca || !produto) {
    throw new Error('Falha ao localizar produto pronto para dar baixa.')
  }

  const { error: erroMovimentacao } = await supabase.from('movimentacoes_estoque').insert({
    tipo: 'saida',
    estoque_produto_pronto_id: input.estoque_produto_pronto_id,
    quantidade: input.quantidade,
    motivo: input.motivo ?? null,
  })

  if (erroMovimentacao) {
    throw new Error(`Falha ao registrar movimentação de saída: ${erroMovimentacao.message}`)
  }

  const novaQuantidade = Number(produto.quantidade) - input.quantidade

  const { error: erroUpdate } = await supabase
    .from('estoque_produtos_prontos')
    .update({ quantidade: novaQuantidade })
    .eq('id', input.estoque_produto_pronto_id)

  if (erroUpdate) {
    throw new Error(
      `Movimentação registrada, mas falha ao atualizar quantidade: ${erroUpdate.message}`
    )
  }
}
