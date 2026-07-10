import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  useCriarMateriaPrima,
  useExcluirMateriaPrima,
  useMateriaPrima,
  useRegistrarSaidaEstoque,
} from '../hooks/useEstoqueMateriaPrima'
import { LIMITE_ESTOQUE_BAIXO, type MateriaPrima } from '../types/estoqueMateriaPrima.types'

const novaMateriaPrimaSchema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  unidade_medida: z.string().min(1, 'Informe a unidade (ex: metro, un, kg)'),
  quantidade_disponivel: z.coerce.number().nonnegative('Quantidade não pode ser negativa'),
  custo_unitario: z.coerce.number().nonnegative().optional(),
})

type NovaMateriaPrimaValues = z.infer<typeof novaMateriaPrimaSchema>

const saidaEstoqueSchema = z.object({
  quantidade: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  motivo: z.string().optional(),
})

type SaidaEstoqueValues = z.infer<typeof saidaEstoqueSchema>

function NovaMateriaPrimaForm({ onSucesso }: { onSucesso: () => void }) {
  const form = useForm<NovaMateriaPrimaValues>({
    resolver: zodResolver(novaMateriaPrimaSchema),
    defaultValues: { nome: '', unidade_medida: '', quantidade_disponivel: 0, custo_unitario: 0 },
  })
  const criarMateriaPrima = useCriarMateriaPrima()

  async function onSubmit(values: NovaMateriaPrimaValues) {
    try {
      await criarMateriaPrima.mutateAsync(values)
      toast.success('Matéria-prima cadastrada')
      form.reset()
      onSucesso()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao cadastrar matéria-prima')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: Tecido nylon 600" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unidade_medida"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidade de medida</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: metro, un, kg" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantidade_disponivel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade inicial</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="custo_unitario"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custo unitário (R$, opcional)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={criarMateriaPrima.isPending}>
          {criarMateriaPrima.isPending ? 'Salvando...' : 'Cadastrar'}
        </Button>
      </form>
    </Form>
  )
}

function SaidaEstoqueForm({
  materiaPrima,
  onSucesso,
}: {
  materiaPrima: MateriaPrima
  onSucesso: () => void
}) {
  const form = useForm<SaidaEstoqueValues>({
    resolver: zodResolver(saidaEstoqueSchema),
    defaultValues: { quantidade: 0, motivo: '' },
  })
  const registrarSaida = useRegistrarSaidaEstoque()

  async function onSubmit(values: SaidaEstoqueValues) {
    try {
      await registrarSaida.mutateAsync({
        materia_prima_id: materiaPrima.id,
        quantidade: values.quantidade,
        motivo: values.motivo,
      })
      toast.success('Saída de estoque registrada')
      form.reset()
      onSucesso()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao registrar saída')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-base">
          Disponível: {materiaPrima.quantidade_disponivel} {materiaPrima.unidade_medida}
        </p>
        <FormField
          control={form.control}
          name="quantidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade de saída</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min={0} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="motivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo (opcional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ex: uso em produção" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={registrarSaida.isPending}>
          {registrarSaida.isPending ? 'Salvando...' : 'Registrar saída'}
        </Button>
      </form>
    </Form>
  )
}

export function EstoqueMateriaPrimaTable() {
  const { data: materiaPrima, isLoading, isError, error } = useMateriaPrima()
  const excluirMateriaPrima = useExcluirMateriaPrima()
  const [dialogNovoAberto, setDialogNovoAberto] = React.useState(false)
  const [itemSaidaAtivo, setItemSaidaAtivo] = React.useState<MateriaPrima | null>(null)

  async function handleExcluir(item: MateriaPrima) {
    if (!window.confirm(`Excluir a matéria-prima "${item.nome}"? Essa ação não pode ser desfeita.`)) {
      return
    }
    try {
      await excluirMateriaPrima.mutateAsync(item.id)
      toast.success('Matéria-prima excluída')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao excluir matéria-prima')
    }
  }

  if (isLoading) return <p className="text-base">Carregando matéria-prima...</p>
  if (isError)
    return (
      <p className="text-base text-destructive">
        Erro ao carregar matéria-prima: {error instanceof Error ? error.message : 'desconhecido'}
      </p>
    )

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogNovoAberto} onOpenChange={setDialogNovoAberto}>
          <DialogTrigger asChild>
            <Button>Nova matéria-prima</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova matéria-prima</DialogTitle>
            </DialogHeader>
            <NovaMateriaPrimaForm onSucesso={() => setDialogNovoAberto(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Custo unitário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(materiaPrima ?? []).map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.nome}</TableCell>
              <TableCell>{item.quantidade_disponivel}</TableCell>
              <TableCell>{item.unidade_medida}</TableCell>
              <TableCell>
                {item.custo_unitario != null
                  ? item.custo_unitario.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  : '—'}
              </TableCell>
              <TableCell>
                {item.quantidade_disponivel < LIMITE_ESTOQUE_BAIXO && (
                  <Badge variant="destructive">Estoque baixo</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Dialog
                    open={itemSaidaAtivo?.id === item.id}
                    onOpenChange={(open) => setItemSaidaAtivo(open ? item : null)}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        Lançar saída
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Saída de estoque — {item.nome}</DialogTitle>
                      </DialogHeader>
                      <SaidaEstoqueForm
                        materiaPrima={item}
                        onSucesso={() => setItemSaidaAtivo(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${item.nome}`}
                    onClick={() => handleExcluir(item)}
                    disabled={excluirMateriaPrima.isPending}
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {(materiaPrima ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhuma matéria-prima cadastrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
