import { Camera, Check } from 'lucide-react'
import { useState } from 'react'
import { api } from '../api.ts'
import { useApi } from '../hooks.ts'

type Side = 'front' | 'back'
const LABEL: Record<Side, string> = { front: 'Frente', back: 'Reverso' }
const MAX_SIDE = 1400

/** Reduce la foto a un JPEG razonable antes de subirla. */
async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8)
}

export function IdPhotos({ onComplete }: { onComplete?: () => void }) {
  const { data, reload } = useApi<Record<Side, boolean>>('/me/id-photos')
  const [busy, setBusy] = useState<Side | null>(null)
  const [error, setError] = useState('')

  const upload = async (side: Side, file: File | undefined) => {
    if (!file) return
    setBusy(side)
    setError('')
    try {
      await api('PUT', `/me/id-photos/${side}`, { data: await compress(file) })
      const next = { ...data!, [side]: true }
      reload()
      if (next.front && next.back) onComplete?.()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="section">
      <p className="muted">
        Toma una foto clara de tu INE por ambos lados. Solo la ve quien te presta, para confirmar tu identidad.
      </p>
      <div className="grid2">
        {(['front', 'back'] as Side[]).map((side) => (
          <label key={side} className={`id-slot${data?.[side] ? ' done' : ''}`}>
            <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => upload(side, e.target.files?.[0])} />
            {data?.[side] ? <Check size={26} /> : <Camera size={26} />}
            <strong>{LABEL[side]}</strong>
            <span className="muted">{busy === side ? 'Subiendo...' : data?.[side] ? 'Cambiar foto' : 'Tomar foto'}</span>
          </label>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
