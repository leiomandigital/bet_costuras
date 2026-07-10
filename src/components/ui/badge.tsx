// Base: shadcn/ui - Badge
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Variantes de status seguem o design system: verde = finalizado/entregue,
// amarelo = em andamento, cinza = a produzir, azul = aguardando entrega,
// vermelho = pendência. Sempre combinadas com texto/ícone, nunca só cor.
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-muted text-muted-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'border-border text-foreground',
        'a-produzir': 'border-transparent bg-status-a-produzir text-white',
        'em-andamento': 'border-transparent bg-status-em-andamento text-white',
        finalizado: 'border-transparent bg-status-finalizado text-white',
        'aguardando-entrega': 'border-transparent bg-status-aguardando-entrega text-white',
        entregue: 'border-transparent bg-status-entregue text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
