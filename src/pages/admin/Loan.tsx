import { HandCoins } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { api } from '../../api.ts'
import { Badge, Field, Loading, Screen } from '../../components/common.tsx'
import { LoanBody } from '../../components/LoanBody.tsx'
import { money, todayIso, toCents } from '../../format.ts'
import { useAction, useApi } from '../../hooks.ts'
import { loanStatus } from '../../status.ts'
import type { Account, LoanDetail } from '../../types.ts'

export function AdminLoan() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error, reload } = useApi<LoanDetail>(`/admin/loans/${id}`)
  const { busy, run } = useAction()
  if (!data) return <Screen title="Préstamo" back><Loading error={error} /></Screen>
  const { user, loan } = data

  const removePayment = async (paymentId: number) => {
    if (confirm('¿Quitar este pago? El saldo se recalcula.') && (await run(() => api('DELETE', `/admin/payments/${paymentId}`)))) reload()
  }
  const reject = async () => {
    if (confirm('¿Rechazar esta solicitud?') && (await run(() => api('POST', `/admin/loans/${loan.id}/reject`)))) navigate(-1)
  }

  const footer =
    loan.status === 'requested' ? (
      <>
        <button className="btn danger" disabled={busy} onClick={reject}>Rechazar</button>
        <Link to={`/prestamos/${loan.id}/aprobar`} className="btn">Aprobar</Link>
      </>
    ) : loan.summary && loan.summary.balance > 0 ? (
      <Link to={`/prestamos/${loan.id}/pago`} className="btn"><HandCoins size={18} />Registrar pago</Link>
    ) : undefined

  return (
    <Screen title={user.name} back footer={footer}>
      <div className="section-head">
        <h2>Préstamo de {money(loan.principal)}</h2>
        <Badge status={loanStatus(loan)} />
      </div>
      <LoanBody
        loan={loan}
        onDeletePayment={removePayment}
        contractLink={`/prestamos/${loan.id}/pagare`}
        renewLink={`/clientes/${loan.clientId}/prestamo?renovar=${loan.id}`}
      />
    </Screen>
  )
}

export function AddPayment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error } = useApi<LoanDetail>(`/admin/loans/${id}`)
  const { busy, error: saveError, setError, run } = useAction()
  const [amount, setAmount] = useState<string | null>(null)
  const [paidOn, setPaidOn] = useState(todayIso())
  if (!data?.loan.summary) return <Screen title="Registrar pago" back><Loading error={error} /></Screen>
  const s = data.loan.summary
  const value = amount ?? String(s.installment / 100)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const cents = toCents(value)
    if (!(cents > 0)) return setError('Escribe una cantidad válida')
    run(async () => {
      await api('POST', `/admin/loans/${id}/payments`, { amount: cents, paidOn })
      navigate(-1)
    })
  }

  const quick = [s.installment, s.overdue, s.balance].filter((v, i, all) => v > 0 && all.indexOf(v) === i)
  const quickLabel = (v: number) => (v === s.balance ? 'Liquidar' : v === s.overdue ? 'Lo atrasado' : 'Pago semanal')

  return (
    <Screen
      title="Registrar pago"
      back
      footer={<button className="btn" form="payment" disabled={busy}>{busy ? 'Guardando...' : 'Guardar pago'}</button>}
    >
      <p className="muted">{data.user.name}, saldo {money(s.balance)}</p>
      <form id="payment" onSubmit={submit}>
        <Field label="Cantidad recibida">
          <input inputMode="decimal" value={value} onChange={(e) => setAmount(e.target.value)} required style={{ fontSize: '1.6rem', fontWeight: 800 }} />
        </Field>
        <div className="chips">
          {quick.map((v) => (
            <button type="button" key={v} className="btn ghost" onClick={() => setAmount(String(v / 100))}>
              {quickLabel(v)} {money(v)}
            </button>
          ))}
        </div>
        <Field label="Fecha del pago">
          <input type="date" value={paidOn} max={todayIso()} onChange={(e) => setPaidOn(e.target.value)} required />
        </Field>
        {saveError && <p className="error">{saveError}</p>}
      </form>
    </Screen>
  )
}

type Terms = { principal: number; rateBp: number; weeks: number; lateFee: number; startDate: string }

