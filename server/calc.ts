/**
 * Calendario semanal, comisiones por atraso y saldo de un préstamo.
 * Todos los montos están en centavos enteros y las fechas en formato YYYY-MM-DD.
 */

export type InstallmentStatus = 'pagado' | 'vencido' | 'pendiente'

export interface Installment {
  number: number
  dueDate: string
  amount: number
  status: InstallmentStatus
  late: boolean
}

export interface LoanTerms {
  principal: number
  /** Interés total en puntos base: 2000 equivale a 20%. */
  rateBp: number
  weeks: number
  lateFee: number
  startDate: string
}

export interface PaymentLine {
  paidOn: string
  amount: number
}

export interface LoanSummary {
  total: number
  installment: number
  paid: number
  fees: number
  balance: number
  overdue: number
  lateCount: number
  nextDue: string | null
  schedule: Installment[]
}

export function loanTotal(principal: number, rateBp: number): number {
  return principal + Math.round((principal * rateBp) / 10000)
}

export function addWeeks(isoDate: string, weeks: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

/**
 * El primer pago vence una semana después de la fecha de entrega. Cada pago
 * semanal que no quedó cubierto en su fecha de vencimiento genera una comisión
 * fija, aunque después se haya pagado. Pagar el mismo día del vencimiento no es atraso.
 */
export function summarize(terms: LoanTerms, payments: PaymentLine[], today: string): LoanSummary {
  const total = loanTotal(terms.principal, terms.rateBp)
  const base = Math.floor(total / terms.weeks)
  const paid = payments.reduce((acc, p) => acc + p.amount, 0)

  const schedule: Installment[] = []
  let cumulative = 0
  let lateCount = 0
  let dueUntilToday = 0
  let nextDue: string | null = null

  for (let number = 1; number <= terms.weeks; number++) {
    const amount = number < terms.weeks ? base : total - base * (terms.weeks - 1)
    cumulative += amount
    const dueDate = addWeeks(terms.startDate, number)
    const isPast = today > dueDate
    const paidByDue = payments
      .filter((p) => p.paidOn <= dueDate)
      .reduce((acc, p) => acc + p.amount, 0)
    const late = isPast && paidByDue < cumulative
    if (late) lateCount++
    if (isPast) dueUntilToday = cumulative

    const status: InstallmentStatus =
      paid >= cumulative ? 'pagado' : isPast ? 'vencido' : 'pendiente'
    if (nextDue === null && status !== 'pagado') nextDue = dueDate
    schedule.push({ number, dueDate, amount, status, late })
  }

  const fees = terms.lateFee * lateCount
  const balance = Math.max(total + fees - paid, 0)
  return {
    total,
    installment: base,
    paid,
    fees,
    balance,
    overdue: Math.max(dueUntilToday + fees - paid, 0),
    lateCount,
    nextDue: balance > 0 ? nextDue : null,
    schedule,
  }
}
