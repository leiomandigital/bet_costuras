import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  atualizarProdutoPronto,
  criarProdutoPronto,
  darBaixaProdutoPronto,
  excluirProdutoPronto,
  listarProdutosProntos,
} from '../services/estoqueProdutosProntosService'
import {
  adicionarFotoProduto,
  marcarFotoPrincipal,
  removerFotoProduto,
  type AdicionarFotoProdutoInput,
} from '../services/produtoFotosService'
import type {
  AtualizarProdutoProntoInput,
  DarBaixaProdutoProntoInput,
  NovoProdutoProntoInput,
  ProdutoFoto,
} from '../types/estoqueProdutosProntos.types'

export function useProdutosProntos() {
  return useQuery({
    queryKey: ['produtos-prontos'],
    queryFn: listarProdutosProntos,
  })
}

export function useCriarProdutoPronto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NovoProdutoProntoInput) => criarProdutoPronto(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-prontos'] })
    },
  })
}

export function useAtualizarProdutoPronto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AtualizarProdutoProntoInput) => atualizarProdutoPronto(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-prontos'] })
    },
  })
}

export function useExcluirProdutoPronto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => excluirProdutoPronto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-prontos'] })
    },
  })
}

export function useDarBaixaProdutoPronto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DarBaixaProdutoProntoInput) => darBaixaProdutoPronto(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-prontos'] })
    },
  })
}

export function useAdicionarFotoProduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AdicionarFotoProdutoInput) => adicionarFotoProduto(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-prontos'] })
    },
  })
}

export function useRemoverFotoProduto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (foto: ProdutoFoto) => removerFotoProduto(foto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-prontos'] })
    },
  })
}

export function useMarcarFotoPrincipal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fotoId, produtoId }: { fotoId: string; produtoId: string }) =>
      marcarFotoPrincipal(fotoId, produtoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-prontos'] })
    },
  })
}
