import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp, prepare, type AppConfig } from './app.ts'
import type { DB } from './db/client.ts'

const config: AppConfig = {
  db: drizzle(new PGlite()) as unknown as DB,
  secretKey: 'x'.repeat(40),
  timezone: 'America/Mexico_City',
  city: 'Mérida, Yucatán',
  contactEmail: 'contacto@example.com',
  admin: { phone: '9990000000', pin: '1234', name: 'Admin' },
}
const app = createApp(config)

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await app.request(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, data: (await res.json()) as any }
}

const PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgo='
const PIXEL = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
const regInfo = { clientId: 0 }

const login = async (phone: string, pin: string) => (await call('POST', '/auth/login', { phone, pin })).data.token as string

describe('API', () => {
  let admin: string
  let client: string

  beforeAll(async () => {
    await prepare(config)
    await prepare(config) // idempotente
    admin = await login('9990000000', '1234')
    const reg = await call('POST', '/auth/register', { name: 'Ana López', phone: '999-123-4567', pin: '4321', address: 'Centro', acceptTerms: true })
    expect(reg.status).toBe(201)
    client = reg.data.token
    regInfo.clientId = reg.data.user.id
  })

  it('la información pública solo muestra el correo de contacto', async () => {
    const info = await call('GET', '/info')
    expect(info.data).toEqual({ email: 'contacto@example.com' })
  })

  it('exige aceptar los términos al registrarse', async () => {
    const res = await call('POST', '/auth/register', { name: 'Sin Términos', phone: '9990001111', pin: '1111' })
    expect(res.status).toBe(400)
  })

  it('rechaza teléfono duplicado y PIN incorrecto', async () => {
    expect((await call('POST', '/auth/register', { name: 'Otra', phone: '9991234567', pin: '1111', acceptTerms: true })).status).toBe(409)
    expect((await call('POST', '/auth/login', { phone: '9991234567', pin: '0000' })).status).toBe(401)
  })

  it('un cliente no puede entrar a rutas de administración', async () => {
    expect((await call('GET', '/admin/clients', undefined, client)).status).toBe(403)
    expect((await call('GET', '/admin/clients')).status).toBe(401)
  })

  it('flujo completo: credencial, solicitud, aprobación, firma, pago y saldo', async () => {
    const request = { principal: 200000, weeks: 10, note: 'Para el negocio' }
    expect((await call('POST', '/me/loans', request, client)).status).toBe(409)
    expect((await call('PUT', '/me/id-photos/front', { data: 'no-es-imagen' }, client)).status).toBe(400)
    for (const side of ['front', 'back']) {
      expect((await call('PUT', `/me/id-photos/${side}`, { data: PIXEL }, client)).status).toBe(200)
    }
    expect((await call('GET', '/me/id-photos', undefined, client)).data).toEqual({ front: true, back: true })

    const req = await call('POST', '/me/loans', request, client)
    expect(req.status).toBe(201)
    expect((await call('POST', '/me/loans', { principal: 1000, weeks: 1 }, client)).status).toBe(409)

    const requests = await call('GET', '/admin/requests', undefined, admin)
    expect(requests.data).toMatchObject([{ id: req.data.id, clientName: 'Ana López', principal: 200000 }])

    const terms = { principal: 200000, rateBp: 2000, weeks: 10, lateFee: 5000, startDate: '2026-01-01' }
    expect((await call('POST', `/admin/loans/${req.data.id}/approve`, terms, admin)).status).toBe(200)

    const contract = await call('GET', `/me/loans/${req.data.id}/contract`, undefined, client)
    expect(contract.data.text).toContain('a la orden de Admin')
    expect(contract.data.signedAt).toBeNull()
    const badSign = await call('POST', `/me/loans/${req.data.id}/sign`, { signature: PIXEL_PNG, text: 'otro texto' }, client)
    expect(badSign.status).toBe(409)
    const sign = await call('POST', `/me/loans/${req.data.id}/sign`, { signature: PIXEL_PNG, text: contract.data.text }, client)
    expect(sign.status).toBe(200)
    expect((await call('POST', `/me/loans/${req.data.id}/sign`, { signature: PIXEL_PNG, text: contract.data.text }, client)).status).toBe(409)

    const direct = await call('POST', '/admin/loans', { ...terms, clientId: regInfo.clientId }, admin)
    const directText = (await call('GET', `/admin/loans/${direct.data.id}/contract`, undefined, admin)).data.text
    expect((await call('POST', `/admin/loans/${direct.data.id}/sign`, { signature: PIXEL_PNG, text: directText }, admin)).status).toBe(200)
    const inPerson = await call('GET', `/admin/loans/${direct.data.id}/contract`, undefined, admin)
    expect(inPerson.data.meta.inPerson).toBe(true)

    const signed = await call('GET', `/admin/loans/${req.data.id}/contract`, undefined, admin)
    expect(signed.data).toMatchObject({ text: contract.data.text, signature: PIXEL_PNG })
    expect(signed.data.hash).toHaveLength(64)
    const photos = await call('GET', `/admin/clients/${regInfo.clientId}/id-photos`, undefined, admin)
    expect(photos.data.front).toBe(PIXEL)
    expect((await call('GET', `/admin/clients/${regInfo.clientId}/id-photos`, undefined, client)).status).toBe(403)
    expect((await call('POST', `/admin/loans/${req.data.id}/payments`, { amount: 24000, paidOn: '2026-01-08' }, admin)).status).toBe(201)

    const me = await call('GET', '/me', undefined, client)
    const loan = me.data.loans.find((l: { id: number }) => l.id === req.data.id)
    expect(loan.status).toBe('active')
    expect(loan.summary.total).toBe(240000)
    expect(loan.summary.paid).toBe(24000)
    expect(me.data.loans).toHaveLength(2)

    const detail = await call('GET', `/admin/loans/${req.data.id}`, undefined, admin)
    expect(detail.data.user.name).toBe('Ana López')
    expect(detail.data.loan.summary.paid).toBe(24000)
    expect((await call('GET', '/admin/requests', undefined, admin)).data).toHaveLength(0)

    const clients = await call('GET', '/admin/clients', undefined, admin)
    expect(clients.data).toHaveLength(1)
    expect(clients.data[0]).toMatchObject({ name: 'Ana López', phone: '9991234567', balance: me.data.totals.balance })
  })

  it('el cliente actualiza sus datos y su PIN', async () => {
    expect((await call('PUT', '/me', { name: 'Ana María López', address: 'Calle 60', pin: '5555' }, client)).status).toBe(200)
    expect(await login('9991234567', '5555')).toBeTruthy()
  })

  it('elimina clientes sin saldo y protege a los que deben', async () => {
    expect((await call('DELETE', `/admin/clients/${regInfo.clientId}`, undefined, admin)).status).toBe(409)
    const other = await call('POST', '/admin/clients', { name: 'Para Borrar', phone: '9997776655', pin: '1234' }, admin)
    expect((await call('DELETE', `/admin/clients/${other.data.id}`, undefined, client)).status).toBe(403)
    expect((await call('DELETE', `/admin/clients/${other.data.id}`, undefined, admin)).status).toBe(200)
    expect((await call('GET', `/admin/clients/${other.data.id}`, undefined, admin)).status).toBe(404)
  })

  it('valida montos inválidos', async () => {
    const res = await call('POST', '/me/loans', { principal: -5, weeks: 0 }, client)
    expect(res.status).toBe(400)
    expect(res.data.error).toBeTruthy()
  })
})
