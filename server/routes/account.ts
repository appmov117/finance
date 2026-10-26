import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { checkPin, hashPin, lockoutAfterFailure, type AuthEnv, type createAuth } from '../auth.ts'
import type { DB } from '../db/client.ts'
import { idPhotos, loans, users } from '../db/schema.ts'
import { loadLoans, todayIn, totalsOf } from '../loans.ts'
import { loanRequestBody, loginBody, parseBody, profileBody, registerBody } from '../validation.ts'

type Auth = ReturnType<typeof createAuth>

export function publicUser(user: typeof users.$inferSelect) {
  const { id, role, name, phone, address } = user
  return { id, role, name, phone, address, acceptedTerms: user.acceptedTermsAt !== null }
}

export function accountRoutes(db: DB, auth: Auth, timezone: string) {
  const app = new Hono<AuthEnv>()

  app.post('/auth/register', async (c) => {
    const body = await parseBody(c.req, registerBody)
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.phone, body.phone))
    if (existing) throw new HTTPException(409, { message: 'Ese teléfono ya está registrado' })
    const [user] = await db
      .insert(users)
      .values({
        name: body.name,
        phone: body.phone,
        address: body.address,
        pinHash: await hashPin(body.pin),
        acceptedTermsAt: new Date(),
      })
      .returning()
    return c.json({ token: await auth.sign({ userId: user.id, role: user.role }), user: publicUser(user) }, 201)
  })

  app.post('/auth/login', async (c) => {
    const body = await parseBody(c.req, loginBody)
    const [user] = await db.select().from(users).where(eq(users.phone, body.phone))
    if (!user) throw new HTTPException(401, { message: 'Teléfono o PIN incorrectos' })
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HTTPException(429, { message: 'Demasiados intentos. Espera 15 minutos.' })
    }
    if (!(await checkPin(body.pin, user.pinHash))) {
      await db.update(users).set(lockoutAfterFailure(user.failedAttempts)).where(eq(users.id, user.id))
      throw new HTTPException(401, { message: 'Teléfono o PIN incorrectos' })
    }
    await db.update(users).set({ failedAttempts: 0, lockedUntil: null }).where(eq(users.id, user.id))
    return c.json({ token: await auth.sign({ userId: user.id, role: user.role }), user: publicUser(user) })
  })

  app.use('/me', auth.requireUser)
  app.use('/me/*', auth.requireUser)

  app.get('/me', async (c) => {
    const { userId } = c.get('session')
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user) throw new HTTPException(401, { message: 'Inicia sesión' })
    const views = await loadLoans(db, [userId], todayIn(timezone))
    return c.json({ user: publicUser(user), loans: views, totals: totalsOf(views) })
  })

  app.put('/me', async (c) => {
    const body = await parseBody(c.req, profileBody)
    const changes = { name: body.name, address: body.address, ...(body.pin && { pinHash: await hashPin(body.pin) }) }
    const [user] = await db.update(users).set(changes).where(eq(users.id, c.get('session').userId)).returning()
    return c.json({ user: publicUser(user) })
  })

  app.post('/me/accept-terms', async (c) => {
    const [user] = await db
      .update(users)
      .set({ acceptedTermsAt: new Date() })
      .where(eq(users.id, c.get('session').userId))
      .returning()
    return c.json({ user: publicUser(user) })
  })

  app.post('/me/loans', async (c) => {
    const { userId } = c.get('session')
    const body = await parseBody(c.req, loanRequestBody)
    const [user] = await db.select().from(users).where(eq(users.id, userId))
    if (!user.acceptedTermsAt) throw new HTTPException(409, { message: 'Acepta el aviso de privacidad y los términos' })
    const photos = await db.select({ side: idPhotos.side }).from(idPhotos).where(eq(idPhotos.userId, userId))
    if (photos.length < 2) throw new HTTPException(409, { message: 'Sube las fotos de tu credencial por ambos lados' })
    const [pending] = await db
      .select({ id: loans.id })
      .from(loans)
      .where(and(eq(loans.clientId, userId), eq(loans.status, 'requested')))
    if (pending) throw new HTTPException(409, { message: 'Ya tienes una solicitud en revisión' })
    const [loan] = await db.insert(loans).values({ clientId: userId, ...body }).returning()
    return c.json({ id: loan.id }, 201)
  })

  return app
}
