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
import { Card } from '@/components/ui/card'
import { useCriarPedido } from '../hooks/useCriarPedido'
import { SelecionarClienteField } from '@/features/clientes/components/SelecionarClienteField'
import { useProdutosProntos } from '@/features/estoque-produtos-prontos/hooks/useEstoqueProdutosProntos'
import type { NovoItemPedidoInput } from '../types/pedido.types'

interface ItemCarrinho extends NovoItemPedidoInput {
  chave: string
}

interface PedidoFormProps {
  onSucesso?: () => void
}

export function PedidoForm({ onSucesso }: PedidoFormProps) {
  const criarPedido = useCriarPedido()
  const { data: produtosProntos, isLoading: carregandoProdutos } = useProdutosProntos()

  const [clienteId, setClienteId] = React.useState('')
  const [observacoes, setObservacoes] = React.useState('')
  const [carrinho, setCarrinho] = React.useState<ItemCarrinho[]>([])

  const [produtoSelecionadoId, setProdutoSelecionadoId] = React.useState('')
  const [quantidade, setQuantidade] = React.useState(1)
  const [valor, setValor] = React.useState(0)

  const produtoSelecionado = React.useMemo(
    () => produtosProntos?.find((p) => p.id === produtoSelecionadoId) ?? null,
    [produtosProntos, produtoSelecionadoId]
  )

  function handleProdutoChange(produtoId: string) {
    setProdutoSelecionadoId(produtoId)
    const produto = produtosProntos?.find((p) => p.id === produtoId)
    if (produto) {
      // Valor nasce do produto selecionado, mas continua sempre editável
      // (ver skill dominio-negocio-costura).
      setValor(produto.valor)
    }
  }

  function handleAdicionarAoCarrinho() {
    if (!produtoSelecionado) {
      toast.error('Selecione um produto')
      return
    }
    setCarrinho((atual) => [
      ...atual,
      {
        chave: crypto.randomUUID(),
        produto_estoque_id: produtoSelecionado.id,
        categoria: produtoSelecionado.categoria,
        nome_produto: produtoSelecionado.nome_produto,
        quantidade,
        cor: produtoSelecionado.cor,
        valor,
        drive_file_id: null,
        drive_url: produtoSelecionado.foto_principal_url ?? null,
      },
    ])
    setProdutoSelecionadoId('')
    setQuantidade(1)
    setValor(0)
  }

  function handleRemoverDoCarrinho(chave: string) {
    setCarrinho((atual) => atual.filter((item) => item.chave !== chave))
  }

  const valorTotalCarrinho = carrinho.reduce((acc, item) => acc + item.valor * item.quantidade, 0)

  async function handleCriarPedido() {
    if (!clienteId) {
      toast.error('Selecione um cliente')
      return
    }
    if (carrinho.length === 0) {
      toast.error('Adicione ao menos um produto ao carrinho')
      return
    }
    try {
      await criarPedido.mutateAsync({
        cliente_id: clienteId,
        observacoes,
        itens: carrinho.map(({ chave: _chave, ...item }) => item),
      })
      toast.success('Pedido criado com sucesso')
      setClienteId('')
      setObservacoes('')
      setCarrinho([])
      onSucesso?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao criar pedido')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label>Cliente</Label>
        <SelecionarClienteField value={clienteId} onChange={setClienteId} />
      </div>

      <Card className="p-4 space-y-4">
        <p className="font-semibold">Adicionar produto ao pedido</p>

        <div className="space-y-2">
          <Label>Produto</Label>
          <Select value={produtoSelecionadoId} onValueChange={handleProdutoChange}>
            <SelectTrigger>
              <SelectValue
                placeholder={carregandoProdutos ? 'Carregando produtos...' : 'Selecione o produto'}
              />
            </SelectTrigger>
            <SelectContent>
              {(produtosProntos ?? []).map((produto) => (
                <SelectItem key={produto.id} value={produto.id}>
                  {produto.nome_produto} — {produto.cor} ({produto.categoria}) · estoque:{' '}
                  {produto.quantidade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {produtoSelecionado && (
          <div className="flex items-center gap-4 rounded-md border border-border p-3">
            {produtoSelecionado.foto_principal_url ? (
              <img
                src={produtoSelecionado.foto_principal_url}
                alt={produtoSelecionado.nome_produto}
                className="h-16 w-16 rounded-md object-cover border border-border"
              />
            ) : (
              <div className="h-16 w-16 rounded-md bg-muted" aria-hidden />
            )}
            <div className="text-base">
              <p className="font-medium">{produtoSelecionado.nome_produto}</p>
              <p className="text-muted-foreground">
                {produtoSelecionado.categoria} · {produtoSelecionado.cor}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
            />
          </div>
        </div>

        <Button type="button" variant="secondary" onClick={handleAdicionarAoCarrinho}>
          Adicionar ao pedido
        </Button>
      </Card>

      {carrinho.length > 0 && (
        <div className="space-y-3">
          <p className="font-semibold">Itens do pedido ({carrinho.length})</p>
          {carrinho.map((item) => (
            <div
              key={item.chave}
              className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.drive_url ? (
                  <img
                    src={item.drive_url}
                    alt={item.nome_produto}
                    className="h-12 w-12 shrink-0 rounded-md object-cover border border-border"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-md bg-muted" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.nome_produto}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantidade}x ·{' '}
                    {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover ${item.nome_produto} do pedido`}
                onClick={() => handleRemoverDoCarrinho(item.chave)}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          ))}
          <p className="text-lg font-semibold text-right">
            Total:{' '}
            {valorTotalCarrinho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label>Observações (opcional)</Label>
        <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={handleCriarPedido}
        disabled={criarPedido.isPending}
      >
        {criarPedido.isPending ? 'Salvando...' : 'Criar pedido'}
      </Button>
    </div>
  )
}
