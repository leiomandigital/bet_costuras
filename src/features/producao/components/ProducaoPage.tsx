import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KanbanProducao } from './KanbanProducao'
import { ListaEntregas } from '@/features/entregas/components/ListaEntregas'

// Unifica Produção e Entregas em uma única tela (menu mais enxuto p/ celular).
export function ProducaoPage() {
  return (
    <Tabs defaultValue="kanban">
      <TabsList>
        <TabsTrigger value="kanban">Produção</TabsTrigger>
        <TabsTrigger value="entregas">Entregas</TabsTrigger>
      </TabsList>
      <TabsContent value="kanban">
        <KanbanProducao />
      </TabsContent>
      <TabsContent value="entregas">
        <ListaEntregas />
      </TabsContent>
    </Tabs>
  )
}
