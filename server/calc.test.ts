import { describe, expect, it } from 'vitest'
import { addWeeks, loanTotal, summarize, type PaymentLine } from './calc.ts'

// $2,000 al 20% en 10 semanas, $50 de comisión; primer pago vence el 8 de enero.
const terms = { principal: 200000, rateBp: 2000, weeks: 10, lateFee: 5000, startDate: '2026-01-01' }
const run = (payments: PaymentLine[], today: string) => summarize(terms, payments, today)

describe('summarize', () => {
  it('suma el interés fijo al total', () => {
    expect(loanTotal(200000, 2000)).toBe(240000)
    expect(loanTotal(100000, 0)).toBe(100000)
  })

  it('cruza correctamente fin de mes y de año', () => {
    expect(addWeeks('2026-12-28', 1)).toBe('2027-01-04')
  })

  it('reparte el redondeo en el último pago', () => {
    const s = summarize({ ...terms, principal: 100000, rateBp: 0, weeks: 3 }, [], '2026-01-01')
    expect(s.schedule.map((i) => i.amount)).toEqual([33333, 33333, 33334])
  })

  it('préstamo nuevo sin comisiones', () => {
    const s = run([], '2026-01-01')
    expect(s).toMatchObject({ total: 240000, installment: 24000, balance: 240000, fees: 0 })
    expect(s.nextDue).toBe('2026-01-08')
  })

  it('pagar el día del vencimiento no es atraso', () => {
    const s = run([{ paidOn: '2026-01-08', amount: 24000 }], '2026-01-10')
    expect(s.lateCount).toBe(0)
    expect(s.balance).toBe(216000)
    expect(s.schedule[0].status).toBe('pagado')
    expect(s.nextDue).toBe('2026-01-15')
  })

  it('una semana sin pagar cobra una comisión', () => {
    const s = run([], '2026-01-09')
    expect(s).toMatchObject({ lateCount: 1, fees: 5000, balance: 245000, overdue: 29000 })
    expect(s.schedule[0].status).toBe('vencido')
  })

  it('pagar tarde conserva la comisión', () => {
    const s = run([{ paidOn: '2026-01-10', amount: 24000 }], '2026-01-12')
    expect(s).toMatchObject({ lateCount: 1, balance: 221000, overdue: 5000 })
    expect(s.schedule[0]).toMatchObject({ status: 'pagado', late: true })
  })

  it('dos semanas sin pagar', () => {
    expect(run([], '2026-01-16')).toMatchObject({ lateCount: 2, overdue: 58000 })
  })

  it('préstamo liquidado por adelantado', () => {
    const s = run([{ paidOn: '2026-01-05', amount: 240000 }], '2026-06-01')
    expect(s).toMatchObject({ balance: 0, lateCount: 0, nextDue: null })
  })
})
