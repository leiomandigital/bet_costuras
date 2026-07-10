// Gera ícones PNG sólidos (fundo azul #1D4ED8) para o manifest do PWA.
// Script utilitário, roda uma vez — não faz parte do build.
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      }
      t[n] = c
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function gerarPng(tamanho, corHex) {
  const r = parseInt(corHex.slice(0, 2), 16)
  const g = parseInt(corHex.slice(2, 4), 16)
  const b = parseInt(corHex.slice(4, 6), 16)

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(tamanho, 0)
  ihdr.writeUInt32BE(tamanho, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const raw = Buffer.alloc(tamanho * (tamanho * 3 + 1))
  let offset = 0
  const margem = Math.round(tamanho * 0.18)
  for (let y = 0; y < tamanho; y++) {
    raw[offset++] = 0 // filter none
    for (let x = 0; x < tamanho; x++) {
      const dentroMargem = x < margem || x >= tamanho - margem || y < margem || y >= tamanho - margem
      if (dentroMargem) {
        raw[offset++] = r
        raw[offset++] = g
        raw[offset++] = b
      } else {
        // "costura": um X branco fino no centro, simples e reconhecível
        const diag1 = Math.abs(x - y) < tamanho * 0.04
        const diag2 = Math.abs(x - (tamanho - y)) < tamanho * 0.04
        if (diag1 || diag2) {
          raw[offset++] = 255
          raw[offset++] = 255
          raw[offset++] = 255
        } else {
          raw[offset++] = r
          raw[offset++] = g
          raw[offset++] = b
        }
      }
    }
  }

  const idat = zlib.deflateSync(raw)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const png = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
  return png
}

const outDir = path.resolve(__dirname, '..', 'public')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const azul = '1D4ED8'
for (const tamanho of [192, 512]) {
  const png = gerarPng(tamanho, azul)
  fs.writeFileSync(path.join(outDir, `icon-${tamanho}.png`), png)
  console.log(`gerado icon-${tamanho}.png`)
}
