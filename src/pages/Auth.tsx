import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { api, saveSession } from '../api.ts'
import { Field } from '../components/common.tsx'
import { useAction } from '../hooks.ts'
import type { User } from '../types.ts'

type SessionResponse = { token: string; user: User }

function Welcome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="welcome">
      <div className="welcome-top">
        <img src="/icon-192.png" alt="" />
        <h1>Préstamos</h1>
        <p>Consulta tu saldo y tus pagos de cada semana desde tu celular.</p>
      </div>
      <div className="welcome-card">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

function useSession() {
  const navigate = useNavigate()
  return (res: SessionResponse) => {
    saveSession(res.token, res.user)
    navigate('/', { replace: true })
  }
}

export function Login() {
  const start = useSession()
  const { busy, error, run } = useAction()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    run(async () => start(await api<SessionResponse>('POST', '/auth/login', { phone, pin })))
  }

  return (
    <Welcome title="Inicia sesión">
      <form onSubmit={submit}>
        <Field label="Teléfono">
          <input type="tel" inputMode="numeric" autoComplete="tel" placeholder="10 dígitos" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </Field>
        <Field label="PIN">
          <input type="password" inputMode="numeric" autoComplete="current-password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} required />
        </Field>
        {error && <p className="error">{error}</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
      </form>
      <p className="switch">¿Primera vez? <Link to="/registro">Crea tu cuenta</Link></p>
      <p className="switch legal-links"><Link to="/privacidad">Aviso de privacidad</Link> <Link to="/terminos">Términos</Link></p>
    </Welcome>
  )
}

export function Register() {
  const start = useSession()
  const { busy, error, setError, run } = useAction()
  const [form, setForm] = useState({ name: '', phone: '', address: '', pin: '', pin2: '' })
  const [accept, setAccept] = useState(false)
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (form.pin !== form.pin2) return setError('Los PIN no coinciden')
    if (!accept) return setError('Debes aceptar el aviso de privacidad y los términos')
    const { pin2: _, ...body } = form
    run(async () => start(await api<SessionResponse>('POST', '/auth/register', { ...body, acceptTerms: true })))
  }

  return (
    <Welcome title="Crea tu cuenta">
      <form onSubmit={submit}>
        <Field label="Nombre completo">
          <input autoComplete="name" value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="Teléfono">
          <input type="tel" inputMode="numeric" autoComplete="tel" placeholder="10 dígitos" value={form.phone} onChange={set('phone')} required />
        </Field>
        <Field label="Dirección">
          <input autoComplete="street-address" value={form.address} onChange={set('address')} />
        </Field>
        <div className="grid2">
          <Field label="PIN" hint="De 4 a 6 números">
            <input type="password" inputMode="numeric" maxLength={6} value={form.pin} onChange={set('pin')} required />
          </Field>
          <Field label="Repite el PIN">
            <input type="password" inputMode="numeric" maxLength={6} value={form.pin2} onChange={set('pin2')} required />
          </Field>
        </div>
        <label className="check">
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} />
          <span>
            Acepto el <Link to="/privacidad">aviso de privacidad</Link> y los <Link to="/terminos">términos y deslinde</Link>.
          </span>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Creando cuenta...' : 'Crear cuenta'}</button>
      </form>
      <p className="switch">¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link></p>
    </Welcome>
  )
}
