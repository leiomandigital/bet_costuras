import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  criarMateriaPrima,
  excluirMateriaPrima,
  listarMateriaPrima,
  registrarSaidaEstoque,
} from '../services/estoqueMateriaPrimaService'
import type {
  NovaMateriaPrimaInput,
  RegistrarSaidaEstoqueInput,
} from '../types/estoqueMateriaPrima.types'

export function useMateriaPrima() {
  return useQuery({
    queryKey: ['materia-prima'],
    queryFn: listarMateriaPrima,
  })
}

export function useCriarMateriaPrima() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NovaMateriaPrimaInput) => criarMateriaPrima(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materia-prima'] })
    },
  })
}

export function useExcluirMateriaPrima() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => excluirMateriaPrima(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materia-prima'] })
    },
  })
}

export function useRegistrarSaidaEstoque() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RegistrarSaidaEstoqueInput) => registrarSaidaEstoque(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materia-prima'] })
    },
  })
}
