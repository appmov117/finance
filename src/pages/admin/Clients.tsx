import { Search, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api } from '../../api.ts'
import { Badge, Empty, Field, ListRow, Loading, Screen } from '../../components/common.tsx'
import { money, prettyPhone } from '../../format.ts'
import { useAction, useApi } from '../../hooks.ts'
import { clientStatus } from '../../status.ts'
import type { ClientRow, User } from '../../types.ts'

const FILTERS = {
  todos: { label: 'Todos', test: () => true },
  atrasados: { label: 'Atrasados', test: (c: ClientRow) => c.overdue > 0 },
  corriente: { label: 'Al corriente', test: (c: ClientRow) => c.balance > 0 && c.overdue === 0 },
  sindeuda: { label: 'Sin deuda', test: (c: ClientRow) => c.balance === 0 },
} as const
type FilterKey = keyof typeof FILTERS

export function Clients() {
  const { data, error } = useApi<ClientRow[]>('/admin/clients')
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const filter = (params.get('filtro') as FilterKey) in FILTERS ? (params.get('filtro') as FilterKey) : 'todos'

  const add = <Link to="/clientes/nuevo" className="icon-button" aria-label="Nuevo cliente"><UserPlus size={22} /></Link>
  if (!data) return <Screen title="Clientes" right={add}><Loading error={error} /></Screen>

  const q = query.trim().toLowerCase()
  const visible = data
    .filter(FILTERS[filter].test)
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q.replace(/\D/g, '') || q))
    .sort((a, b) => b.overdue - a.overdue || b.balance - a.balance)

  return (
    <Screen title="Clientes" right={add}>
      <div className="search">
        <Search size={18} />
        <input type="search" placeholder="Buscar por nombre o teléfono" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="segmented" role="tablist">
        {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={filter === key ? 'active' : ''}
            onClick={() => setParams(key === 'todos' ? {} : { filtro: key }, { replace: true })}
          >
            {FILTERS[key].label} ({data.filter(FILTERS[key].test).length})
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <Empty>
          {data.length === 0 ? 'Aún no tienes clientes.' : 'Ningún cliente coincide con la búsqueda.'}
          {data.length === 0 && <Link to="/clientes/nuevo" className="btn">Registrar cliente</Link>}
        </Empty>
      ) : (
        <div className="list">
          {visible.map((c) => (
            <ListRow
              key={c.id}
              to={`/clientes/${c.id}`}
              name={c.name}
              title={c.name}
              subtitle={prettyPhone(c.phone)}
              side={<><span className="money">{money(c.balance)}</span><Badge status={clientStatus(c)} /></>}
            />
          ))}
        </div>
      )}
    </Screen>
  )
}

export function NewClient() {
  const navigate = useNavigate()
  const { busy, error, run } = useAction()
  const [form, setForm] = useState({ name: '', phone: '', address: '', pin: '' })
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      const user = await api<User>('POST', '/admin/clients', form)
      navigate(`/clientes/${user.id}`, { replace: true })
    })
  }

  return (
    <Screen
      title="Nuevo cliente"
      back
      footer={<button className="btn" form="new-client" disabled={busy}>{busy ? 'Guardando...' : 'Registrar cliente'}</button>}
    >
      <form id="new-client" onSubmit={submit}>
        <Field label="Nombre completo">
          <input value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="Teléfono">
          <input type="tel" inputMode="numeric" placeholder="10 dígitos" value={form.phone} onChange={set('phone')} required />
        </Field>
        <Field label="Dirección">
          <input value={form.address} onChange={set('address')} />
        </Field>
        <Field label="PIN inicial" hint="Compártelo con tu cliente para que pueda consultar su saldo. Lo puede cambiar después.">
          <input inputMode="numeric" maxLength={6} value={form.pin} onChange={set('pin')} required />
        </Field>
        {error && <p className="error">{error}</p>}
      </form>
    </Screen>
  )
}
