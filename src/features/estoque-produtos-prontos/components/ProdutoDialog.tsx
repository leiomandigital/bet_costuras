import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Star, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import {
  useAdicionarFotoProduto,
  useAtualizarProdutoPronto,
  useCriarProdutoPronto,
  useMarcarFotoPrincipal,
  useRemoverFotoProduto,
} from '../hooks/useEstoqueProdutosProntos'
import type { ProdutoPronto } from '../types/estoqueProdutosProntos.types'

const produtoFormSchema = z.object({
  categoria: z.string().min(1, 'Informe a categoria'),
  nome_produto: z.string().min(1, 'Informe o nome do produto'),
  cor: z.string().min(1, 'Informe a cor'),
  quantidade: z.coerce.number().int().nonnegative('Quantidade não pode ser negativa'),
  valor: z.coerce.number().nonnegative('Valor não pode ser negativo'),
})

type ProdutoFormValues = z.infer<typeof produtoFormSchema>

interface ProdutoDialogProps {
  produto: ProdutoPronto | null
  aberto: boolean
  onOpenChange: (aberto: boolean) => void
  onExcluir?: (produto: ProdutoPronto) => void
  excluindo?: boolean
}

/**
 * Dialog único de criar/editar produto pronto. Sem `produto` (criação),
 * mostra só os campos — a galeria de fotos aparece assim que o produto é
 * salvo, permitindo adicionar fotos na mesma sessão do cadastro.
 */
export function ProdutoDialog({
  produto,
  aberto,
  onOpenChange,
  onExcluir,
  excluindo,
}: ProdutoDialogProps) {
  const [produtoAtual, setProdutoAtual] = React.useState<ProdutoPronto | null>(produto)

  React.useEffect(() => {
    setProdutoAtual(produto)
  }, [produto])

  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoFormSchema),
    values: {
      categoria: produtoAtual?.categoria ?? '',
      nome_produto: produtoAtual?.nome_produto ?? '',
      cor: produtoAtual?.cor ?? '',
      quantidade: produtoAtual?.quantidade ?? 1,
      valor: produtoAtual?.valor ?? 0,
    },
  })

  const criarProduto = useCriarProdutoPronto()
  const atualizarProduto = useAtualizarProdutoPronto()
  const adicionarFoto = useAdicionarFotoProduto()
  const removerFoto = useRemoverFotoProduto()
  const marcarPrincipal = useMarcarFotoPrincipal()

  const salvandoDados = criarProduto.isPending || atualizarProduto.isPending

  async function onSubmit(values: ProdutoFormValues) {
    try {
      if (produtoAtual) {
        const atualizado = await atualizarProduto.mutateAsync({ id: produtoAtual.id, ...values })
        setProdutoAtual(atualizado)
        toast.success('Produto atualizado')
      } else {
        const criado = await criarProduto.mutateAsync(values)
        setProdutoAtual(criado)
        toast.success('Produto cadastrado — agora você pode adicionar fotos')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar produto')
    }
  }

  async function handleAdicionarFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    if (!produtoAtual || arquivos.length === 0) return

    const semFotoAinda = (produtoAtual.fotos ?? []).length === 0

    for (let i = 0; i < arquivos.length; i++) {
      try {
        const fotoCriada = await adicionarFoto.mutateAsync({
          produtoId: produtoAtual.id,
          categoria: produtoAtual.categoria,
          nomeProduto: produtoAtual.nome_produto,
          file: arquivos[i],
          marcarComoPrincipal: semFotoAinda && i === 0,
        })
        // Atualiza a galeria na hora — não espera o refetch da lista de
        // produtos (invalidateQueries) pra aparecer, já que esse dialog
        // guarda seu próprio snapshot do produto em produtoAtual.
        setProdutoAtual((atual) =>
          atual
            ? {
                ...atual,
                fotos: [
                  ...(atual.fotos ?? []).map((f) =>
                    fotoCriada.principal ? { ...f, principal: false } : f
                  ),
                  fotoCriada,
                ],
              }
            : atual
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Falha ao enviar foto')
      }
    }
    toast.success(arquivos.length > 1 ? 'Fotos adicionadas' : 'Foto adicionada')
    e.target.value = ''
  }

  async function handleRemoverFoto(fotoId: string) {
    const foto = produtoAtual?.fotos?.find((f) => f.id === fotoId)
    if (!foto) return
    try {
      await removerFoto.mutateAsync(foto)
      setProdutoAtual((atual) =>
        atual ? { ...atual, fotos: (atual.fotos ?? []).filter((f) => f.id !== fotoId) } : atual
      )
      toast.success('Foto removida')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao remover foto')
    }
  }

  async function handleMarcarPrincipal(fotoId: string) {
    if (!produtoAtual) return
    try {
      await marcarPrincipal.mutateAsync({ fotoId, produtoId: produtoAtual.id })
      setProdutoAtual((atual) =>
        atual
          ? {
              ...atual,
              fotos: (atual.fotos ?? []).map((f) => ({ ...f, principal: f.id === fotoId })),
            }
          : atual
      )
      toast.success('Foto principal atualizada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao definir foto principal')
    }
  }

  function handleOpenChange(novoAberto: boolean) {
    if (!novoAberto) {
      form.reset()
      setProdutoAtual(null)
    }
    onOpenChange(novoAberto)
  }

  return (
    <Dialog open={aberto} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{produtoAtual ? 'Editar produto' : 'Novo produto pronto'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Mochilas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nome_produto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Mochila personalizada P" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Azul marinho" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={salvandoDados}>
              {salvandoDados ? 'Salvando...' : produtoAtual ? 'Salvar alterações' : 'Cadastrar produto'}
            </Button>
          </form>
        </Form>

        {produtoAtual && (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="font-semibold">Fotos do produto</p>

            {(produtoAtual.fotos ?? []).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(produtoAtual.fotos ?? []).map((foto) => (
                  <div key={foto.id} className="relative">
                    <img
                      src={foto.storage_url}
                      alt={produtoAtual.nome_produto}
                      className={cn(
                        'h-24 w-full rounded-md object-cover border-2',
                        foto.principal ? 'border-primary' : 'border-border'
                      )}
                    />
                    <div className="absolute top-1 right-1 flex gap-1">
                      <button
                        type="button"
                        aria-label="Marcar como foto principal"
                        onClick={() => handleMarcarPrincipal(foto.id)}
                        className="rounded-full bg-background/90 p-1 min-h-touch min-w-touch flex items-center justify-center"
                      >
                        <Star
                          className={cn(
                            'h-4 w-4',
                            foto.principal ? 'fill-primary text-primary' : 'text-muted-foreground'
                          )}
                        />
                      </button>
                      <button
                        type="button"
                        aria-label="Remover foto"
                        onClick={() => handleRemoverFoto(foto.id)}
                        className="rounded-full bg-background/90 p-1 min-h-touch min-w-touch flex items-center justify-center"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdicionarFotos}
                disabled={adicionarFoto.isPending}
              />
              {adicionarFoto.isPending && (
                <p className="text-sm text-muted-foreground">Enviando foto(s)...</p>
              )}
            </div>
          </div>
        )}

        {produtoAtual && onExcluir && (
          <Button
            type="button"
            variant="outline"
            className="w-full text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => onExcluir(produtoAtual)}
            disabled={excluindo}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Excluir produto
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
