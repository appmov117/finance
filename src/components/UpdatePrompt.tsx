import { X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

const CHECK_EVERY_MS = 60 * 60 * 1000

/** Avisa cuando hay una versión nueva publicada y la instala al tocar Actualizar. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => navigator.onLine && registration.update()
      setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && check())
    },
  })

  const update = async () => {
    await updateServiceWorker(true)
    // Si la versión nueva ya estaba activa no hay recarga automática; se fuerza.
    setTimeout(() => window.location.reload(), 1500)
  }

  if (!needRefresh) return null
  return (
    <div className="update" role="status">
      <span>Hay una versión nueva de la app.</span>
      <button className="btn" onClick={update}>Actualizar</button>
      <button className="icon-button" aria-label="Cerrar aviso" onClick={() => setNeedRefresh(false)}>
        <X size={18} />
      </button>
    </div>
  )
}
