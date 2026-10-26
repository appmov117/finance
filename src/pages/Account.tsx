import { LogOut } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { api, clearSession, storedUser, updateStoredUser } from '../api.ts'
import { Field, Screen, Section } from '../components/common.tsx'
import { IdPhotos } from '../components/IdPhotos.tsx'
import { prettyPhone } from '../format.ts'
import { useAction } from '../hooks.ts'
import type { User } from '../types.ts'

export function Account() {
  const navigate = useNavigate()
  const user = storedUser()!
  const { busy, error, run } = useAction()
  const [name, setName] = useState(user.name)
  const [address, setAddress] = useState(user.address)
  const [pin, setPin] = useState('')
  const [saved, setSaved] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaved(false)
    const ok = await run(async () => {
      const res = await api<{ user: User }>('PUT', '/me', { name, address, ...(pin && { pin }) })
      updateStoredUser(res.user)
    })
    if (ok) {
      setPin('')
      setSaved(true)
    }
  }

  const logout = () => {
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <Screen title={user.role === 'admin' ? 'Cuenta' : 'Mis datos'}>
      <Section title="Datos personales">
        <form onSubmit={submit}>
          <Field label="Teléfono" hint="Para cambiarlo, pide ayuda a quien te presta.">
            <input value={prettyPhone(user.phone)} disabled />
          </Field>
          <Field label="Nombre completo">
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Dirección">
            <input value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Nuevo PIN" hint="Déjalo vacío si no quieres cambiarlo.">
            <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} />
          </Field>
          {error && <p className="error">{error}</p>}
          {saved && <p className="alert ok">Datos guardados.</p>}
          <button className="btn block" disabled={busy}>{busy ? 'Guardando...' : 'Guardar cambios'}</button>
        </form>
      </Section>
      {user.role === 'client' && (
        <Section title="Tu credencial (INE)">
          <IdPhotos />
        </Section>
      )}
      <p className="muted legal-links">
        <Link to="/privacidad">Aviso de privacidad</Link> <Link to="/terminos">Términos y deslinde</Link>
      </p>
      <button className="btn ghost block" onClick={logout}>
        <LogOut size={18} /> Cerrar sesión
      </button>
    </Screen>
  )
}
