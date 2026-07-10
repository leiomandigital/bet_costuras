import * as React from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
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
import { useListarClientes, useCriarCliente } from '../hooks/useClientes'
import { mascararTelefone } from '@/utils/telefone'

interface SelecionarClienteFieldProps {
  value: string
  onChange: (clienteId: string) => void
}

/**
 * Seleção de cliente em lista (Select) + atalho "Novo cliente" que abre um
 * modal enxuto (nome + telefone) e já retorna o cliente selecionado.
 */
export function SelecionarClienteField({ value, onChange }: SelecionarClienteFieldProps) {
  const { data: clientes, isLoading } = useListarClientes()
  const criarCliente = useCriarCliente()

  const [modalAberto, setModalAberto] = React.useState(false)
  const [nome, setNome] = React.useState('')
  const [telefone, setTelefone] = React.useState('')

  async function handleCadastrar() {
    if (!nome || !telefone) {
      toast.error('Informe nome e telefone')
      return
    }
    try {
      const cliente = await criarCliente.mutateAsync({ nome, telefone })
      onChange(cliente.id)
      setModalAberto(false)
      setNome('')
      setTelefone('')
      toast.success('Cliente cadastrado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao cadastrar cliente')
    }
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="flex-1 min-w-0">
          <SelectValue placeholder={isLoading ? 'Carregando clientes...' : 'Selecione o cliente'} />
        </SelectTrigger>
        <SelectContent>
          {(clientes ?? []).map((cliente) => (
            <SelectItem key={cliente.id} value={cliente.id}>
              {cliente.nome} — {cliente.telefone}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        {/* No celular vira só um círculo com "+" pra não estourar a linha
            (Select + botão de texto não cabiam lado a lado). */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full sm:rounded-md sm:h-10 sm:w-auto sm:px-4"
          onClick={() => setModalAberto(true)}
          aria-label="Novo cliente"
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
          <span className="hidden sm:inline">Novo cliente</span>
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novo-cliente-nome">Nome</Label>
              <Input
                id="novo-cliente-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novo-cliente-telefone">Telefone</Label>
              <Input
                id="novo-cliente-telefone"
                value={telefone}
                onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="numeric"
              />
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={handleCadastrar}
              disabled={criarCliente.isPending}
            >
              {criarCliente.isPending ? 'Salvando...' : 'Salvar e selecionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
