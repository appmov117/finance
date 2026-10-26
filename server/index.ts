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
  admin: { phone: env.ADMIN_PHONE, pin: env.ADMIN_PIN, name: env.ADMIN_NAME },
}

await prepare(config)

const app = createApp(config)
app.get('/healthz', (c) => c.text('ok'))
app.use('/*', serveStatic({ root: './dist' }))
// Rutas del lado del cliente: cualquier página no encontrada entrega la PWA.
app.get('/*', serveStatic({ path: './dist/index.html' }))

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Servidor en http://localhost:${info.port}`)
})
