import { useMutation, useQueryClient } from '@tanstack/react-query'
import { atualizarItemPedido, type AtualizarItemPedidoInput } from '../services/pedidosService'

export function useAtualizarItemPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AtualizarItemPedidoInput) => atualizarItemPedido(input),
    onSuccess: (pedidoAtualizado) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos', pedidoAtualizado.id] })
    },
  })
}
