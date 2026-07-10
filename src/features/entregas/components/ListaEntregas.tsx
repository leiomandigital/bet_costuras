import { usePedidos } from '@/features/pedidos/hooks/usePedidos'
import { useAtualizarPedido } from '@/features/pedidos/hooks/useAtualizarPedido'
import { STATUS_PEDIDO_LABEL } from '@/features/pedidos/types/pedido.types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Lista de despacho: reutiliza hooks/tipos de features/pedidos.
//
// Inclui pedidos "finalizado" (todos os itens já produzidos — status
// calculado automaticamente a partir dos itens, ver migration
// 20260710150000_status_por_item_carrinho.sql) para que a equipe possa
// movê-los manualmente para "aguardando_entrega", além dos que já estão
// aguardando entrega ou já entregues.
export function ListaEntregas() {
  const { data: pedidos, isLoading, isError } = usePedidos()
  const atualizarPedido = useAtualizarPedido()

  if (isLoading) return <p className="text-base">Carregando entregas...</p>
  if (isError) return <p className="text-base text-destructive">Erro ao carregar pedidos.</p>

  const pedidosEntrega = (pedidos ?? []).filter(
    (p) => p.status === 'finalizado' || p.status === 'aguardando_entrega' || p.status === 'entregue'
  )

  async function moverParaAguardandoEntrega(id: string) {
    try {
      await atualizarPedido.mutateAsync({ id, status: 'aguardando_entrega' })
      toast.success('Pedido movido para "Aguardando entrega"')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar pedido')
    }
  }

  async function marcarEntregue(id: string) {
    try {
      await atualizarPedido.mutateAsync({ id, status: 'entregue' })
      toast.success('Pedido marcado como entregue')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar pedido')
    }
  }

  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pedidosEntrega.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell className="font-medium">{pedido.numero_pedido}</TableCell>
                <TableCell>{pedido.cliente?.nome ?? '—'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      pedido.status === 'entregue'
                        ? 'entregue'
                        : pedido.status === 'aguardando_entrega'
                          ? 'aguardando-entrega'
                          : 'finalizado'
                    }
                  >
                    {STATUS_PEDIDO_LABEL[pedido.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {pedido.status === 'finalizado' && (
                    <Button
                      size="sm"
                      onClick={() => moverParaAguardandoEntrega(pedido.id)}
                      disabled={atualizarPedido.isPending}
                    >
                      Mover para aguardando entrega
                    </Button>
                  )}
                  {pedido.status === 'aguardando_entrega' && (
                    <Button
                      size="sm"
                      onClick={() => marcarEntregue(pedido.id)}
                      disabled={atualizarPedido.isPending}
                    >
                      Marcar como entregue
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {pedidosEntrega.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum pedido pronto para entrega
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Celular: cartão com cliente + status e o botão de ação embaixo,
          sem precisar de tabela/scroll horizontal. */}
      <div className="sm:hidden space-y-2">
        {pedidosEntrega.map((pedido) => (
          <div key={pedido.id} className="rounded-md border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{pedido.cliente?.nome ?? '—'}</p>
                <p className="text-sm text-muted-foreground truncate">{pedido.numero_pedido}</p>
              </div>
              <Badge
                variant={
                  pedido.status === 'entregue'
                    ? 'entregue'
                    : pedido.status === 'aguardando_entrega'
                      ? 'aguardando-entrega'
                      : 'finalizado'
                }
                className="shrink-0"
              >
                {STATUS_PEDIDO_LABEL[pedido.status]}
              </Badge>
            </div>
            {pedido.status === 'finalizado' && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => moverParaAguardandoEntrega(pedido.id)}
                disabled={atualizarPedido.isPending}
              >
                Mover para aguardando entrega
              </Button>
            )}
            {pedido.status === 'aguardando_entrega' && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => marcarEntregue(pedido.id)}
                disabled={atualizarPedido.isPending}
              >
                Marcar como entregue
              </Button>
            )}
          </div>
        ))}
        {pedidosEntrega.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            Nenhum pedido pronto para entrega
          </p>
        )}
      </div>
    </>
  )
}
