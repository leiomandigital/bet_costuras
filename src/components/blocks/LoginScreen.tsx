// Base: local — login mínimo exigido pelo RLS, sem RBAC (ver skill dominio-negocio-costura).
// Autenticação via Google OAuth; acesso restrito por allowlist no banco
// (tabela colaboradores_autorizados + trigger, ver migration
// 20260710130000_allowlist_colaboradores.sql).
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function LoginScreen() {
  const { entrarComGoogle, erroAcesso } = useAuth()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 text-center">
        <h1 className="text-title mb-1">Bet Costuras</h1>
        <p className="text-muted-foreground mb-6">Acesso interno da equipe</p>

        {erroAcesso && (
          <p className="text-destructive text-sm mb-4">{erroAcesso}</p>
        )}

        <Button className="w-full" onClick={entrarComGoogle}>
          Entrar com Google
        </Button>
      </Card>
    </div>
  )
}
