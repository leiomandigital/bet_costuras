import { useMutation, useQueryClient } from '@tanstack/react-query'
import { excluirPedido } from '../services/pedidosService'

export function useExcluirPedido() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => excluirPedido(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
    },
  })
}
