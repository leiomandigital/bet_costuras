import { useState } from 'react'
import { PedidosTable } from '@/features/pedidos/components/PedidosTable'
import { ProducaoPage } from '@/features/producao/components/ProducaoPage'
import { ClientesTable } from '@/features/clientes/components/ClientesTable'
import { DashboardFinanceiro } from '@/features/financeiro/components/DashboardFinanceiro'
import { ComprasPage } from '@/features/compras/components/ComprasPage'
import { EstoqueMateriaPrimaTable } from '@/features/estoque-materia-prima/components/EstoqueMateriaPrimaTable'
import { EstoqueProdutosProntosTable } from '@/features/estoque-produtos-prontos/components/EstoqueProdutosProntosTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { LoginScreen } from '@/components/blocks/LoginScreen'
import { InstallPwaButton } from '@/components/blocks/InstallPwaButton'
import {
  ClipboardList,
  Hammer,
  Users,
  Wallet,
  Package,
  type LucideIcon,
} from 'lucide-react'

type Aba = 'pedidos' | 'producao' | 'clientes' | 'financeiro' | 'estoque'

const ABAS: { id: Aba; label: string; icone: LucideIcon }[] = [
  { id: 'pedidos', label: 'Pedidos', icone: ClipboardList },
  { id: 'producao', label: 'Produção', icone: Hammer },
  { id: 'clientes', label: 'Clientes', icone: Users },
  { id: 'financeiro', label: 'Financeiro', icone: Wallet },
  { id: 'estoque', label: 'Estoque', icone: Package },
]

// Navegação interna simples por estado — sem router, sem telas públicas
// (app 100% interno, sem RBAC, ver skill dominio-negocio-costura).
function App() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('pedidos')
  const { session, carregando, sair } = useAuth()

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!session) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-40 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="text-title-sm sm:text-title shrink-0">Bet Costuras</h1>
          <div className="flex items-center gap-2 shrink-0">
            <InstallPwaButton />
            <Button variant="outline" size="sm" onClick={sair} className="shrink-0">
              Sair
            </Button>
          </div>
        </div>
        {/* No celular a navegação fica fixa no rodapé (nav abaixo); aqui só
            aparece em telas maiores, em linha única. */}
        <nav className="hidden sm:block border-t border-border">
          <div className="mx-auto max-w-6xl px-4 flex items-center gap-2 py-2">
            {ABAS.map((aba) => (
              <Button
                key={aba.id}
                variant={abaAtiva === aba.id ? 'default' : 'ghost'}
                size="sm"
                className={cn('shrink-0', abaAtiva === aba.id && 'font-semibold')}
                onClick={() => setAbaAtiva(aba.id)}
              >
                {aba.label}
              </Button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-6">
        {abaAtiva === 'pedidos' && <PedidosTable />}
        {abaAtiva === 'producao' && <ProducaoPage />}
        {abaAtiva === 'clientes' && <ClientesTable />}
        {abaAtiva === 'financeiro' && <DashboardFinanceiro />}
        {abaAtiva === 'estoque' && (
          <Tabs defaultValue="materia-prima">
            <TabsList>
              <TabsTrigger value="materia-prima">Matéria-prima</TabsTrigger>
              <TabsTrigger value="produtos-prontos">Produtos prontos</TabsTrigger>
              <TabsTrigger value="compras">Compras</TabsTrigger>
            </TabsList>
            <TabsContent value="materia-prima">
              <EstoqueMateriaPrimaTable />
            </TabsContent>
            <TabsContent value="produtos-prontos">
              <EstoqueProdutosProntosTable />
            </TabsContent>
            <TabsContent value="compras">
              <ComprasPage />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Menu fixo no rodapé — só no celular. No desktop a navegação fica
          no topo (nav acima). */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background">
        <div className="grid grid-cols-5">
          {ABAS.map((aba) => {
            const Icone = aba.icone
            const ativo = abaAtiva === aba.id
            return (
              <button
                key={aba.id}
                type="button"
                onClick={() => setAbaAtiva(aba.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 min-h-touch',
                  ativo ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icone className="h-5 w-5" />
                <span className={cn('text-[11px] leading-none', ativo && 'font-semibold')}>
                  {aba.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default App
