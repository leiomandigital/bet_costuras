import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adicionarItemPedido,
  atualizarStatusItemPedido,
  removerItemPedido,
} from '../services/pedidosService'
import type { NovoItemPedidoInput, StatusItemPedido } from '../types/pedido.types'

function invalidarPedidos(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['pedidos'] })
}

export function useAtualizarStatusItemPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: StatusItemPedido }) =>
      atualizarStatusItemPedido(itemId, status),
    onSuccess: () => invalidarPedidos(queryClient),
  })
}

export function useAdicionarItemPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pedidoId, item }: { pedidoId: string; item: NovoItemPedidoInput }) =>
      adicionarItemPedido(pedidoId, item),
    onSuccess: () => invalidarPedidos(queryClient),
  })
}

export function useRemoverItemPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, pedidoId }: { itemId: string; pedidoId: string }) =>
      removerItemPedido(itemId, pedidoId),
    onSuccess: () => invalidarPedidos(queryClient),
  })
}
