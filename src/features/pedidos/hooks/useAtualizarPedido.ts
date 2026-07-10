import { useMutation, useQueryClient } from '@tanstack/react-query'
import { atualizarPedido } from '../services/pedidosService'
import type { AtualizarPedidoInput } from '../types/pedido.types'

export function useAtualizarPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AtualizarPedidoInput) => atualizarPedido(input),
    onSuccess: (pedidoAtualizado) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos', pedidoAtualizado.id] })
    },
  })
}
