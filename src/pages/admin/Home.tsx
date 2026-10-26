import { HandCoins, Inbox, TriangleAlert, UserPlus } from 'lucide-react'
import { Link } from 'react-router'
import { storedUser } from '../../api.ts'
import { Badge, Empty, ListRow, Loading, Screen, Section } from '../../components/common.tsx'
import { money } from '../../format.ts'
import { useApi } from '../../hooks.ts'
import { clientStatus } from '../../status.ts'
import type { ClientRow } from '../../types.ts'

export function AdminHome() {
  const { data, error } = useApi<ClientRow[]>('/admin/clients')
  const firstName = storedUser()?.name.split(' ')[0]
  if (!data) return <Screen title="Préstamos"><Loading error={error} /></Screen>

  const sum = (key: 'balance' | 'overdue' | 'pending') => data.reduce((acc, c) => acc + c[key], 0)
  const late = data.filter((c) => c.overdue > 0)
  const upToDate = data.filter((c) => c.balance > 0 && c.overdue === 0).length
  const attention = [...data]
    .filter((c) => c.overdue > 0 || c.pending > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 5)

  return (
    <Screen title="Préstamos">
      <h1 className="page-title">Hola, {firstName}</h1>

      <div className="balance">
        <span className="label">Te deben en total</span>
        <span className="amount">{money(sum('balance'))}</span>
        <div className="foot">
          <span><span className="label">Atrasado</span><strong>{money(sum('overdue'))}</strong></span>
          <span style={{ textAlign: 'right' }}><span className="label">Clientes</span><strong>{data.length}</strong></span>
        </div>
      </div>

      <div className="tiles">
        <Link to="/clientes/nuevo" className="tile"><UserPlus size={26} />Nuevo cliente</Link>
        <Link to="/solicitudes" className="tile">
          <Inbox size={26} />Solicitudes
          {sum('pending') > 0 && <span className="count">{sum('pending')}</span>}
        </Link>
        <Link to="/clientes?filtro=atrasados" className="tile">
          <TriangleAlert size={26} />Atrasados
          {late.length > 0 && <span className="count">{late.length}</span>}
        </Link>
        <Link to="/clientes" className="tile"><HandCoins size={26} />Registrar pago</Link>
      </div>

      <div className="summary">
        <div className="ok"><strong>{upToDate}</strong><span>Al corriente</span></div>
        <div className="late"><strong>{late.length}</strong><span>Atrasados</span></div>
        <div className="wait"><strong>{sum('pending')}</strong><span>Por revisar</span></div>
      </div>

      <Section title="Requieren atención" action={<Link to="/clientes">Ver todos</Link>}>
        {attention.length === 0 ? (
          <Empty>Todos tus clientes están al corriente.</Empty>
        ) : (
          <div className="list">
            {attention.map((c) => (
              <ListRow
                key={c.id}
                to={`/clientes/${c.id}`}
                name={c.name}
                title={c.name}
                subtitle={c.overdue > 0 ? `Atrasado ${money(c.overdue)}` : 'Pidió un préstamo'}
                side={<Badge status={clientStatus(c)} />}
              />
            ))}
          </div>
        )}
      </Section>
    </Screen>
  )
}
