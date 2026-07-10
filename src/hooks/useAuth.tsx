import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/services/supabaseClient'

/**
 * Autenticação mínima exigida pelo RLS ("authenticated_full_access" em
 * todas as tabelas — ver skill supabase-schema-costura). Não há papéis
 * nem permissões diferenciadas: qualquer colaborador com credencial válida
 * vê e edita tudo (ver skill dominio-negocio-costura).
 */

interface AuthContextValue {
  session: Session | null
  carregando: boolean
  erroAcesso: string | null
  entrarComGoogle: () => Promise<void>
  sair: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erroAcesso, setErroAcesso] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })

    // Se o e-mail não estiver na allowlist (colaboradores_autorizados), o
    // trigger no banco deleta o usuário e o login falha silenciosamente do
    // lado do client — por isso checamos getSession() de novo logo após o
    // evento para confirmar se a sessão realmente ficou válida.
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_evento, novaSessao) => {
      if (novaSessao) {
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) {
          setErroAcesso('E-mail não autorizado a acessar o Bet Costuras.')
          await supabase.auth.signOut()
          setSession(null)
          return
        }
      }
      setErroAcesso(null)
      setSession(novaSessao)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  async function entrarComGoogle() {
    setErroAcesso(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, carregando, erroAcesso, entrarComGoogle, sair }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
