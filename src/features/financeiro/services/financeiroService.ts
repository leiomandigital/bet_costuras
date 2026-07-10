import { supabase } from '@/services/supabaseClient'
import type {
  FaturamentoMensal,
  FluxoCaixaDia,
  LancamentoCaixa,
  NovoLancamentoCaixaInput,
} from '../types/financeiro.types'

/**
 * Serviço financeiro: sempre consome as views SQL dedicadas
 * (vw_faturamento_mensal, vw_fluxo_caixa) — agregação nunca é feita no
 * frontend (ver skill supabase-schema-costura).
 *
 * Este arquivo nunca deve ser importado diretamente por componentes,
 * apenas pelos hooks em features/financeiro/hooks.
 */

export async function buscarFaturamentoMensal(): Promise<FaturamentoMensal[]> {
  const { data, error } = await supabase.from('vw_faturamento_mensal').select('*')

  if (error) {
    throw new Error(`Falha ao buscar faturamento mensal: ${error.message}`)
  }

  return (data ?? []) as FaturamentoMensal[]
}

export async function buscarFluxoCaixa(): Promise<FluxoCaixaDia[]> {
  const { data, error } = await supabase.from('vw_fluxo_caixa').select('*')

  if (error) {
    throw new Error(`Falha ao buscar fluxo de caixa: ${error.message}`)
  }

  return (data ?? []) as FluxoCaixaDia[]
}

export async function listarLancamentosCaixa(): Promise<LancamentoCaixa[]> {
  const { data, error } = await supabase
    .from('caixa_lancamentos')
    .select('*')
    .order('data_lancamento', { ascending: false })

  if (error) {
    throw new Error(`Falha ao listar lançamentos de caixa: ${error.message}`)
  }

  return (data ?? []) as LancamentoCaixa[]
}

export async function criarLancamentoCaixa(
  input: NovoLancamentoCaixaInput
): Promise<LancamentoCaixa> {
  const { data, error } = await supabase
    .from('caixa_lancamentos')
    .insert({
      tipo: input.tipo,
      descricao: input.descricao,
      valor: input.valor,
      pedido_id: input.pedido_id ?? null,
      compra_id: input.compra_id ?? null,
      data_lancamento: input.data_lancamento ?? new Date().toISOString().slice(0, 10),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Falha ao criar lançamento de caixa: ${error.message}`)
  }

  return data as LancamentoCaixa
}
