import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { api, storedUser, updateStoredUser } from '../../api.ts'
import { Badge, Empty, Field, ListRow, Loading, Screen, Section } from '../../components/common.tsx'
import { IdPhotos } from '../../components/IdPhotos.tsx'
import { LoanBody } from '../../components/LoanBody.tsx'
import { fullDate, money, toCents } from '../../format.ts'
import { useAction, useApi } from '../../hooks.ts'
import { loanStatus } from '../../status.ts'
import type { Account, User } from '../../types.ts'

export function ClientHome() {
  const { data, error } = useApi<Account>('/me')
  if (!data) return <Screen title="Mi cuenta"><Loading error={error} /></Screen>

  const next = data.loans
    .map((l) => l.summary)
    .filter((s) => s?.nextDue)
    .sort((a, b) => a!.nextDue!.localeCompare(b!.nextDue!))[0]

  return (
    <Screen title="Mi cuenta">
      <h1 className="page-title">Hola, {data.user.name.split(' ')[0]}</h1>

      <div className="balance">
        <span className="label">Debes en total</span>
        <span className="amount">{money(data.totals.balance)}</span>
        <div className="foot">
          <span><span className="label">Próximo pago</span><strong>{next ? money(next.installment) : '-'}</strong></span>
          <span style={{ textAlign: 'right' }}>
            <span className="label">Fecha</span>
            <strong>{next?.nextDue ? fullDate(next.nextDue) : 'Sin pagos pendientes'}</strong>
          </span>
        </div>
      </div>

      {data.totals.overdue > 0 && (
        <p className="alert">Tienes {money(data.totals.overdue)} atrasado. Ponte al corriente para que no se sumen más comisiones.</p>
      )}
      {data.loans.filter((l) => l.status === 'to_sign').map((l) => (
        <Link key={l.id} to={`/prestamos/${l.id}/pagare`} className="alert info">
          Tu préstamo de {money(l.principal)} fue aprobado. Toca aquí para leer y firmar el pagaré.
        </Link>
      ))}
      {data.totals.pending > 0 && <p className="alert info">Tu solicitud de préstamo está en revisión. Te avisaremos por WhatsApp.</p>}

      <Section title="Mis préstamos">
        {data.loans.length === 0 ? (
          <Empty>
            Todavía no tienes préstamos.
            <Link to="/solicitar" className="btn">Pedir un préstamo</Link>
          </Empty>
        ) : (
          <div className="list">
            {data.loans.map((loan) => (
              <ListRow
                key={loan.id}
                to={`/prestamos/${loan.id}`}
                name="$"
                title={money(loan.principal)}
                subtitle={loan.summary ? `Saldo ${money(loan.summary.balance)}` : `${loan.weeks} semanas`}
                side={<Badge status={loanStatus(loan)} />}
              />
            ))}
          </div>
        )}
      </Section>
    </Screen>
  )
}

export function ClientLoan() {
  const { id } = useParams()
  const { data, error } = useApi<Account>('/me')
  const loan = data?.loans.find((l) => l.id === Number(id))
  if (!loan) return <Screen title="Préstamo" back><Loading error={data ? 'Préstamo no encontrado' : error} /></Screen>

  return (
    <Screen title={`Préstamo de ${money(loan.principal)}`} back>
      <div className="section-head">
        <h2>Detalle</h2>
        <Badge status={loanStatus(loan)} />
      </div>
      <LoanBody
        loan={loan}
        contractLink={`/prestamos/${loan.id}/pagare`}
        renewLink={`/solicitar?monto=${loan.principal / 100}&semanas=${loan.weeks}`}
      />
    </Screen>
  )
}

export function RequestLoan() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data, reload } = useApi<Account>('/me')
  const photos = useApi<{ front: boolean; back: boolean }>('/me/id-photos')
  const { busy, error, setError, run } = useAction()
  const [amount, setAmount] = useState(params.get('monto') ?? '')
  const [weeks, setWeeks] = useState(params.get('semanas') ?? '10')
  const [note, setNote] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const principal = toCents(amount)
    if (!(principal > 0)) return setError('Escribe una cantidad válida')
    run(async () => {
      await api('POST', '/me/loans', { principal, weeks: Number(weeks), note })
      navigate('/', { replace: true })
    })
  }

  if (data && data.totals.pending > 0) {
    return (
      <Screen title="Pedir préstamo">
        <Empty>Ya tienes una solicitud en revisión. Te avisaremos por WhatsApp cuando sea aprobada.</Empty>
      </Screen>
    )
  }

  if (data && !data.user.acceptedTerms) return <AcceptTerms onDone={reload} />
  if (photos.data && !(photos.data.front && photos.data.back)) {
    return (
      <Screen title="Pedir préstamo">
        <h2>Primero, tu credencial</h2>
        <IdPhotos onComplete={photos.reload} />
      </Screen>
    )
  }

  return (
    <Screen title="Pedir préstamo">
      {data && data.totals.balance > 0 && (
        <p className="alert info">Todavía debes {money(data.totals.balance)}. Tu solicitud se revisará tomando en cuenta ese saldo.</p>
      )}
      <form onSubmit={submit}>
        <Field label="¿Cuánto necesitas?">
          <input inputMode="decimal" placeholder="$0" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ fontSize: '1.6rem', fontWeight: 800 }} />
        </Field>
        <Field label="¿En cuántas semanas quieres pagar?">
          <input type="number" min={1} max={104} value={weeks} onChange={(e) => setWeeks(e.target.value)} required />
        </Field>
        <Field label="Comentario" hint="Opcional. Por ejemplo, para qué lo necesitas.">
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <p className="muted">El interés y la fecha de entrega se acuerdan al aprobar tu solicitud.</p>
        {error && <p className="error">{error}</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Enviando...' : 'Enviar solicitud'}</button>
      </form>
    </Screen>
  )
}

function AcceptTerms({ onDone }: { onDone: () => void }) {
  const { busy, error, run } = useAction()
  const accept = async () => {
    const ok = await run(async () => {
      const res = await api<{ user: User }>('POST', '/me/accept-terms')
      updateStoredUser({ ...storedUser()!, ...res.user })
    })
    if (ok) onDone()
  }
  return (
    <Screen title="Pedir préstamo">
      <h2>Antes de continuar</h2>
      <p>
        Para pedir un préstamo necesitas aceptar el <Link to="/privacidad">aviso de privacidad</Link> y
        los <Link to="/terminos">términos y deslinde</Link>.
      </p>
      {error && <p className="error">{error}</p>}
      <button className="btn block" disabled={busy} onClick={accept}>Acepto</button>
    </Screen>
  )
}
