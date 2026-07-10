---
name: google-drive-media-integration
description: Padroniza o fluxo de upload de fotos de produtos personalizados para o Google Drive via Edge Function, mantendo credenciais fora do client e registrando referências no Supabase.
---

# google-drive-media-integration

## Quando usar

Em toda funcionalidade que envolva upload, exibição ou reenvio de fotos de produtos/pedidos.

## Como usar

1. Fluxo obrigatório: frontend → Edge Function (Supabase Edge Function ou API route na Vercel) → Google Drive API v3. Nunca expor credenciais do Google no client.
2. A Edge Function autentica via Service Account do Google, com acesso restrito a uma pasta raiz específica do Drive.
3. Após upload bem-sucedido, a função retorna `fileId` e link compartilhável, salvos em `itens_pedido.drive_file_id` e `itens_pedido.drive_url`. A imagem nunca é armazenada no banco.
4. Organização de pastas: subpastas automáticas por categoria de produto (`/Mochilas`, `/Bolsas`, `/Nécessaires`), criadas via API caso não existam ainda (buscar por nome antes de criar, para evitar duplicatas).
5. Tratamento de falha: se o upload ao Drive falhar, o pedido é salvo normalmente e a foto entra na fila `fotos_pendentes` para nova tentativa — o cadastro do pedido nunca trava por causa do Drive.
6. Nomenclatura do arquivo no Drive: `{numero_pedido}_{nome_cliente}_{categoria}_{timestamp}.jpg` (timestamp em formato `yyyyMMddHHmmss`).

## Exemplo de contrato da Edge Function

```
POST /functions/v1/upload-foto-pedido
body: { pedidoId, clienteNome, categoria, imageBase64 }
response 200: { fileId, driveUrl }
response 202 (falha no Drive, pedido salvo): { queued: true, motivo }
```
