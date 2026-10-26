import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createApp, prepare } from './app.ts'
import { connect } from './db/client.ts'
import { env } from './env.ts'

const config = {
  db: connect(env.DATABASE_URL),
  secretKey: env.SECRET_KEY,
  timezone: env.TIMEZONE,
  city: env.CONTRACT_CITY,
  contactEmail: env.CONTACT_EMAIL,
  admin: { phone: env.ADMIN_PHONE, pin: env.ADMIN_PIN, name: env.ADMIN_NAME },
}

await prepare(config)

const app = createApp(config)
app.get('/healthz', (c) => c.text('ok'))
// El HTML y el service worker se revalidan siempre para detectar versiones nuevas;
// los archivos con hash en el nombre se pueden guardar por un año.
app.use('/*', async (c, next) => {
  await next()
  const path = c.req.path
  c.header('Cache-Control', path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache')
})
app.use('/*', serveStatic({ root: './dist' }))
// Rutas del lado del cliente: cualquier página no encontrada entrega la PWA.
app.get('/*', serveStatic({ path: './dist/index.html' }))

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Servidor en http://localhost:${info.port}`)
})
