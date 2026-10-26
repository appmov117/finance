import { and, asc, eq } from 'drizzle-orm'
import { Hono, type Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { AuthEnv, createAuth } from '../auth.ts'
import { buildPagare, contractHash } from '../contract.ts'
import type { DB } from '../db/client.ts'
import { idPhotos, loans, users } from '../db/schema.ts'
import { todayIn } from '../loans.ts'
import { idParam, idPhotoBody, parseBody, signBody } from '../validation.ts'

type Auth = ReturnType<typeof createAuth>
type LoanRow = typeof loans.$inferSelect

export interface DocsConfig {
  timezone: string
  city: string
  contactEmail: string
}

export function documentRoutes(db: DB, auth: Auth, config: DocsConfig) {
  const app = new Hono<AuthEnv>()
  app.use('/me/*', auth.requireUser)
  app.use('/admin/*', auth.requireUser, auth.requireAdmin)

  async function contractFor(loan: LoanRow) {
    if (loan.contractText) {
      return { text: loan.contractText, hash: loan.contractHash, signature: loan.signature, signedAt: loan.signedAt }
    }
    if (!loan.startDate) throw new HTTPException(409, { message: 'El préstamo aún no tiene condiciones' })
    const [debtor] = await db.select().from(users).where(eq(users.id, loan.clientId))
    const [lender] = await db.select().from(users).where(eq(users.role, 'admin')).orderBy(asc(users.id)).limit(1)
    const text = buildPagare({
      folio: loan.id,
      terms: { ...loan, startDate: loan.startDate },
      signDate: todayIn(config.timezone),
      city: config.city,
      lender: { name: lender.name, address: lender.address },
      debtor: { name: debtor.name, address: debtor.address, phone: debtor.phone },
    })
    return { text, hash: null, signature: null, signedAt: null }
  }

  async function ownLoan(userId: number, id: number) {
    const [loan] = await db.select().from(loans).where(and(eq(loans.id, id), eq(loans.clientId, userId)))
    if (!loan) throw new HTTPException(404, { message: 'Préstamo no encontrado' })
    return loan
  }

  app.get('/info', async (c) => {
    return c.json({ email: config.contactEmail })
  })

  app.get('/me/id-photos', async (c) => {
    const rows = await db.select({ side: idPhotos.side }).from(idPhotos).where(eq(idPhotos.userId, c.get('session').userId))
    return c.json({ front: rows.some((r) => r.side === 'front'), back: rows.some((r) => r.side === 'back') })
  })

  app.put('/me/id-photos/:side', async (c) => {
    const side = c.req.param('side')
    if (side !== 'front' && side !== 'back') throw new HTTPException(404, { message: 'No encontrado' })
    const { data } = await parseBody(c.req, idPhotoBody)
    const userId = c.get('session').userId
    await db
      .insert(idPhotos)
      .values({ userId, side, data })
      .onConflictDoUpdate({ target: [idPhotos.userId, idPhotos.side], set: { data, createdAt: new Date() } })
    return c.json({ side })
  })

  app.get('/me/loans/:id/contract', async (c) => {
    const loan = await ownLoan(c.get('session').userId, idParam(c.req.param('id')))
    return c.json(await contractFor(loan))
  })

  /** Registra la firma del cliente; sirve tanto desde su app como en persona en el celular de la administradora. */
  async function sign(c: Context<AuthEnv>, loan: LoanRow) {
    if (loan.status !== 'to_sign') throw new HTTPException(409, { message: 'Este préstamo no está pendiente de firma' })
    const { signature, text } = await parseBody(c.req, signBody)
    const current = await contractFor(loan)
    if (text !== current.text) throw new HTTPException(409, { message: 'El pagaré cambió, vuelve a leerlo antes de firmar' })
    const meta = {
      ip: c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? '',
      userAgent: c.req.header('user-agent') ?? '',
      inPerson: c.get('session').role === 'admin',
    }
    await db
      .update(loans)
      .set({
        status: 'active',
        contractText: text,
        contractHash: contractHash(text),
        signature,
        signedAt: new Date(),
        signMeta: JSON.stringify(meta),
      })
      .where(eq(loans.id, loan.id))
    return c.json({ id: loan.id })
  }

  app.post('/me/loans/:id/sign', async (c) =>
    sign(c, await ownLoan(c.get('session').userId, idParam(c.req.param('id')))),
  )

  app.post('/admin/loans/:id/sign', async (c) => {
    const [loan] = await db.select().from(loans).where(eq(loans.id, idParam(c.req.param('id'))))
    if (!loan) throw new HTTPException(404, { message: 'Préstamo no encontrado' })
    return sign(c, loan)
  })

  app.get('/admin/loans/:id/contract', async (c) => {
    const [loan] = await db.select().from(loans).where(eq(loans.id, idParam(c.req.param('id'))))
    if (!loan) throw new HTTPException(404, { message: 'Préstamo no encontrado' })
    return c.json({ ...(await contractFor(loan)), meta: loan.signMeta ? JSON.parse(loan.signMeta) : null })
  })

  app.get('/admin/clients/:id/id-photos', async (c) => {
    const rows = await db.select().from(idPhotos).where(eq(idPhotos.userId, idParam(c.req.param('id'))))
    return c.json({
      front: rows.find((r) => r.side === 'front')?.data ?? null,
      back: rows.find((r) => r.side === 'back')?.data ?? null,
    })
  })

  return app
}
