import { MessageCircle, Phone, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { api } from '../../api.ts'
import { Badge, Empty, ListRow, Loading, Screen, Section } from '../../components/common.tsx'
import { fullDate, money, prettyPhone, whatsappLink } from '../../format.ts'
import { useAction, useApi } from '../../hooks.ts'
import { loanStatus } from '../../status.ts'
import type { Account, RequestRow } from '../../types.ts'

export function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, error } = useApi<Account>(`/admin/clients/${id}`)
  const remove = useAction()
  const [showId, setShowId] = useState(false)
  if (!data) return <Screen title="Cliente" back><Loading error={error} /></Screen>
  const { user, loans, totals } = data

  const deleteClient = async () => {
    const ok = confirm(`¿Eliminar a ${user.name}? Se borrarán sus préstamos, pagos, pagarés y fotos. No se puede deshacer.`)
    if (ok && (await remove.run(() => api('DELETE', `/admin/clients/${user.id}`)))) navigate('/clientes', { replace: true })
  }

  return (
    <Screen
      title={user.name}
      back
      footer={<Link to={`/clientes/${user.id}/prestamo`} className="btn"><Plus size={18} />Nuevo préstamo</Link>}
    >
      <div className="row" style={{ border: 'none', padding: 0 }}>
        <span className="main">
          <strong style={{ fontSize: '1.25rem' }}>{user.name}</strong>
          <span className="muted">{prettyPhone(user.phone)}</span>
          {user.address && <span className="muted">{user.address}</span>}
        </span>
      </div>

      <div className="summary">
        <div><strong>{money(totals.balance)}</strong><span>Saldo</span></div>
        <div className={totals.overdue > 0 ? 'late' : 'ok'}><strong>{money(totals.overdue)}</strong><span>Atrasado</span></div>
        <div className={totals.pending > 0 ? 'wait' : ''}><strong>{totals.pending}</strong><span>Solicitudes</span></div>
      </div>

      <div className="grid2">
        <a className="btn whatsapp" href={whatsappLink(user, loans)} target="_blank" rel="noreferrer">
          <MessageCircle size={18} />Enviar saldo
        </a>
        <a className="btn ghost" href={`tel:${user.phone}`}><Phone size={18} />Llamar</a>
      </div>

      <Section title="Préstamos">
        {loans.length === 0 ? (
          <Empty>Este cliente aún no tiene préstamos.</Empty>
        ) : (
          <div className="list">
            {loans.map((loan) => (
              <ListRow
                key={loan.id}
                to={`/prestamos/${loan.id}`}
                name="$"
                title={money(loan.principal)}
                subtitle={
                  loan.summary
                    ? `Saldo ${money(loan.summary.balance)}`
                    : `Pedido el ${fullDate(loan.createdAt.slice(0, 10))}`
                }
                side={<Badge status={loanStatus(loan)} />}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Credencial (INE)">
        {showId ? <ClientIdPhotos clientId={user.id} /> : (
          <button className="btn ghost" onClick={() => setShowId(true)}>Ver fotos de la credencial</button>
        )}
      </Section>

      <div className="section">
        <button className="btn danger" disabled={remove.busy || totals.balance > 0} onClick={deleteClient}>
          <Trash2 size={18} />Eliminar cliente
        </button>
        {totals.balance > 0 && <p className="muted">Solo puedes eliminar clientes sin saldo pendiente.</p>}
        {remove.error && <p className="error">{remove.error}</p>}
      </div>
    </Screen>
  )
}

function ClientIdPhotos({ clientId }: { clientId: number }) {
  const { data, error } = useApi<{ front: string | null; back: string | null }>(`/admin/clients/${clientId}/id-photos`)
  if (!data) return <Loading error={error} />
  if (!data.front && !data.back) return <p className="muted">El cliente aún no sube su credencial.</p>
  return (
    <div className="id-photos">
      {data.front ? <img src={data.front} alt="Frente de la credencial" /> : <p className="muted">Falta el frente.</p>}
      {data.back ? <img src={data.back} alt="Reverso de la credencial" /> : <p className="muted">Falta el reverso.</p>}
    </div>
  )
}

export function Requests() {
  const { data, error } = useApi<RequestRow[]>('/admin/requests')
  return (
    <Screen title="Solicitudes">
      {!data ? (
        <Loading error={error} />
      ) : data.length === 0 ? (
        <Empty>No hay solicitudes por revisar.</Empty>
      ) : (
        <div className="list">
          {data.map((r) => (
            <ListRow
              key={r.id}
              to={`/prestamos/${r.id}`}
              name={r.clientName}
              title={r.clientName}
              subtitle={`${r.weeks} semanas, pedido el ${fullDate(r.createdAt.slice(0, 10))}`}
              side={<span className="money">{money(r.principal)}</span>}
            />
          ))}
        </div>
      )}
    </Screen>
  )
}
