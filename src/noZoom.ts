/**
 * Bloquea el zoom para que la PWA se comporte como una app nativa.
 * La etiqueta viewport no basta: Safari la ignora y en computadora no aplica.
 */
const block = (e: Event) => e.preventDefault()
const active = { passive: false } as const

// Pellizco con dos dedos (Android y Safari).
document.addEventListener('touchmove', (e) => e.touches.length > 1 && e.preventDefault(), active)
for (const name of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(name, block, active)

// Doble toque rápido.
let lastTouch = 0
document.addEventListener(
  'touchend',
  (e) => {
    const now = Date.now()
    if (now - lastTouch < 300 && !(e.target as HTMLElement).closest('input, textarea, select')) e.preventDefault()
    lastTouch = now
  },
  active,
)

// Computadora: Ctrl/Cmd + rueda, pellizco en trackpad y Ctrl/Cmd con + - 0.
document.addEventListener('wheel', (e) => (e.ctrlKey || e.metaKey) && e.preventDefault(), active)
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '_', '0'].includes(e.key)) e.preventDefault()
})
