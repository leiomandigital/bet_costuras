// Supabase Edge Function: upload-foto-produto
//
// Espelha upload-foto-pedido (ver esse arquivo para o histórico da decisão
// de usar webhook n8n em vez de Service Account do Google — Service
// Accounts não têm cota de armazenamento em Drives pessoais).
//
// Contrato:
//   POST /functions/v1/upload-foto-produto
//   body: { produtoId, categoria, nomeProduto, imageBase64 }
//   response 200: { queued: false, fileId?, driveUrl? }
//   response 202 (falha no envio, produto já salvo): { queued: true, motivo }
//
// Fluxo: frontend -> Edge Function -> webhook n8n -> Google Drive.
// Credenciais do webhook NUNCA são expostas ao client (mesmos secrets da
// function upload-foto-pedido, reaproveitados aqui):
//   N8N_UPLOAD_WEBHOOK_URL
//   N8N_UPLOAD_WEBHOOK_AUTH_VALUE
//
// Tratamento de falha: qualquer erro ao chamar o webhook cai no fallback
// de fila `fotos_pendentes` (mesma tabela usada pelos pedidos, com
// item_pedido_id nulo e pedido_id apontando para o próprio produto não se
// aplica aqui — usamos apenas categoria/motivo para rastreio manual).

// @ts-ignore - Deno runtime das Edge Functions do Supabase
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface UploadFotoProdutoBody {
  produtoId: string
  categoria: string
  nomeProduto: string
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
  produtoId: string
  categoria: string
  nomeProduto: string
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

  const nomeArquivo = `PRODUTO_${params.produtoId}_${params.categoria}_${timestampDrive()}.jpg`

  const resposta = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [N8N_AUTH_HEADER_NAME]: authValue,
    },
    body: JSON.stringify({
      produtoId: params.produtoId,
      categoria: params.categoria,
      nomeProduto: params.nomeProduto,
      nomeArquivo,
      imageBase64: params.imageBase64,
    }),
  })

  if (!resposta.ok) {
    const texto = await resposta.text()
    throw new Error(`Falha ao enviar foto ao webhook n8n (${resposta.status}): ${texto}`)
  }

  try {
    const dados = await resposta.json()
    return { fileId: dados.fileId, driveUrl: dados.driveUrl }
  } catch {
    return {}
  }
}

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

  let body: UploadFotoProdutoBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const { produtoId, categoria, nomeProduto, imageBase64 } = body

  if (!produtoId || !categoria || !nomeProduto || !imageBase64) {
    return new Response(
      JSON.stringify({ error: 'Campos obrigatórios: produtoId, categoria, nomeProduto, imageBase64' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  // @ts-ignore Deno global
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  // @ts-ignore Deno global
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const resultado = await enviarParaWebhookN8n({
      produtoId,
      categoria,
      nomeProduto,
      imageBase64,
    })

    if (resultado.fileId || resultado.driveUrl) {
      await supabaseAdmin
        .from('estoque_produtos_prontos')
        .update({ drive_file_id: resultado.fileId ?? null, drive_url: resultado.driveUrl ?? null })
        .eq('id', produtoId)
    }

    return new Response(JSON.stringify({ queued: false, ...resultado }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const motivo = err instanceof Error ? err.message : 'Falha desconhecida no upload'

    await supabaseAdmin.from('fotos_pendentes').insert({
      produto_estoque_id: produtoId,
      categoria,
      cliente_nome: nomeProduto,
      motivo,
      tentativas: 0,
    })

    return new Response(JSON.stringify({ queued: true, motivo }), {
      status: 202,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
