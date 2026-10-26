import { useCallback, useEffect, useState } from 'react'
import { api } from './api.ts'

/** Carga datos de la API y permite recargarlos tras un cambio. */
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const reload = useCallback(() => {
    api<T>('GET', path)
      .then((d) => {
        setData(d)
        setError('')
      })
      .catch((e: Error) => setError(e.message))
  }, [path])
  useEffect(reload, [reload])
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])
  return { data, error, reload }
}

/** Ejecuta una acción de formulario con estado de envío y mensaje de error. */
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true)
    setError('')
    try {
      await action()
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}
