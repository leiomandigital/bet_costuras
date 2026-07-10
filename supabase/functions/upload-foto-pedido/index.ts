// Supabase Edge Function: upload-foto-pedido
//
// Contrato (skill google-drive-media-integration):
//   POST /functions/v1/upload-foto-pedido
//   body: { pedidoId, clienteNome, categoria, imageBase64 }
//   response 200: { queued: false, fileId?, driveUrl? }
//   response 202 (falha no envio, pedido salvo): { queued: true, motivo }
//
// Fluxo: frontend -> Edge Function -> webhook n8n -> Google Drive.
// A Edge Function não fala mais diretamente com a API do Google (Service
// Accounts não têm cota de armazenamento própria em Drives pessoais —
// erro storageQuotaExceeded). O n8n autentica no Drive via OAuth de conta
// de usuário real (com cota normal) e organiza a foto nas subpastas por
// categoria dentro do próprio workflow.
//
// Credenciais do webhook NUNCA são expostas ao client, só existem aqui
// (variáveis de ambiente da function, configuradas via secrets, nunca no
// .env do frontend):
//   N8N_UPLOAD_WEBHOOK_URL
//   N8N_UPLOAD_WEBHOOK_AUTH_VALUE
//
// Tratamento de falha: qualquer erro ao chamar o webhook cai no fallback
// de fila `fotos_pendentes` — o cadastro do pedido nunca trava por causa
// disso.

// @ts-ignore - Deno runtime das Edge Functions do Supabase
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface UploadFotoPedidoBody {
  pedidoId: string
  clienteNome: string
  categoria: string
  imageBase64: string
}

const N8N_AUTH_HEADER_NAME = 'bet_costuras_OAuth'

function timestampDrive(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

async function enviarParaWebhookN8n(params: {
  pedidoId: string
  numeroPedido: string
  clienteNome: string
  categoria: string
  imageBase64: string
}): Promise<{ fileId?: string; driveUrl?: string }> {
  // @ts-ignore Deno global
  const webhookUrl = Deno.env.get('N8N_UPLOAD_WEBHOOK_URL')
  // @ts-ignore Deno global
  const authValue = Deno.env.get('N8N_UPLOAD_WEBHOOK_AUTH_VALUE')

  if (!webhookUrl || !authValue) {
    throw new Error(
      'Webhook do n8n não configurado (N8N_UPLOAD_WEBHOOK_URL / N8N_UPLOAD_WEBHOOK_AUTH_VALUE).'
    )
  }

  const nomeArquivo = `${params.numeroPedido}_${params.clienteNome}_${params.categoria}_${timestampDrive()}.jpg`

  const resposta = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [N8N_AUTH_HEADER_NAME]: authValue,
    },
    body: JSON.stringify({
      pedidoId: params.pedidoId,
      numeroPedido: params.numeroPedido,
      clienteNome: params.clienteNome,
      categoria: params.categoria,
      nomeArquivo,
      imageBase64: params.imageBase64,
    }),
  })

  if (!resposta.ok) {
    const texto = await resposta.text()
    throw new Error(`Falha ao enviar foto ao webhook n8n (${resposta.status}): ${texto}`)
  }

  // O workflow do n8n pode ou não devolver fileId/driveUrl no corpo da
  // resposta — tratamos como opcional para não quebrar se ele só
  // confirmar o recebimento.
  try {
    const dados = await resposta.json()
    return { fileId: dados.fileId, driveUrl: dados.driveUrl }
  } catch {
    return {}
  }
}

// Cabeçalhos de CORS: a function é chamada via fetch do navegador
// (supabase.functions.invoke), que sempre dispara um preflight OPTIONS.
// Sem esses headers em toda resposta (incluindo erros), o browser bloqueia
// a chamada antes mesmo dela chegar até aqui.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  let body: UploadFotoPedidoBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const { pedidoId, clienteNome, categoria, imageBase64 } = body

  if (!pedidoId || !clienteNome || !categoria || !imageBase64) {
    return new Response(
      JSON.stringify({ error: 'Campos obrigatórios: pedidoId, clienteNome, categoria, imageBase64' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  // @ts-ignore Deno global
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  // @ts-ignore Deno global
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { data: pedido, error: erroPedido } = await supabaseAdmin
      .from('pedidos')
      .select('numero_pedido')
      .eq('id', pedidoId)
      .single()

    if (erroPedido || !pedido) {
      throw new Error('Pedido não encontrado')
    }

    const resultado = await enviarParaWebhookN8n({
      pedidoId,
      numeroPedido: pedido.numero_pedido,
      clienteNome,
      categoria,
      imageBase64,
    })

    // Salva referência no item de pedido, se o n8n retornou fileId/driveUrl
    // (o pedido já foi salvo antes desta chamada — o upload de foto nunca
    // bloqueia a criação do pedido).
    if (resultado.fileId || resultado.driveUrl) {
      await supabaseAdmin
        .from('itens_pedido')
        .update({ drive_file_id: resultado.fileId ?? null, drive_url: resultado.driveUrl ?? null })
        .eq('pedido_id', pedidoId)
    }

    return new Response(JSON.stringify({ queued: false, ...resultado }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    // Falha ao enviar ao webhook (credenciais ausentes, n8n fora do ar,
    // erro de rede, etc.): pedido já está salvo, então entra na fila de
    // retry. O cadastro do pedido nunca trava por causa disso.
    const motivo = err instanceof Error ? err.message : 'Falha desconhecida no upload'

    await supabaseAdmin.from('fotos_pendentes').insert({
      pedido_id: pedidoId,
      categoria,
      cliente_nome: clienteNome,
      motivo,
      tentativas: 0,
    })

    return new Response(JSON.stringify({ queued: true, motivo }), {
      status: 202,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
