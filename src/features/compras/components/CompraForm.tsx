import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useMateriaPrima } from '@/features/estoque-materia-prima/hooks/useEstoqueMateriaPrima'
import { useCriarCompra } from '../hooks/useCompras'

const compraFormSchema = z.object({
  fornecedor: z.string().min(1, 'Informe o fornecedor'),
  materia_prima_id: z.string().min(1, 'Selecione a matéria-prima'),
  quantidade: z.coerce.number().positive('Quantidade deve ser maior que zero'),
  valor_total: z.coerce.number().nonnegative('Valor não pode ser negativo'),
  data_compra: z.string().min(1, 'Informe a data'),
})

type CompraFormValues = z.infer<typeof compraFormSchema>

interface CompraFormProps {
  onSucesso?: () => void
}

export function CompraForm({ onSucesso }: CompraFormProps) {
  const { data: materiaPrima } = useMateriaPrima()
  const criarCompra = useCriarCompra()

  const form = useForm<CompraFormValues>({
    resolver: zodResolver(compraFormSchema),
    defaultValues: {
      fornecedor: '',
      materia_prima_id: '',
      quantidade: 0,
      valor_total: 0,
      data_compra: new Date().toISOString().slice(0, 10),
    },
  })

  async function onSubmit(values: CompraFormValues) {
    try {
      await criarCompra.mutateAsync(values)
      toast.success('Compra registrada e estoque atualizado')
      form.reset()
      onSucesso?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao registrar compra')
    }
  }

  return (
    <div className="space-y-4">
      {/* OCR de cupom fiscal é fora de escopo deste ambiente. O lançamento
          manual abaixo é sempre o caminho funcional, conforme skill
          dominio-negocio-costura / google-drive-media-integration: a
          alternativa manual nunca pode ficar indisponível. */}
      <Button
        type="button"
        variant="outline"
        disabled
        title="Leitura automática de cupom fiscal está planejada, mas ainda não implementada. Use o lançamento manual abaixo."
      >
        Ler cupom fiscal (em breve)
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
          <FormField
            control={form.control}
            name="fornecedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome do fornecedor" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="materia_prima_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matéria-prima</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a matéria-prima" />
                    </SelectTrigger>
                    <SelectContent>
                      {(materiaPrima ?? []).map((mp) => (
                        <SelectItem key={mp.id} value={mp.id}>
                          {mp.nome} ({mp.unidade_medida})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input type="number" step="0.01" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor total (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min={0} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="data_compra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da compra</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" size="lg" disabled={criarCompra.isPending}>
            {criarCompra.isPending ? 'Salvando...' : 'Registrar compra'}
          </Button>
        </form>
      </Form>
    </div>
  )
}
