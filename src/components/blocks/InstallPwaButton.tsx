import * as React from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Chrome/Edge/Android disparam "beforeinstallprompt" quando o app cumpre os
// critérios de instalação (manifest + service worker, ver vite.config.ts).
// Guardamos o evento para poder chamar prompt() sob demanda, a partir de um
// botão visível — sem isso o navegador só oferece a instalação escondida no
// menu.
export function InstallPwaButton() {
  const [evento, setEvento] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [instalado, setInstalado] = React.useState(false)

  React.useEffect(() => {
    function aoDispararPrompt(e: Event) {
      e.preventDefault()
      setEvento(e as BeforeInstallPromptEvent)
    }
    function aoInstalar() {
      setInstalado(true)
      setEvento(null)
    }
    window.addEventListener('beforeinstallprompt', aoDispararPrompt)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoDispararPrompt)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  if (!evento || instalado) return null

  async function handleInstalar() {
    if (!evento) return
    await evento.prompt()
    await evento.userChoice
    setEvento(null)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleInstalar} className="shrink-0">
      <Download className="h-4 w-4 sm:mr-1" />
      <span className="hidden sm:inline">Instalar app</span>
    </Button>
  )
}
