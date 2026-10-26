import type { LoanSummary } from '../server/calc.ts'

export type { Installment, LoanSummary } from '../server/calc.ts'

export interface User {
  id: number
  role: 'admin' | 'client'
  name: string
  phone: string
  address: string
  acceptedTerms: boolean
}

export interface Loan {
  id: number
  clientId: number
  status: 'requested' | 'to_sign' | 'active' | 'rejected'
  principal: number
  rateBp: number
  weeks: number
  lateFee: number
  startDate: string | null
  note: string
  createdAt: string
  signedAt: string | null
  payments: { id: number; amount: number; paidOn: string }[]
  summary: LoanSummary | null
}

export interface Totals {
  balance: number
  overdue: number
  pending: number
}

export interface Account {
  user: User
  loans: Loan[]
  totals: Totals
}

export type ClientRow = User & Totals

export interface RequestRow {
  id: number
  clientId: number
  principal: number
  weeks: number
  note: string
  createdAt: string
  clientName: string
  clientPhone: string
}

export interface LoanDetail {
  user: User
  loan: Loan
}

export interface Contract {
  text: string
  hash: string | null
  signature: string | null
  signedAt: string | null
  meta?: { ip: string; userAgent: string; inPerson?: boolean } | null
}

export interface LenderInfo {
  lender: string
  email: string
  city: string
}
