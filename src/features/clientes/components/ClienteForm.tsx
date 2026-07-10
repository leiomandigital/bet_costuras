import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAtualizarCliente, useCriarCliente } from '../hooks/useClientes'
import type { Cliente } from '../types/cliente.types'
import { mascararTelefone } from '@/utils/telefone'

// Telefone é o dado principal (obrigatório), email é opcional
// (ver skill dominio-negocio-costura).
const clienteFormSchema = z.object({
  nome: z.string().min(1, 'Informe o nome'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
})

type ClienteFormValues = z.infer<typeof clienteFormSchema>

interface ClienteFormProps {
  cliente?: Cliente | null
  onSucesso?: () => void
}

export function ClienteForm({ cliente, onSucesso }: ClienteFormProps) {
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteFormSchema),
    defaultValues: {
      nome: cliente?.nome ?? '',
      telefone: cliente?.telefone ?? '',
      email: cliente?.email ?? '',
    },
  })

  const criarCliente = useCriarCliente()
  const atualizarCliente = useAtualizarCliente()
  const salvando = criarCliente.isPending || atualizarCliente.isPending

  async function onSubmit(values: ClienteFormValues) {
    try {
      if (cliente) {
        await atualizarCliente.mutateAsync({
          id: cliente.id,
          nome: values.nome,
          telefone: values.telefone,
          email: values.email || null,
        })
        toast.success('Cliente atualizado com sucesso')
      } else {
        await criarCliente.mutateAsync({
          nome: values.nome,
          telefone: values.telefone,
          email: values.email || null,
        })
        toast.success('Cliente cadastrado com sucesso')
        form.reset()
      }
      onSucesso?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar cliente')
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
                <Input {...field} placeholder="Nome do cliente" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="telefone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="(00) 00000-0000"
                  inputMode="numeric"
                  onChange={(e) => field.onChange(mascararTelefone(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail (opcional)</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="cliente@exemplo.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" size="lg" disabled={salvando}>
          {salvando ? 'Salvando...' : cliente ? 'Salvar alterações' : 'Cadastrar cliente'}
        </Button>
      </form>
    </Form>
  )
}
