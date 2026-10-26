import type { ClientRow, Loan } from './types.ts'

export type Tone = 'ok' | 'late' | 'wait' | 'off'
export interface Status { label: string; tone: Tone }

export function loanStatus(loan: Loan): Status {
  if (loan.status === 'requested') return { label: 'En revisión', tone: 'wait' }
  if (loan.status === 'to_sign') return { label: 'Por firmar', tone: 'wait' }
  if (loan.status === 'rejected') return { label: 'No aprobado', tone: 'off' }
  const s = loan.summary!
  if (s.balance === 0) return { label: 'Liquidado', tone: 'off' }
  if (s.overdue > 0) return { label: 'Atrasado', tone: 'late' }
  return { label: 'Al corriente', tone: 'ok' }
}

export function clientStatus(c: ClientRow): Status {
  if (c.overdue > 0) return { label: 'Atrasado', tone: 'late' }
  if (c.pending > 0) return { label: 'Solicitud', tone: 'wait' }
  if (c.balance > 0) return { label: 'Al corriente', tone: 'ok' }
  return { label: 'Sin deuda', tone: 'off' }
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
