import * as React from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePedidos } from '../hooks/usePedidos'
import { useExcluirPedido } from '../hooks/useExcluirPedido'
import { PedidoEditDialog } from './PedidoEditDialog'
import { PedidoForm } from './PedidoForm'
import { STATUS_PEDIDO_LABEL, type Pedido, type StatusPedido } from '../types/pedido.types'

const STATUS_BADGE_VARIANT: Record<StatusPedido, string> = {
  a_produzir: 'a-produzir',
  em_andamento: 'em-andamento',
  finalizado: 'finalizado',
  aguardando_entrega: 'aguardando-entrega',
  entregue: 'entregue',
}

export function PedidosTable() {
  const { data: pedidos, isLoading, isError, error } = usePedidos()
  const excluirPedido = useExcluirPedido()
  const [busca, setBusca] = React.useState('')
  const [pedidoEditando, setPedidoEditando] = React.useState<Pedido | null>(null)
  const [dialogNovoAberto, setDialogNovoAberto] = React.useState(false)

  const pedidosFiltrados = React.useMemo(() => {
    if (!pedidos) return []
    const termo = busca.trim().toLowerCase()
    if (!termo) return pedidos
    return pedidos.filter((pedido) => {
      if (pedido.cliente?.nome.toLowerCase().includes(termo)) return true
      return (pedido.itens ?? []).some(
        (item) =>
          item.categoria.toLowerCase().includes(termo) ||
          item.nome_produto.toLowerCase().includes(termo)
      )
    })
  }, [pedidos, busca])

  async function handleExcluir(pedido: Pedido) {
    if (!window.confirm(`Excluir o pedido ${pedido.numero_pedido}? Essa ação não pode ser desfeita.`)) {
      return
    }
    try {
      await excluirPedido.mutateAsync(pedido.id)
      toast.success('Pedido excluído')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao excluir pedido')
    }
  }

  if (isLoading) return <p className="text-base">Carregando pedidos...</p>
  if (isError)
    return (
      <p className="text-base text-destructive">
        Erro ao carregar pedidos: {error instanceof Error ? error.message : 'desconhecido'}
      </p>
    )

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por cliente, categoria ou produto"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {/* Dialog controlado — botão de abrir muda de lugar/forma conforme a
          tela (topo no desktop, flutuante no canto no celular). */}
      <Dialog open={dialogNovoAberto} onOpenChange={setDialogNovoAberto}>
        <div className="hidden sm:flex justify-end">
          <Button onClick={() => setDialogNovoAberto(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo pedido
          </Button>
        </div>

        {/* Celular: botão flutuante fixo no canto inferior direito, acima
            do menu do rodapé. */}
        <Button
          size="icon"
          onClick={() => setDialogNovoAberto(true)}
          aria-label="Novo pedido"
          className="sm:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo pedido</DialogTitle>
          </DialogHeader>
          <PedidoForm onSucesso={() => setDialogNovoAberto(false)} />
        </DialogContent>
      </Dialog>

      {/* Desktop: tabela completa. */}
      <div className="hidden sm:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidosFiltrados.map((pedido: Pedido) => (
            <TableRow key={pedido.id}>
              <TableCell className="font-medium">{pedido.numero_pedido}</TableCell>
              <TableCell>{pedido.cliente?.nome ?? '—'}</TableCell>
              <TableCell>
                {pedido.itens?.map((i) => i.categoria).join(', ') || '—'}
              </TableCell>
              <TableCell>
                {pedido.valor_total.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE_VARIANT[pedido.status] as any}>
                  {STATUS_PEDIDO_LABEL[pedido.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={pedido.pago ? 'finalizado' : 'destructive'}>
                  {pedido.pago ? 'Pago' : 'Não pago'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar pedido ${pedido.numero_pedido}`}
                    onClick={() => setPedidoEditando(pedido)}
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir pedido ${pedido.numero_pedido}`}
                    onClick={() => handleExcluir(pedido)}
                    disabled={excluirPedido.isPending}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {pedidosFiltrados.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Nenhum pedido encontrado
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {/* Celular: lista de cartões só com cliente + status — toque abre o
          modal com detalhes e ações (editar, excluir), evitando scroll
          horizontal de tabela. */}
      <div className="sm:hidden space-y-2">
        {pedidosFiltrados.map((pedido: Pedido) => (
          <button
            key={pedido.id}
            type="button"
            onClick={() => setPedidoEditando(pedido)}
            className="w-full flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 text-left min-h-touch"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{pedido.cliente?.nome ?? '—'}</p>
              <p className="text-sm text-muted-foreground truncate">
                {pedido.numero_pedido} ·{' '}
                {pedido.valor_total.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>
            <Badge variant={STATUS_BADGE_VARIANT[pedido.status] as any} className="shrink-0">
              {STATUS_PEDIDO_LABEL[pedido.status]}
            </Badge>
          </button>
        ))}
        {pedidosFiltrados.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Nenhum pedido encontrado</p>
        )}
      </div>

      <PedidoEditDialog
        pedido={pedidoEditando}
        onClose={() => setPedidoEditando(null)}
        onExcluir={handleExcluir}
      />
    </div>
  )
}
