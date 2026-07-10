import { supabase } from '@/services/supabaseClient'
import { uploadFotoProduto } from './fotoProdutoProntoService'
import type { ProdutoFoto } from '../types/estoqueProdutosProntos.types'

/**
 * Galeria de fotos do produto pronto. Fonte editável = Supabase Storage
 * (bucket `produtos-fotos`), usada para exibição no app e nos pedidos.
 * Em paralelo, cada foto enviada é espelhada no Google Drive via webhook
 * n8n (ver fotoProdutoProntoService) — o Drive nunca é apagado quando uma
 * foto é removida/trocada aqui, funcionando como histórico completo.
 *
 * Este arquivo nunca deve ser importado diretamente por componentes,
 * apenas pelos hooks em features/estoque-produtos-prontos/hooks.
 */

const BUCKET = 'produtos-fotos'

function fileParaBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function listarFotosProduto(produtoId: string): Promise<ProdutoFoto[]> {
  const { data, error } = await supabase
    .from('produto_fotos')
    .select('*')
    .eq('produto_estoque_id', produtoId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Falha ao listar fotos do produto: ${error.message}`)
  }

  return (data ?? []) as ProdutoFoto[]
}

export interface AdicionarFotoProdutoInput {
  produtoId: string
  categoria: string
  nomeProduto: string
  file: File
  marcarComoPrincipal: boolean
}

export async function adicionarFotoProduto(
  input: AdicionarFotoProdutoInput
): Promise<ProdutoFoto> {
  const caminho = `${input.produtoId}/${crypto.randomUUID()}-${input.file.name}`

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, input.file)

  if (erroUpload) {
    throw new Error(`Falha ao enviar foto para o Storage: ${erroUpload.message}`)
  }

  const { data: urlPublica } = supabase.storage.from(BUCKET).getPublicUrl(caminho)

  if (input.marcarComoPrincipal) {
    await supabase
      .from('produto_fotos')
      .update({ principal: false })
      .eq('produto_estoque_id', input.produtoId)
  }

  const { data: fotoCriada, error: erroInsercao } = await supabase
    .from('produto_fotos')
    .insert({
      produto_estoque_id: input.produtoId,
      storage_path: caminho,
      storage_url: urlPublica.publicUrl,
      principal: input.marcarComoPrincipal,
    })
    .select()
    .single()

  if (erroInsercao) {
    throw new Error(`Falha ao salvar referência da foto: ${erroInsercao.message}`)
  }

  // Espelho no Drive nunca bloqueia o cadastro da foto no Storage — se
  // falhar, a Edge Function já registra em fotos_pendentes para reenvio.
  try {
    const base64 = await fileParaBase64(input.file)
    const resultadoDrive = await uploadFotoProduto({
      produtoId: input.produtoId,
      categoria: input.categoria,
      nomeProduto: input.nomeProduto,
      imageBase64: base64,
    })

    if (!('queued' in resultadoDrive)) {
      await supabase
        .from('produto_fotos')
        .update({ drive_file_id: resultadoDrive.fileId, drive_url: resultadoDrive.driveUrl })
        .eq('id', fotoCriada.id)
    }
  } catch {
    // Falha silenciosa no espelho — a foto já está salva no Storage, que é
    // a fonte de verdade para exibição no app.
  }

  return fotoCriada as ProdutoFoto
}

export async function removerFotoProduto(foto: ProdutoFoto): Promise<void> {
  const { error: erroStorage } = await supabase.storage.from(BUCKET).remove([foto.storage_path])

  if (erroStorage) {
    throw new Error(`Falha ao remover foto do Storage: ${erroStorage.message}`)
  }

  // A cópia no Drive é preservada de propósito (histórico append-only).
  const { error: erroDelete } = await supabase.from('produto_fotos').delete().eq('id', foto.id)

  if (erroDelete) {
    throw new Error(`Falha ao remover referência da foto: ${erroDelete.message}`)
  }
}

export async function marcarFotoPrincipal(fotoId: string, produtoId: string): Promise<void> {
  const { error: erroLimpar } = await supabase
    .from('produto_fotos')
    .update({ principal: false })
    .eq('produto_estoque_id', produtoId)

  if (erroLimpar) {
    throw new Error(`Falha ao atualizar foto principal: ${erroLimpar.message}`)
  }

  const { error: erroMarcar } = await supabase
    .from('produto_fotos')
    .update({ principal: true })
    .eq('id', fotoId)

  if (erroMarcar) {
    throw new Error(`Falha ao marcar foto como principal: ${erroMarcar.message}`)
  }
}
