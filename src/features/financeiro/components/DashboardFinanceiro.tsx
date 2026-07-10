import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFaturamentoMensal, useFluxoCaixa } from '../hooks/useFinanceiro'

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarMesLabel(mes: string): string {
  const data = new Date(`${mes}T00:00:00`)
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function DashboardFinanceiro() {
  const { data: faturamentoMensal, isLoading: carregandoFaturamento, isError: erroFaturamento } =
    useFaturamentoMensal()
  const { data: fluxoCaixa, isLoading: carregandoFluxo, isError: erroFluxo } = useFluxoCaixa()

  const mesAtual = faturamentoMensal?.[0]
  const mesAnterior = faturamentoMensal?.[1]

  const ticketMedio =
    mesAtual && mesAtual.total_pedidos > 0 ? mesAtual.faturamento / mesAtual.total_pedidos : 0

  const variacaoPercentual =
    mesAtual && mesAnterior && mesAnterior.faturamento > 0
      ? ((mesAtual.faturamento - mesAnterior.faturamento) / mesAnterior.faturamento) * 100
      : null

  const fluxoUltimos30Dias = React.useMemo(() => {
    if (!fluxoCaixa) return []
    return fluxoCaixa.slice(0, 30)
  }, [fluxoCaixa])

  if (carregandoFaturamento || carregandoFluxo) {
    return <p className="text-base">Carregando dados financeiros...</p>
  }
  if (erroFaturamento || erroFluxo) {
    return <p className="text-base text-destructive">Erro ao carregar dados financeiros.</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              Faturamento do mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-dashboard text-foreground">
              {formatarMoeda(mesAtual?.faturamento ?? 0)}
            </p>
            {variacaoPercentual !== null && (
              <p
                className={
                  variacaoPercentual >= 0
                    ? 'text-sm text-status-finalizado'
                    : 'text-sm text-destructive'
                }
              >
                {variacaoPercentual >= 0 ? '+' : ''}
                {variacaoPercentual.toFixed(1)}% vs. mês anterior
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              Ticket médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-dashboard text-foreground">{formatarMoeda(ticketMedio)}</p>
            <p className="text-sm text-muted-foreground">
              {mesAtual?.total_pedidos ?? 0} pedido(s) no mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-muted-foreground">
              Faturamento mês anterior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-dashboard text-foreground">
              {formatarMoeda(mesAnterior?.faturamento ?? 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              {mesAnterior ? formatarMesLabel(mesAnterior.mes) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-title-sm">Fluxo de caixa (últimos 30 registros)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Entradas</TableHead>
              <TableHead>Saídas</TableHead>
              <TableHead>Saldo do dia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fluxoUltimos30Dias.map((dia) => (
              <TableRow key={dia.data}>
                <TableCell>{new Date(`${dia.data}T00:00:00`).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{formatarMoeda(dia.total_entradas)}</TableCell>
                <TableCell>{formatarMoeda(dia.total_saidas)}</TableCell>
                <TableCell
                  className={dia.saldo_dia >= 0 ? 'text-status-finalizado' : 'text-destructive'}
                >
                  {formatarMoeda(dia.saldo_dia)}
                </TableCell>
              </TableRow>
            ))}
            {fluxoUltimos30Dias.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum lançamento de caixa registrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
