/** Redacción del pagaré a partir de las condiciones de un préstamo. */
import { createHash } from 'node:crypto'
import { addWeeks, summarize, type LoanTerms } from './calc.ts'

const UNITS = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ',
  'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE',
  'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE']
const TENS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const HUNDREDS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS',
  'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function belowThousand(n: number): string {
  if (n === 100) return 'CIEN'
  const h = Math.floor(n / 100)
  const rest = n % 100
  let words = HUNDREDS[h]
  if (rest > 0) {
    const part = rest < 30 ? UNITS[rest] : TENS[Math.floor(rest / 10)] + (rest % 10 ? ` Y ${UNITS[rest % 10]}` : '')
    words = words ? `${words} ${part}` : part
  }
  return words
}

/** Número entero de pesos en letra, como se escribe en documentos mercantiles. */
export function pesosInWords(n: number): string {
  if (n === 0) return 'CERO'
  const millions = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000
  const parts: string[] = []
  if (millions) parts.push(millions === 1 ? 'UN MILLÓN' : `${belowThousand(millions)} MILLONES`)
  if (thousands) parts.push(thousands === 1 ? 'MIL' : `${belowThousand(thousands)} MIL`)
  if (rest) parts.push(belowThousand(rest))
  return parts.join(' ')
}

export function amountInWords(cents: number): string {
  const pesos = Math.floor(cents / 100)
  const centavos = String(cents % 100).padStart(2, '0')
  const de = pesos % 1_000_000 === 0 && pesos > 0 ? ' DE' : ''
  return `${pesosInWords(pesos)}${de} PESOS ${centavos}/100 M.N.`
}

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const money = (cents: number) => currency.format(cents / 100)
const longDate = (iso: string) =>
  new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${iso}T00:00:00Z`))

export interface ContractInput {
  folio: number
  terms: LoanTerms
  signDate: string
  city: string
  lender: { name: string; address: string }
  debtor: { name: string; address: string; phone: string }
}

export function buildPagare(input: ContractInput): string {
  const { terms, lender, debtor } = input
  const s = summarize(terms, [], terms.startDate)
  const last = s.schedule[s.schedule.length - 1]
  const place = input.city || lender.address || 'el domicilio de la beneficiaria'
  const lateClause = terms.lateFee > 0
    ? `Por cada exhibición que no sea cubierta en su fecha de vencimiento me obligo a pagar, además, una pena moratoria de ${money(terms.lateFee)} (${amountInWords(terms.lateFee)}).`
    : 'Las exhibiciones no cubiertas en su fecha de vencimiento no generan pena moratoria.'

  return [
    'PAGARÉ',
    `Folio: ${input.folio}`,
    `Bueno por: ${money(s.total)}`,
    '',
    `En ${place}, a ${longDate(input.signDate)}.`,
    '',
    `Debo y pagaré incondicionalmente por este pagaré a la orden de ${lender.name}, en ${place}, la cantidad de ${money(s.total)} (${amountInWords(s.total)}), valor recibido a mi entera satisfacción.`,
    '',
    `La cantidad anterior se pagará en ${terms.weeks} exhibiciones semanales y consecutivas de ${money(s.installment)} cada una${last.amount !== s.installment ? `, excepto la última que será de ${money(last.amount)}` : ''}. La primera vence el ${longDate(addWeeks(terms.startDate, 1))} y la última el ${longDate(last.dueDate)}.`,
    '',
    lateClause,
    '',
    'Datos del suscriptor (deudor):',
    `Nombre: ${debtor.name}`,
    `Domicilio: ${debtor.address || 'No proporcionado'}`,
    `Teléfono: ${debtor.phone}`,
  ].join('\n')
}

export const contractHash = (text: string) => createHash('sha256').update(text).digest('hex')
