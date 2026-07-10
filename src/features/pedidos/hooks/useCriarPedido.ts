import { useMutation, useQueryClient } from '@tanstack/react-query'
import { criarPedido } from '../services/pedidosService'
import type { NovoPedidoInput } from '../types/pedido.types'

export function useCriarPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NovoPedidoInput) => criarPedido(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}
