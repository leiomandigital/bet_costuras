import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CompraForm } from './CompraForm'
import { ComprasTable } from './ComprasTable'

export function ComprasPage() {
  const [dialogAberto, setDialogAberto] = React.useState(false)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
          <DialogTrigger asChild>
            {/* Mesmo padrão dos outros "Novo X": círculo com "+" no
                celular, texto no desktop. */}
            <Button
              size="icon"
              className="rounded-full sm:rounded-md sm:h-10 sm:w-auto sm:px-4"
              aria-label="Lançar compra"
            >
              <Plus className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
              <span className="hidden sm:inline">Lançar compra</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova compra</DialogTitle>
            </DialogHeader>
            <CompraForm onSucesso={() => setDialogAberto(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <ComprasTable />
    </div>
  )
}
