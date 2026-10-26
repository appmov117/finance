import { FileSignature, RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import { dayMonth, fullDate, money, percent } from '../format.ts'
import type { Loan, LoanSummary } from '../types.ts'
import { Section } from './common.tsx'

/** Casillas de pagos semanales: verde pagado, ámbar pagado tarde, rojo vencido. */
function WeekCard({ summary }: { summary: LoanSummary }) {
  const paidPct = Math.min(100, Math.round((summary.paid / (summary.total + summary.fees)) * 100))
  const paidWeeks = summary.schedule.filter((w) => w.status === 'pagado').length
  return (
    <div className="weeks">
      <div className="section-head">
        <strong>{paidWeeks} de {summary.schedule.length} semanas pagadas</strong>
        <span className="muted">{paidPct}%</span>
      </div>
      <div className="progress"><div style={{ width: `${paidPct}%` }} /></div>
      <div className="weeks-grid">
        {summary.schedule.map((w) => (
          <div
            key={w.number}
            className={`week ${w.status}${w.late ? ' late' : ''}${w.dueDate === summary.nextDue ? ' next' : ''}`}
            title={`Semana ${w.number}: ${money(w.amount)}, vence ${fullDate(w.dueDate)}`}
          >
            <b>{w.number}</b>
            {dayMonth(w.dueDate)}
          </div>
        ))}
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--green)' }} />Pagada</span>
        <span><i style={{ background: 'var(--amber)' }} />Pagada tarde</span>
        <span><i style={{ background: 'var(--red)' }} />Vencida</span>
        <span><i style={{ border: '1.5px dashed #c9d3cd' }} />Pendiente</span>
      </div>
    </div>
  )
}

export function LoanBody({ loan, onDeletePayment, contractLink, renewLink }: {
  loan: Loan
  onDeletePayment?: (id: number) => void
  contractLink: string
  renewLink: string
}) {
  const s = loan.summary
  if (!s) {
    return (
      <div className="facts">
        <div><span>Cantidad solicitada</span><strong>{money(loan.principal)}</strong></div>
        <div><span>Plazo</span><strong>{loan.weeks} semanas</strong></div>
        <div><span>Fecha de solicitud</span><strong>{fullDate(loan.createdAt.slice(0, 10))}</strong></div>
        {loan.note && <div><span>Comentario</span><strong>{loan.note}</strong></div>}
      </div>
    )
  }

  return (
    <>
      <div className="balance">
        <span className="label">Saldo pendiente</span>
        <span className="amount">{money(s.balance)}</span>
        <div className="foot">
          <span><span className="label">Pago semanal</span><strong>{money(s.installment)}</strong></span>
          <span style={{ textAlign: 'right' }}>
            <span className="label">Próximo pago</span>
            <strong>{s.nextDue ? fullDate(s.nextDue) : 'Liquidado'}</strong>
          </span>
        </div>
      </div>

      {s.overdue > 0 && (
        <p className="alert">
          Hay {money(s.overdue)} atrasado
          {s.fees > 0 && `, incluye ${money(s.fees)} de comisión por ${s.lateCount} semana${s.lateCount > 1 ? 's' : ''} de retraso`}.
        </p>
      )}

      {s.balance === 0 && (
        <div className="alert ok">
          Préstamo liquidado.{' '}
          <Link to={renewLink} className="inline-action"><RefreshCw size={16} />Renovar préstamo</Link>
        </div>
      )}

      <WeekCard summary={s} />

      <Link to={contractLink} className="row">
        <span className="avatar"><FileSignature size={20} /></span>
        <span className="main">
          <strong>Pagaré</strong>
          <span className="muted">{loan.signedAt ? `Firmado el ${fullDate(loan.signedAt.slice(0, 10))}` : 'Pendiente de firma'}</span>
        </span>
      </Link>

      <Section title="Condiciones">
        <div className="facts">
          <div><span>Prestado</span><strong>{money(loan.principal)}</strong></div>
          <div><span>Interés</span><strong>{percent(loan.rateBp)}</strong></div>
          <div><span>Total a pagar</span><strong>{money(s.total)}</strong></div>
          <div><span>Comisión por atraso</span><strong>{money(loan.lateFee)} por semana</strong></div>
          <div><span>Entregado</span><strong>{loan.startDate && fullDate(loan.startDate)}</strong></div>
          <div><span>Pagado</span><strong>{money(s.paid)}</strong></div>
        </div>
      </Section>

      <Section title={`Pagos recibidos (${loan.payments.length})`}>
        {loan.payments.length === 0 ? (
          <p className="muted">Todavía no hay pagos registrados.</p>
        ) : (
          <div className="list">
            {[...loan.payments].reverse().map((p) => (
              <div key={p.id} className="row" style={{ minHeight: 52 }}>
                <span className="main"><strong>{fullDate(p.paidOn)}</strong></span>
                <span className="money">{money(p.amount)}</span>
                {onDeletePayment && (
                  <button className="link-button" onClick={() => onDeletePayment(p.id)}>Quitar</button>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  )
}
