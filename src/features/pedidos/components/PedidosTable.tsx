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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePedidos } from '../hooks/usePedidos'
import { useExcluirPedido } from '../hooks/useExcluirPedido'
import { PedidoEditDialog } from './PedidoEditDialog'
import { PedidoForm } from './PedidoForm'
import {
  STATUS_PEDIDO_LABEL,
  STATUS_PEDIDO_ORDEM,
  type Pedido,
  type StatusPedido,
} from '../types/pedido.types'

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
  const [filtroStatus, setFiltroStatus] = React.useState<StatusPedido | 'todos'>('todos')
  const [filtroCliente, setFiltroCliente] = React.useState('')
  const [filtroCategoria, setFiltroCategoria] = React.useState('')
  const [pedidoEditando, setPedidoEditando] = React.useState<Pedido | null>(null)
  const [dialogNovoAberto, setDialogNovoAberto] = React.useState(false)

  const pedidosFiltrados = React.useMemo(() => {
    if (!pedidos) return []
    return pedidos.filter((pedido) => {
      if (filtroStatus !== 'todos' && pedido.status !== filtroStatus) return false
      if (
        filtroCliente &&
        !pedido.cliente?.nome.toLowerCase().includes(filtroCliente.toLowerCase())
      )
        return false
      if (
        filtroCategoria &&
        !pedido.itens?.some((item) =>
          item.categoria.toLowerCase().includes(filtroCategoria.toLowerCase())
        )
      )
        return false
      return true
    })
  }, [pedidos, filtroStatus, filtroCliente, filtroCategoria])

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
      <div className="flex justify-end">
        <Dialog open={dialogNovoAberto} onOpenChange={setDialogNovoAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Novo pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo pedido</DialogTitle>
            </DialogHeader>
            <PedidoForm onSucesso={() => setDialogNovoAberto(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Filtrar por cliente"
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filtrar por categoria"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={filtroStatus}
          onValueChange={(v) => setFiltroStatus(v as StatusPedido | 'todos')}
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUS_PEDIDO_ORDEM.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_PEDIDO_LABEL[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      <PedidoEditDialog pedido={pedidoEditando} onClose={() => setPedidoEditando(null)} />
    </div>
  )
}
