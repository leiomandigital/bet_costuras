import { useQuery } from '@tanstack/react-query'
import { buscarPedidoPorId } from '../services/pedidosService'

export function usePedido(id: string | undefined) {
  return useQuery({
    queryKey: ['pedidos', id],
    queryFn: () => buscarPedidoPorId(id as string),
    enabled: !!id,
  })
}
