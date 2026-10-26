import { and, asc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { hashPin, type AuthEnv, type createAuth } from '../auth.ts'
import type { DB } from '../db/client.ts'
import { loans, payments, users } from '../db/schema.ts'
import { loadLoans, todayIn, totalsOf } from '../loans.ts'
import { clientBody, idParam, loanTermsBody, newLoanBody, parseBody, paymentBody } from '../validation.ts'
import { publicUser } from './account.ts'

type Auth = ReturnType<typeof createAuth>

export function adminRoutes(db: DB, auth: Auth, timezone: string) {
  const app = new Hono<AuthEnv>()
  app.use('*', auth.requireUser, auth.requireAdmin)

  async function findLoan(id: number) {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id))
    if (!loan) throw new HTTPException(404, { message: 'Préstamo no encontrado' })
    return loan
  }

  app.get('/clients', async (c) => {
    const clients = await db.select().from(users).where(eq(users.role, 'client')).orderBy(asc(users.name))
    const views = await loadLoans(db, clients.map((u) => u.id), todayIn(timezone))
    return c.json(
      clients.map((u) => ({ ...publicUser(u), ...totalsOf(views.filter((v) => v.clientId === u.id)) })),
    )
  })

  app.post('/clients', async (c) => {
    const body = await parseBody(c.req, clientBody)
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.phone, body.phone))
    if (existing) throw new HTTPException(409, { message: 'Ese teléfono ya está registrado' })
    const [user] = await db
      .insert(users)
      .values({ name: body.name, phone: body.phone, address: body.address, pinHash: await hashPin(body.pin) })
      .returning()
    return c.json(publicUser(user), 201)
  })

  app.delete('/clients/:id', async (c) => {
    const id = idParam(c.req.param('id'))
    const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.role, 'client')))
    if (!user) throw new HTTPException(404, { message: 'Cliente no encontrado' })
    const { balance } = totalsOf(await loadLoans(db, [id], todayIn(timezone)))
    if (balance > 0) throw new HTTPException(409, { message: 'No puedes eliminar a un cliente con saldo pendiente' })
    await db.transaction(async (tx) => {
      await tx.delete(loans).where(eq(loans.clientId, id))
      await tx.delete(users).where(eq(users.id, id))
    })
    return c.json({ id })
  })

  app.get('/clients/:id', async (c) => {
    const id = idParam(c.req.param('id'))
    const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.role, 'client')))
    if (!user) throw new HTTPException(404, { message: 'Cliente no encontrado' })
    const views = await loadLoans(db, [id], todayIn(timezone))
    return c.json({ user: publicUser(user), loans: views, totals: totalsOf(views) })
  })

  app.get('/requests', async (c) => {
    const rows = await db
      .select({
        id: loans.id,
        clientId: loans.clientId,
        principal: loans.principal,
        weeks: loans.weeks,
        note: loans.note,
        createdAt: loans.createdAt,
        clientName: users.name,
        clientPhone: users.phone,
      })
      .from(loans)
      .innerJoin(users, eq(users.id, loans.clientId))
      .where(eq(loans.status, 'requested'))
      .orderBy(asc(loans.createdAt))
    return c.json(rows)
  })

  app.get('/loans/:id', async (c) => {
    const loan = await findLoan(idParam(c.req.param('id')))
    const [user] = await db.select().from(users).where(eq(users.id, loan.clientId))
    const views = await loadLoans(db, [loan.clientId], todayIn(timezone))
    return c.json({ user: publicUser(user), loan: views.find((v) => v.id === loan.id) })
  })

  app.post('/loans', async (c) => {
    const body = await parseBody(c.req, newLoanBody)
    const [client] = await db.select({ id: users.id }).from(users).where(eq(users.id, body.clientId))
    if (!client) throw new HTTPException(404, { message: 'Cliente no encontrado' })
    const [loan] = await db.insert(loans).values({ ...body, status: 'to_sign' }).returning()
    return c.json({ id: loan.id }, 201)
  })

  app.post('/loans/:id/approve', async (c) => {
    const loan = await findLoan(idParam(c.req.param('id')))
    if (loan.status !== 'requested') throw new HTTPException(409, { message: 'La solicitud ya fue atendida' })
    const body = await parseBody(c.req, loanTermsBody)
    await db.update(loans).set({ ...body, status: 'to_sign' }).where(eq(loans.id, loan.id))
    return c.json({ id: loan.id })
  })

  app.post('/loans/:id/reject', async (c) => {
    const loan = await findLoan(idParam(c.req.param('id')))
    if (loan.status !== 'requested') throw new HTTPException(409, { message: 'La solicitud ya fue atendida' })
    await db.update(loans).set({ status: 'rejected' }).where(eq(loans.id, loan.id))
    return c.json({ id: loan.id })
  })

  app.post('/loans/:id/payments', async (c) => {
    const loan = await findLoan(idParam(c.req.param('id')))
    if (loan.status !== 'active' && loan.status !== 'to_sign') {
      throw new HTTPException(409, { message: 'El préstamo no está activo' })
    }
    const body = await parseBody(c.req, paymentBody)
    const [payment] = await db.insert(payments).values({ loanId: loan.id, ...body }).returning()
    return c.json({ id: payment.id }, 201)
  })

  app.delete('/payments/:id', async (c) => {
    const id = idParam(c.req.param('id'))
    const deleted = await db.delete(payments).where(eq(payments.id, id)).returning({ id: payments.id })
    if (deleted.length === 0) throw new HTTPException(404, { message: 'Pago no encontrado' })
    return c.json({ id })
  })

  return app
}
