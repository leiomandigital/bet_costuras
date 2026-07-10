import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { criarCompra, excluirCompra, listarCompras } from '../services/comprasService'
import type { NovaCompraInput } from '../types/compra.types'

export function useCompras() {
  return useQuery({
    queryKey: ['compras'],
    queryFn: listarCompras,
  })
}

export function useCriarCompra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NovaCompraInput) => criarCompra(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] })
      queryClient.invalidateQueries({ queryKey: ['materia-prima'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
    },
  })
}

export function useExcluirCompra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => excluirCompra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
    },
  })
}
