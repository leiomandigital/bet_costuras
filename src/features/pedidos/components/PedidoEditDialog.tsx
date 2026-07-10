import * as React from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAtualizarPedido } from '../hooks/useAtualizarPedido'
import { useAtualizarItemPedido } from '../hooks/useAtualizarItemPedido'
import { useAdicionarItemPedido, useRemoverItemPedido } from '../hooks/useItemPedido'
import { useProdutosProntos } from '@/features/estoque-produtos-prontos/hooks/useEstoqueProdutosProntos'
import type { ItemPedido, Pedido } from '../types/pedido.types'

interface PedidoEditDialogProps {
  pedido: Pedido | null
  onClose: () => void
}

function ItemEditavel({ item, pedidoId }: { item: ItemPedido; pedidoId: string }) {
  const atualizarItem = useAtualizarItemPedido()
  const removerItem = useRemoverItemPedido()
  const [quantidade, setQuantidade] = React.useState(item.quantidade)
  const [valor, setValor] = React.useState(item.valor)

  async function handleSalvarLinha() {
    try {
      await atualizarItem.mutateAsync({ id: item.id, quantidade, valor })
      toast.success('Item atualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar item')
    }
  }

  async function handleRemover() {
    try {
      await removerItem.mutateAsync({ itemId: item.id, pedidoId })
      toast.success('Item removido')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao remover item')
    }
  }

  const alterado = quantidade !== item.quantidade || valor !== item.valor

  return (
    <div className="rounded-md border border-border p-3 space-y-3">
      <div className="flex items-center gap-3">
        {item.drive_url ? (
          <img
            src={item.drive_url}
            alt={item.nome_produto}
            className="h-12 w-12 rounded-md object-cover border border-border"
          />
        ) : (
          <div className="h-12 w-12 rounded-md bg-muted" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{item.nome_produto}</p>
          <p className="text-sm text-muted-foreground">
            {item.categoria} · {item.cor}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remover ${item.nome_produto}`}
          onClick={handleRemover}
          disabled={removerItem.isPending}
        >
          <Trash2 className="h-5 w-5 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="number"
          min={1}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
        />
        <Input
          type="number"
          step="0.01"
          min={0}
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
        />
      </div>

      {alterado && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleSalvarLinha}
          disabled={atualizarItem.isPending}
        >
          {atualizarItem.isPending ? 'Salvando...' : 'Salvar item'}
        </Button>
      )}
    </div>
  )
}

function AdicionarItemAoCarrinho({ pedidoId }: { pedidoId: string }) {
  const { data: produtosProntos } = useProdutosProntos()
  const adicionarItem = useAdicionarItemPedido()
  const [produtoId, setProdutoId] = React.useState('')
  const [quantidade, setQuantidade] = React.useState(1)
  const [valor, setValor] = React.useState(0)

  const produto = produtosProntos?.find((p) => p.id === produtoId) ?? null

  function handleProdutoChange(id: string) {
    setProdutoId(id)
    const p = produtosProntos?.find((item) => item.id === id)
    if (p) setValor(p.valor)
  }

  async function handleAdicionar() {
    if (!produto) {
      toast.error('Selecione um produto')
      return
    }
    try {
      await adicionarItem.mutateAsync({
        pedidoId,
        item: {
          produto_estoque_id: produto.id,
          categoria: produto.categoria,
          nome_produto: produto.nome_produto,
          quantidade,
          cor: produto.cor,
          valor,
          drive_file_id: null,
          drive_url: produto.foto_principal_url ?? null,
        },
      })
      toast.success('Item adicionado ao pedido')
      setProdutoId('')
      setQuantidade(1)
      setValor(0)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao adicionar item')
    }
  }

  return (
    <div className="rounded-md border border-dashed border-border p-3 space-y-3">
      <p className="text-sm font-medium">Adicionar produto ao pedido</p>
      <Select value={produtoId} onValueChange={handleProdutoChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o produto" />
        </SelectTrigger>
        <SelectContent>
          {(produtosProntos ?? []).map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nome_produto} — {p.cor} ({p.categoria})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          type="number"
          min={1}
          value={quantidade}
          onChange={(e) => setQuantidade(Number(e.target.value))}
        />
        <Input
          type="number"
          step="0.01"
          min={0}
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
        />
      </div>
      <Button
        type="button"
        size="sm"
        onClick={handleAdicionar}
        disabled={adicionarItem.isPending}
      >
        {adicionarItem.isPending ? 'Adicionando...' : 'Adicionar ao pedido'}
      </Button>
    </div>
  )
}

export function PedidoEditDialog({ pedido, onClose }: PedidoEditDialogProps) {
  const atualizarPedido = useAtualizarPedido()

  const [pago, setPago] = React.useState(false)
  const [observacoes, setObservacoes] = React.useState('')

  React.useEffect(() => {
    if (pedido) {
      setPago(pedido.pago)
      setObservacoes(pedido.observacoes ?? '')
    }
  }, [pedido])

  async function handleSalvarDadosPedido() {
    if (!pedido) return
    try {
      await atualizarPedido.mutateAsync({ id: pedido.id, pago, observacoes })
      toast.success('Pedido atualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar pedido')
    }
  }

  return (
    <Dialog open={!!pedido} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar pedido {pedido?.numero_pedido}</DialogTitle>
        </DialogHeader>

        {pedido && (
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="font-semibold">Itens do pedido</p>
              {(pedido.itens ?? []).map((item) => (
                <ItemEditavel key={item.id} item={item} pedidoId={pedido.id} />
              ))}
              <AdicionarItemAoCarrinho pedidoId={pedido.id} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Input
                id="edit-observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-base min-h-touch">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={pago}
                onChange={(e) => setPago(e.target.checked)}
              />
              Pedido pago
            </label>

            <Button
              className="w-full"
              onClick={handleSalvarDadosPedido}
              disabled={atualizarPedido.isPending}
            >
              {atualizarPedido.isPending ? 'Salvando...' : 'Salvar observações e pagamento'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
