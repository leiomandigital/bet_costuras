import { supabase } from '@/services/supabaseClient'

/**
 * Chama a Edge Function upload-foto-produto (ver
 * supabase/functions/upload-foto-produto). Nunca fala diretamente com o
 * Google Drive/n8n a partir do client. Este arquivo só deve ser usado por
 * hooks, nunca importado direto em componentes.
 */

export interface UploadFotoProdutoInput {
  produtoId: string
  categoria: string
  nomeProduto: string
  imageBase64: string
}

export interface UploadFotoProdutoSucesso {
  fileId: string
  driveUrl: string
}

export interface UploadFotoProdutoQueued {
  queued: true
  motivo: string
}

export type UploadFotoProdutoResultado = UploadFotoProdutoSucesso | UploadFotoProdutoQueued

export async function uploadFotoProduto(
  input: UploadFotoProdutoInput
): Promise<UploadFotoProdutoResultado> {
  const { data, error } = await supabase.functions.invoke('upload-foto-produto', {
    body: input,
  })

  if (error) {
    return { queued: true, motivo: error.message }
  }

  return data as UploadFotoProdutoResultado
}
