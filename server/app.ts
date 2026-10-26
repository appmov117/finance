import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { createAuth, hashPin } from './auth.ts'
import { bootstrap, type DB } from './db/client.ts'
import { users } from './db/schema.ts'
import { accountRoutes } from './routes/account.ts'
import { adminRoutes } from './routes/admin.ts'
import { documentRoutes } from './routes/documents.ts'

export interface AppConfig {
  db: DB
  secretKey: string
  timezone: string
  /** Lugar de suscripción que aparece en los pagarés. */
  city: string
  /** Correo de contacto que aparece en el aviso de privacidad y los términos. */
  contactEmail: string
  admin: { phone: string; pin: string; name: string }
}

/** Crea las tablas si faltan y asegura que exista la cuenta de administradora. */
export async function prepare(config: AppConfig): Promise<void> {
  await bootstrap(config.db)
  const [admin] = await config.db.select({ id: users.id }).from(users).where(eq(users.phone, config.admin.phone))
  if (!admin) {
    await config.db.insert(users).values({
      role: 'admin',
      name: config.admin.name,
      phone: config.admin.phone,
      pinHash: await hashPin(config.admin.pin),
    })
  }
}

export function createApp(config: AppConfig) {
  const auth = createAuth(config.secretKey)
  const api = new Hono()
    .route('/', accountRoutes(config.db, auth, config.timezone))
    .route('/admin', adminRoutes(config.db, auth, config.timezone))
    .route('/', documentRoutes(config.db, auth, config))

  api.onError((err, c) => {
    if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
    console.error(err)
    return c.json({ error: 'Error inesperado, intenta de nuevo' }, 500)
  })
  api.notFound((c) => c.json({ error: 'No encontrado' }, 404))

  return new Hono().route('/api', api)
}
