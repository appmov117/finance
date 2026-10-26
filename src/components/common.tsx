import { ChevronLeft, ChevronRight, ClipboardList, Home, Inbox, User, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { storedUser } from '../api.ts'
import { initials, type Status } from '../status.ts'

export function Screen({ title, back, right, footer, tabs = !back, children }: {
  title: string
  back?: boolean
  right?: ReactNode
  footer?: ReactNode
  tabs?: boolean
  children: ReactNode
}) {
  const navigate = useNavigate()
  const loggedIn = storedUser() !== null
  return (
    <div className={`screen${loggedIn ? ' has-nav' : ''}`}>
      <header className="screen-header">
        {back ? (
          <button className="icon-button" onClick={() => navigate(-1)} aria-label="Regresar">
            <ChevronLeft size={24} />
          </button>
        ) : <span />}
        <h1>{title}</h1>
        {right ?? <span />}
      </header>
      <main className={`screen-body${tabs ? '' : ' no-tabs'}`}>{children}</main>
      {footer && <footer className="screen-footer">{footer}</footer>}
      {loggedIn && <TabBar desktopOnly={!tabs || !!footer} />}
    </div>
  )
}

function TabBar({ desktopOnly }: { desktopOnly: boolean }) {
  const admin = storedUser()?.role === 'admin'
  const tabs = admin
    ? [
        { to: '/', label: 'Inicio', icon: Home },
        { to: '/clientes', label: 'Clientes', icon: Users },
        { to: '/solicitudes', label: 'Solicitudes', icon: Inbox },
        { to: '/cuenta', label: 'Cuenta', icon: User },
      ]
    : [
        { to: '/', label: 'Inicio', icon: Home },
        { to: '/solicitar', label: 'Pedir préstamo', icon: ClipboardList },
        { to: '/cuenta', label: 'Mis datos', icon: User },
      ]
  return (
    <nav className={`tabbar${desktopOnly ? ' desktop-only' : ''}`}>
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end>
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Badge({ status }: { status: Status }) {
  return <span className={`badge ${status.tone}`}>{status.label}</span>
}

export function ListRow({ to, name, title, subtitle, side }: {
  to: string
  name: string
  title: ReactNode
  subtitle: ReactNode
  side: ReactNode
}) {
  return (
    <Link to={to} className="row">
      <span className="avatar">{initials(name)}</span>
      <span className="main">
        <strong>{title}</strong>
        <span className="muted">{subtitle}</span>
      </span>
      <span className="side">{side}</span>
      <ChevronRight size={18} />
    </Link>
  )
}

export function Loading({ error }: { error?: string }) {
  return <p className={error ? 'error' : 'muted'}>{error || 'Cargando...'}</p>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      {label}
      {children}
      {hint && <small>{hint}</small>}
    </label>
  )
}
