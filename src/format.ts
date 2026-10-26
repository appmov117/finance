import type { Loan, User } from './types.ts'

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const shortDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const longDate = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export const money = (cents: number) => currency.format(cents / 100)
export const dayMonth = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`))
export const fullDate = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`))
export const percent = (bp: number) => `${bp / 100}%`

/** Convierte un texto en pesos ("1,250.50") a centavos; NaN si no es válido. */
export function toCents(value: string): number {
  const n = Number(value.replace(/[,\s$]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) : NaN
}

export function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date())
}

export function prettyPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
}

/** Enlace de WhatsApp con el estado de cuenta del cliente. */
export function whatsappLink(user: User, loans: Loan[]): string {
  const active = loans.filter((l) => l.summary && l.summary.balance > 0)
  const lines = [`Hola ${user.name.split(' ')[0]}, este es tu estado de cuenta:`]
  for (const loan of active) {
    const s = loan.summary!
    lines.push('', `Préstamo de ${money(loan.principal)}`, `Saldo: ${money(s.balance)}`)
    if (s.overdue > 0) lines.push(`Atrasado: ${money(s.overdue)} (incluye ${money(s.fees)} de comisiones)`)
    if (s.nextDue) lines.push(`Próximo pago: ${money(s.installment)} el ${fullDate(s.nextDue)}`)
  }
  if (active.length === 0) lines.push('', 'No tienes saldo pendiente. Gracias.')
  lines.push('', `Consulta tu detalle en ${window.location.origin}`)
  return `https://wa.me/52${user.phone}?text=${encodeURIComponent(lines.join('\n'))}`
}
