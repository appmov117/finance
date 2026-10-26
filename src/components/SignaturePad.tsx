import { useEffect, useRef, useState } from 'react'

/** Lienzo para firmar con el dedo o el mouse; entrega la firma como PNG en data URL. */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const inked = useRef(false)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ratio = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    const ctx = canvas.getContext('2d')!
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#13261b'
  }, [])

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top] as const
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const ctx = e.currentTarget.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(...point(e))
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = e.currentTarget.getContext('2d')!
    ctx.lineTo(...point(e))
    ctx.stroke()
    inked.current = true
    setEmpty(false)
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    if (inked.current) onChange(canvasRef.current!.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    inked.current = false
    setEmpty(true)
    onChange(null)
  }

  return (
    <div className="signature">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        aria-label="Área para firmar"
      />
      {empty && <span className="signature-hint">Firma aquí con tu dedo</span>}
      <button type="button" className="link-button" onClick={clear}>Borrar firma</button>
    </div>
  )
}
