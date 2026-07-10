import { useQuery } from '@tanstack/react-query'
import { listarPedidos } from '../services/pedidosService'

export function usePedidos() {
  return useQuery({
    queryKey: ['pedidos'],
    queryFn: listarPedidos,
  })
}
