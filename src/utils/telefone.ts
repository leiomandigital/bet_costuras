/**
 * Máscara de telefone (DDD) XXXXX-XXXX / (DDD) XXXX-XXXX conforme o
 * usuário digita. Aceita 10 ou 11 dígitos (fixo ou celular).
 */
export function mascararTelefone(valorDigitado: string): string {
  const digitos = valorDigitado.replace(/\D/g, '').slice(0, 11)

  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return `(${digitos}`
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}
