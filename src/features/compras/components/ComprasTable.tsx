import * as React from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCompras, useExcluirCompra } from '../hooks/useCompras'
import type { Compra } from '../types/compra.types'

export function ComprasTable() {
  const { data: compras, isLoading, isError, error } = useCompras()
  const excluirCompra = useExcluirCompra()
  const [compraDetalhe, setCompraDetalhe] = React.useState<Compra | null>(null)

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
    <div className="space-y-4">
      <div className="hidden sm:block">
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
      </div>

      {/* Celular: cartão com fornecedor + matéria-prima — toque abre
          detalhes com a ação de excluir. */}
      <div className="sm:hidden space-y-2">
        {(compras ?? []).map((compra) => (
          <button
            key={compra.id}
            type="button"
            onClick={() => setCompraDetalhe(compra)}
            className="w-full flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 text-left min-h-touch"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{compra.fornecedor}</p>
              <p className="text-sm text-muted-foreground truncate">
                {compra.materia_prima?.nome ?? '—'}
              </p>
            </div>
            <p className="text-sm font-medium shrink-0">
              {compra.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </button>
        ))}
        {(compras ?? []).length === 0 && (
          <p className="text-center text-muted-foreground py-4">Nenhuma compra registrada</p>
        )}
      </div>

      <Dialog open={!!compraDetalhe} onOpenChange={(open) => !open && setCompraDetalhe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{compraDetalhe?.fornecedor}</DialogTitle>
          </DialogHeader>
          {compraDetalhe && (
            <div className="space-y-4">
              <div className="text-base space-y-1">
                <p>
                  Data:{' '}
                  {new Date(`${compraDetalhe.data_compra}T00:00:00`).toLocaleDateString('pt-BR')}
                </p>
                <p>Matéria-prima: {compraDetalhe.materia_prima?.nome ?? '—'}</p>
                <p>
                  Quantidade: {compraDetalhe.quantidade}{' '}
                  {compraDetalhe.materia_prima?.unidade_medida ?? ''}
                </p>
                <p>
                  Valor total:{' '}
                  {compraDetalhe.valor_total.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => {
                  handleExcluir(compraDetalhe)
                  setCompraDetalhe(null)
                }}
                disabled={excluirCompra.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Excluir compra
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
