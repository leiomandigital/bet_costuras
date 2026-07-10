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
import { Button } from '@/components/ui/button'
import { useExcluirProdutoPronto, useProdutosProntos } from '../hooks/useEstoqueProdutosProntos'
import { ProdutoDialog } from './ProdutoDialog'
import type { ProdutoPronto } from '../types/estoqueProdutosProntos.types'

export function EstoqueProdutosProntosTable() {
  const { data: produtos, isLoading, isError, error } = useProdutosProntos()
  const excluirProduto = useExcluirProdutoPronto()
  const [dialogAberto, setDialogAberto] = React.useState(false)
  const [produtoEditando, setProdutoEditando] = React.useState<ProdutoPronto | null>(null)

  function abrirNovoProduto() {
    setProdutoEditando(null)
    setDialogAberto(true)
  }

  function abrirEdicao(produto: ProdutoPronto) {
    setProdutoEditando(produto)
    setDialogAberto(true)
  }

  async function handleExcluir(produto: ProdutoPronto) {
    if (
      !window.confirm(
        `Excluir o produto "${produto.nome_produto}"? Essa ação não pode ser desfeita.`
      )
    ) {
      return
    }
    try {
      await excluirProduto.mutateAsync(produto.id)
      toast.success('Produto excluído')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao excluir produto')
    }
  }

  if (isLoading) return <p className="text-base">Carregando produtos prontos...</p>
  if (isError)
    return (
      <p className="text-base text-destructive">
        Erro ao carregar produtos prontos: {error instanceof Error ? error.message : 'desconhecido'}
      </p>
    )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {/* Mesmo padrão dos outros "Novo X": círculo com "+" no celular,
            texto no desktop. */}
        <Button
          size="icon"
          onClick={abrirNovoProduto}
          className="rounded-full sm:rounded-md sm:h-10 sm:w-auto sm:px-4"
          aria-label="Nova entrada manual"
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
          <span className="hidden sm:inline">Nova entrada manual</span>
        </Button>
      </div>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(produtos ?? []).map((produto) => (
              <TableRow key={produto.id}>
                <TableCell>
                  {produto.foto_principal_url ? (
                    <img
                      src={produto.foto_principal_url}
                      alt={produto.nome_produto}
                      className="h-12 w-12 rounded-md object-cover border border-border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-muted" aria-hidden />
                  )}
                </TableCell>
                <TableCell>{produto.categoria}</TableCell>
                <TableCell className="font-medium">{produto.nome_produto}</TableCell>
                <TableCell>{produto.cor}</TableCell>
                <TableCell>{produto.quantidade}</TableCell>
                <TableCell>
                  {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Editar ${produto.nome_produto}`}
                      onClick={() => abrirEdicao(produto)}
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Excluir ${produto.nome_produto}`}
                      onClick={() => handleExcluir(produto)}
                      disabled={excluirProduto.isPending}
                    >
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(produtos ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum produto pronto cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Celular: cartão com foto + nome — toque abre edição/exclusão. */}
      <div className="sm:hidden space-y-2">
        {(produtos ?? []).map((produto) => (
          <button
            key={produto.id}
            type="button"
            onClick={() => abrirEdicao(produto)}
            className="w-full flex items-center gap-3 rounded-md border border-border bg-background p-3 text-left min-h-touch"
          >
            {produto.foto_principal_url ? (
              <img
                src={produto.foto_principal_url}
                alt={produto.nome_produto}
                className="h-12 w-12 shrink-0 rounded-md object-cover border border-border"
              />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded-md bg-muted" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{produto.nome_produto}</p>
              <p className="text-sm text-muted-foreground truncate">
                {produto.categoria} · estoque: {produto.quantidade}
              </p>
            </div>
          </button>
        ))}
        {(produtos ?? []).length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            Nenhum produto pronto cadastrado
          </p>
        )}
      </div>

      <ProdutoDialog
        produto={produtoEditando}
        aberto={dialogAberto}
        onOpenChange={setDialogAberto}
        onExcluir={(p) => {
          handleExcluir(p)
          setDialogAberto(false)
        }}
        excluindo={excluirProduto.isPending}
      />
    </div>
  )
}
