import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useCompras, useExcluirCompra } from '../hooks/useCompras'
import type { Compra } from '../types/compra.types'

export function ComprasTable() {
  const { data: compras, isLoading, isError, error } = useCompras()
  const excluirCompra = useExcluirCompra()

  async function handleExcluir(compra: Compra) {
    if (
      !window.confirm(
        `Excluir a compra de "${compra.materia_prima?.nome ?? 'item'}" de ${compra.fornecedor}? Essa ação não pode ser desfeita.`
      )
    ) {
      return
    }
    try {
      await excluirCompra.mutateAsync(compra.id)
      toast.success('Compra excluída')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao excluir compra')
    }
  }

  if (isLoading) return <p className="text-base">Carregando compras...</p>
  if (isError)
    return (
      <p className="text-base text-destructive">
        Erro ao carregar compras: {error instanceof Error ? error.message : 'desconhecido'}
      </p>
    )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Fornecedor</TableHead>
          <TableHead>Matéria-prima</TableHead>
          <TableHead>Quantidade</TableHead>
          <TableHead>Valor total</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(compras ?? []).map((compra) => (
          <TableRow key={compra.id}>
            <TableCell>
              {new Date(`${compra.data_compra}T00:00:00`).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell className="font-medium">{compra.fornecedor}</TableCell>
            <TableCell>{compra.materia_prima?.nome ?? '—'}</TableCell>
            <TableCell>
              {compra.quantidade} {compra.materia_prima?.unidade_medida ?? ''}
            </TableCell>
            <TableCell>
              {compra.valor_total.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Excluir compra de ${compra.fornecedor}`}
                onClick={() => handleExcluir(compra)}
                disabled={excluirCompra.isPending}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {(compras ?? []).length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              Nenhuma compra registrada
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
