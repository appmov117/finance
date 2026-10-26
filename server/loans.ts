import { asc, desc, inArray } from 'drizzle-orm'
import { summarize, type LoanSummary } from './calc.ts'
import type { DB } from './db/client.ts'
import { loans, payments } from './db/schema.ts'

type LoanRow = typeof loans.$inferSelect
type PaymentRow = typeof payments.$inferSelect

type Heavy = 'contractText' | 'contractHash' | 'signature' | 'signMeta'

export interface LoanView extends Omit<LoanRow, 'createdAt' | 'signedAt' | Heavy> {
  createdAt: string
  signedAt: string | null
  payments: { id: number; amount: number; paidOn: string }[]
  summary: LoanSummary | null
}

export function todayIn(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

function toView(loan: LoanRow, rows: PaymentRow[], today: string): LoanView {
  const { contractText: _t, contractHash: _h, signature: _s, signMeta: _m, ...rest } = loan
  const list = rows.map(({ id, amount, paidOn }) => ({ id, amount, paidOn }))
  const summary =
    (loan.status === 'active' || loan.status === 'to_sign') && loan.startDate
      ? summarize({ ...loan, startDate: loan.startDate }, list, today)
      : null
  return {
    ...rest,
    createdAt: loan.createdAt.toISOString(),
    signedAt: loan.signedAt?.toISOString() ?? null,
    payments: list,
    summary,
  }
}

/** Préstamos de los clientes indicados con sus pagos y saldo calculado. */
export async function loadLoans(db: DB, clientIds: number[], today: string): Promise<LoanView[]> {
  if (clientIds.length === 0) return []
  const loanRows = await db
    .select()
    .from(loans)
    .where(inArray(loans.clientId, clientIds))
    .orderBy(desc(loans.id))
  const paymentRows = loanRows.length
    ? await db
        .select()
        .from(payments)
        .where(inArray(payments.loanId, loanRows.map((l) => l.id)))
        .orderBy(asc(payments.paidOn), asc(payments.id))
    : []
  return loanRows.map((loan) =>
    toView(loan, paymentRows.filter((p) => p.loanId === loan.id), today),
  )
}

export function totalsOf(views: LoanView[]) {
  return views.reduce(
    (acc, v) => ({
      balance: acc.balance + (v.summary?.balance ?? 0),
      overdue: acc.overdue + (v.summary?.overdue ?? 0),
      pending: acc.pending + (v.status === 'requested' ? 1 : 0),
    }),
    { balance: 0, overdue: 0, pending: 0 },
  )
}
