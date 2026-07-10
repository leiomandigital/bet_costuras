import * as React from 'react'
import { toast } from 'sonner'
import { Download, Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useExcluirCliente, useListarClientes } from '../hooks/useClientes'
import { ClienteForm } from './ClienteForm'
import type { Cliente } from '../types/cliente.types'

function exportarClientesCsv(clientes: Cliente[]) {
  const cabecalho = ['nome', 'telefone', 'email']
  const linhas = clientes.map((c) =>
    [c.nome, c.telefone, c.email ?? ''].map((v) => `"${v.replace(/"/g, '""')}"`).join(',')
  )
  const csv = [cabecalho.join(','), ...linhas].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ClientesTable() {
  const { data: clientes, isLoading, isError, error } = useListarClientes()
  const excluirCliente = useExcluirCliente()

  const [busca, setBusca] = React.useState('')
  const [clienteEmEdicao, setClienteEmEdicao] = React.useState<Cliente | null>(null)
  const [dialogAberto, setDialogAberto] = React.useState(false)
  const [dialogNovoAberto, setDialogNovoAberto] = React.useState(false)

  const clientesFiltrados = React.useMemo(() => {
    if (!clientes) return []
    const termo = busca.trim().toLowerCase()
    if (!termo) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) || c.telefone.toLowerCase().includes(termo)
    )
  }, [clientes, busca])

  function abrirEdicao(cliente: Cliente) {
    setClienteEmEdicao(cliente)
    setDialogAberto(true)
  }

  async function handleExcluir(cliente: Cliente) {
    const confirmado = window.confirm(
      `Excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`
    )
    if (!confirmado) return
    try {
      await excluirCliente.mutateAsync(cliente.id)
      toast.success('Cliente excluído com sucesso')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao excluir cliente')
    }
  }

  if (isLoading) return <p className="text-base">Carregando clientes...</p>
  if (isError)
    return (
      <p className="text-base text-destructive">
        Erro ao carregar clientes: {error instanceof Error ? error.message : 'desconhecido'}
      </p>
    )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nome ou telefone"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-xs"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => exportarClientesCsv(clientesFiltrados)}
          disabled={clientesFiltrados.length === 0}
          className="hidden sm:inline-flex"
        >
          Exportar CSV
        </Button>
      </div>

      {/* Dialog controlado — botão de abrir muda de lugar/forma conforme a
          tela (topo no desktop, flutuante no canto no celular). */}
      <Dialog open={dialogNovoAberto} onOpenChange={setDialogNovoAberto}>
        <div className="hidden sm:flex justify-end">
          <Button onClick={() => setDialogNovoAberto(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Novo cliente
          </Button>
        </div>

        {/* Celular: botões flutuantes fixos no canto inferior direito,
            acima do menu do rodapé — exportar CSV ao lado do "+". */}
        <div className="sm:hidden fixed bottom-20 right-4 z-30 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => exportarClientesCsv(clientesFiltrados)}
            disabled={clientesFiltrados.length === 0}
            aria-label="Exportar CSV"
            className="h-12 w-12 rounded-full shadow-lg bg-background"
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            onClick={() => setDialogNovoAberto(true)}
            aria-label="Novo cliente"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm onSucesso={() => setDialogNovoAberto(false)} />
        </DialogContent>
      </Dialog>

      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientesFiltrados.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nome}</TableCell>
                <TableCell>{cliente.telefone}</TableCell>
                <TableCell>{cliente.email ?? '—'}</TableCell>
                <TableCell className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => abrirEdicao(cliente)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleExcluir(cliente)}
                    disabled={excluirCliente.isPending}
                  >
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {clientesFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Celular: cartão com nome + telefone — toque abre edição/exclusão. */}
      <div className="sm:hidden space-y-2">
        {clientesFiltrados.map((cliente) => (
          <button
            key={cliente.id}
            type="button"
            onClick={() => abrirEdicao(cliente)}
            className="w-full flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 text-left min-h-touch"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{cliente.nome}</p>
              <p className="text-sm text-muted-foreground truncate">{cliente.telefone}</p>
            </div>
          </button>
        ))}
        {clientesFiltrados.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Nenhum cliente encontrado</p>
        )}
      </div>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          {clienteEmEdicao && (
            <ClienteForm
              cliente={clienteEmEdicao}
              onSucesso={() => setDialogAberto(false)}
              onExcluir={() => {
                handleExcluir(clienteEmEdicao)
                setDialogAberto(false)
              }}
              excluindo={excluirCliente.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