function TermsScreen({ title, subtitle, initial, submitLabel, send }: {
  title: string
  subtitle: string
  initial?: { principal: number; weeks: number; rateBp?: number; lateFee?: number }
  submitLabel: string
  send: (terms: Terms) => Promise<{ id: number }>
}) {
  const navigate = useNavigate()
  const { busy, error, setError, run } = useAction()
  const [form, setForm] = useState({
    principal: initial ? String(initial.principal / 100) : '',
    rate: String((initial?.rateBp ?? 2000) / 100),
    weeks: String(initial?.weeks ?? 10),
    lateFee: String((initial?.lateFee ?? 5000) / 100),
    startDate: todayIso(),
  })
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value })

  const principal = toCents(form.principal)
  const rateBp = Math.round(Number(form.rate) * 100)
  const weeks = Number(form.weeks)
  const total = principal + Math.round((principal * rateBp) / 10000)
  const valid = principal > 0 && rateBp >= 0 && Number.isInteger(weeks) && weeks >= 1

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return setError('Revisa la cantidad, el interés y las semanas')
    run(async () => {
      const loan = await send({ principal, rateBp, weeks, lateFee: toCents(form.lateFee) || 0, startDate: form.startDate })
      navigate(`/prestamos/${loan.id}/firmar`, { replace: true })
    })
  }

  return (
    <Screen title={title} back footer={<button className="btn" form="terms" disabled={busy}>{busy ? 'Guardando...' : submitLabel}</button>}>
      <p className="muted">{subtitle}</p>
      <form id="terms" onSubmit={submit}>
        <Field label="Cantidad prestada">
          <input inputMode="decimal" placeholder="$0" value={form.principal} onChange={set('principal')} required />
        </Field>
        <div className="grid2">
          <Field label="Interés total" hint="En porcentaje, 0 sin interés">
            <input inputMode="decimal" value={form.rate} onChange={set('rate')} required />
          </Field>
          <Field label="Semanas">
            <input type="number" min={1} max={104} value={form.weeks} onChange={set('weeks')} required />
          </Field>
        </div>
        <Field label="Comisión por semana atrasada" hint="Se cobra por cada pago semanal que no se cubra a tiempo">
          <input inputMode="decimal" value={form.lateFee} onChange={set('lateFee')} />
        </Field>
        <Field label="Fecha de entrega del dinero" hint="El primer pago vence una semana después">
          <input type="date" value={form.startDate} onChange={set('startDate')} required />
        </Field>
        {valid && (
          <div className="summary">
            <div className="ok"><strong>{money(total)}</strong><span>Total a pagar</span></div>
            <div><strong>{money(Math.floor(total / weeks))}</strong><span>Pago semanal</span></div>
            <div><strong>{money(total - principal)}</strong><span>Ganancia</span></div>
          </div>
        )}
        {error && <p className="error">{error}</p>}
      </form>
    </Screen>
  )
}

export function ApproveLoan() {
  const { id } = useParams()
  const { data, error } = useApi<LoanDetail>(`/admin/loans/${id}`)
  if (!data) return <Screen title="Aprobar préstamo" back><Loading error={error} /></Screen>
  return (
    <TermsScreen
      title="Aprobar préstamo"
      subtitle={`${data.user.name} pidió ${money(data.loan.principal)} a ${data.loan.weeks} semanas.`}
      initial={{ principal: data.loan.principal, weeks: data.loan.weeks }}
      submitLabel="Aprobar y firmar pagaré"
      send={(terms) => api<{ id: number }>('POST', `/admin/loans/${id}/approve`, terms)}
    />
  )
}

export function NewLoan() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { data, error } = useApi<Account>(`/admin/clients/${id}`)
  if (!data) return <Screen title="Nuevo préstamo" back><Loading error={error} /></Screen>
  const previous = data.loans.find((l) => l.id === Number(params.get('renovar')))
  return (
    <TermsScreen
      title={previous ? 'Renovar préstamo' : 'Nuevo préstamo'}
      subtitle={previous ? `Para ${data.user.name}, con las condiciones del préstamo anterior.` : `Para ${data.user.name}`}
      initial={previous}
      submitLabel="Crear y firmar pagaré"
      send={(terms) => api<{ id: number }>('POST', '/admin/loans', { ...terms, clientId: data.user.id })}
    />
  )
}
