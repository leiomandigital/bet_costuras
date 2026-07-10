import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  buscarFaturamentoMensal,
  buscarFluxoCaixa,
  criarLancamentoCaixa,
  listarLancamentosCaixa,
} from '../services/financeiroService'
import type { NovoLancamentoCaixaInput } from '../types/financeiro.types'

export function useFaturamentoMensal() {
  return useQuery({
    queryKey: ['financeiro', 'faturamento-mensal'],
    queryFn: buscarFaturamentoMensal,
  })
}

export function useFluxoCaixa() {
  return useQuery({
    queryKey: ['financeiro', 'fluxo-caixa'],
    queryFn: buscarFluxoCaixa,
  })
}

export function useLancamentosCaixa() {
  return useQuery({
    queryKey: ['financeiro', 'lancamentos-caixa'],
    queryFn: listarLancamentosCaixa,
  })
}

export function useCriarLancamentoCaixa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: NovoLancamentoCaixaInput) => criarLancamentoCaixa(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
    },
  })
}
