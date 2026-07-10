import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarCliente,
  criarCliente,
  excluirCliente,
  listarClientes,
} from '../services/clientesService'
import type { AtualizarClienteInput, NovoClienteInput } from '../types/cliente.types'

export function useCriarCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NovoClienteInput) => criarCliente(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useListarClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: listarClientes,
  })
}

export function useAtualizarCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AtualizarClienteInput) => atualizarCliente(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useExcluirCliente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => excluirCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}
