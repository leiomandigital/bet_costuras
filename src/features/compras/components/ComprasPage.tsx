import * as React from 'react'
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
            <Button>Lançar compra</Button>
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
