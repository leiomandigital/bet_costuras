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

type Aba = 'pedidos' | 'producao' | 'clientes' | 'financeiro' | 'estoque'

const ABAS: { id: Aba; label: string }[] = [
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'producao', label: 'Produção' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'estoque', label: 'Estoque' },
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
          <Button variant="outline" size="sm" onClick={sair} className="shrink-0">
            Sair
          </Button>
        </div>
        {/* Abas em linha única com scroll horizontal — evita quebra em
            várias linhas e economiza espaço vertical no celular. */}
        <nav className="overflow-x-auto scrollbar-hide border-t border-border">
          <div className="mx-auto max-w-6xl px-4 flex items-center gap-2 py-2 min-w-max">
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

      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-6">
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
    </div>
  )
}

export default App
