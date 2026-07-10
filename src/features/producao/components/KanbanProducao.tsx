import { usePedidos } from '@/features/pedidos/hooks/usePedidos'
import { useAtualizarStatusItemPedido } from '@/features/pedidos/hooks/useItemPedido'
import {
  STATUS_PEDIDO_LABEL,
  STATUS_ITEM_PEDIDO_ORDEM,
  type ItemPedido,
  type Pedido,
  type StatusItemPedido,
} from '@/features/pedidos/types/pedido.types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'

// Kanban de produção opera por ITEM, não por pedido inteiro: cada peça
// avança individualmente pela produção. O status do pedido (usado no
// painel de Entregas) é recalculado automaticamente no banco a partir do
// status de todos os itens (ver migration
// 20260710150000_status_por_item_carrinho.sql) — só vira "finalizado"
// quando todo o carrinho estiver pronto.
const PROXIMO_STATUS: Partial<Record<StatusItemPedido, StatusItemPedido>> = {
  a_produzir: 'em_andamento',
  em_andamento: 'finalizado',
}

const COLUNA_ESTILO: Record<StatusItemPedido, { faixa: string; badge: string }> = {
  a_produzir: { faixa: 'bg-status-a-produzir', badge: 'bg-status-a-produzir/10 text-status-a-produzir' },
  em_andamento: {
    faixa: 'bg-status-em-andamento',
    badge: 'bg-status-em-andamento/10 text-status-em-andamento',
  },
  finalizado: { faixa: 'bg-status-finalizado', badge: 'bg-status-finalizado/10 text-status-finalizado' },
}

interface ItemComPedido extends ItemPedido {
  pedido: Pedido
}

export function KanbanProducao() {
  const { data: pedidos, isLoading, isError } = usePedidos()
  const atualizarStatusItem = useAtualizarStatusItemPedido()

  if (isLoading) return <p className="text-base">Carregando produção...</p>
  if (isError) return <p className="text-base text-destructive">Erro ao carregar pedidos.</p>

  // "finalizado" some do quadro assim que o pedido inteiro vira
  // aguardando_entrega/entregue (o item mantém status finalizado, mas o
  // pedido já saiu do ciclo de produção) — por isso filtramos por pedidos
  // ainda em produção.
  const pedidosEmProducao = (pedidos ?? []).filter((p) =>
    ['a_produzir', 'em_andamento', 'finalizado'].includes(p.status)
  )

  const itensComPedido: ItemComPedido[] = pedidosEmProducao.flatMap((pedido) =>
    (pedido.itens ?? []).map((item) => ({ ...item, pedido }))
  )

  async function avancarStatus(item: ItemComPedido) {
    const proximo = PROXIMO_STATUS[item.status]
    if (!proximo) return
    try {
      await atualizarStatusItem.mutateAsync({ itemId: item.id, status: proximo })
      toast.success(`${item.nome_produto} movido para "${STATUS_PEDIDO_LABEL[proximo]}"`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao mover item')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {STATUS_ITEM_PEDIDO_ORDEM.map((coluna) => {
        const itensColuna = itensComPedido.filter((item) => item.status === coluna)
        const estilo = COLUNA_ESTILO[coluna]
        return (
          <div key={coluna} className="rounded-lg border border-border bg-muted/40 overflow-hidden">
            <div className={cn('h-1.5 w-full', estilo.faixa)} />
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="text-title-sm">{STATUS_PEDIDO_LABEL[coluna]}</h2>
              <span
                className={cn(
                  'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-semibold',
                  estilo.badge
                )}
              >
                {itensColuna.length}
              </span>
            </div>

            <div className="space-y-3 px-4 pb-4 min-h-touch">
              {itensColuna.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border bg-background p-3 shadow-sm space-y-3"
                >
                  <div className="flex gap-3">
                    {item.drive_url ? (
                      <img
                        src={item.drive_url}
                        alt={item.nome_produto}
                        className="h-14 w-14 shrink-0 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-md bg-muted" aria-hidden />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">{item.pedido.numero_pedido}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.pedido.cliente?.nome ?? 'Cliente não informado'}
                      </p>
                      <p className="text-sm truncate">
                        {item.nome_produto} · {item.quantidade}x
                      </p>
                    </div>
                  </div>

                  {PROXIMO_STATUS[coluna] && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-center gap-1.5"
                      onClick={() => avancarStatus(item)}
                      disabled={atualizarStatusItem.isPending}
                    >
                      {STATUS_PEDIDO_LABEL[PROXIMO_STATUS[coluna]!]}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {itensColuna.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">Nenhum item</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
