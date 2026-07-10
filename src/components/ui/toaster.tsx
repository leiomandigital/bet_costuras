// Base: shadcn/ui - Toast (implementado sobre "sonner" em vez do Radix Toast)
// Uso: chamar toast() diretamente de "sonner" em qualquer componente, ex.:
//   import { toast } from 'sonner'
//   toast.success('Pedido criado com sucesso')
//   toast.error('Falha ao salvar pedido')
import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      position="top-right"
      toastOptions={{
        style: {
          fontSize: '16px',
        },
      }}
    />
  )
}

export { toast } from 'sonner'
