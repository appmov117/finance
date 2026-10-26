import bcrypt from 'bcryptjs'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { jwtVerify, SignJWT } from 'jose'

export interface Session {
  userId: number
  role: 'admin' | 'client'
}

export type AuthEnv = { Variables: { session: Session } }

const TOKEN_DAYS = 30
const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export const hashPin = (pin: string) => bcrypt.hash(pin, 10)
export const checkPin = (pin: string, hash: string) => bcrypt.compare(pin, hash)

export function lockoutAfterFailure(failedAttempts: number): { failedAttempts: number; lockedUntil: Date | null } {
  const attempts = failedAttempts + 1
  if (attempts < MAX_ATTEMPTS) return { failedAttempts: attempts, lockedUntil: null }
  return { failedAttempts: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) }
}

export function createAuth(secretKey: string) {
  const secret = new TextEncoder().encode(secretKey)

  const sign = (session: Session) =>
    new SignJWT({ role: session.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(session.userId))
      .setExpirationTime(`${TOKEN_DAYS}d`)
      .sign(secret)

  const requireUser = createMiddleware<AuthEnv>(async (c, next) => {
    const token = c.req.header('Authorization')?.replace(/^Bearer /, '')
    if (!token) throw new HTTPException(401, { message: 'Inicia sesión' })
    try {
      const { payload } = await jwtVerify(token, secret)
      c.set('session', { userId: Number(payload.sub), role: payload.role as Session['role'] })
    } catch {
      throw new HTTPException(401, { message: 'Sesión expirada' })
    }
    await next()
  })

  const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
    if (c.get('session').role !== 'admin') throw new HTTPException(403, { message: 'Sin permiso' })
    await next()
  })

  return { sign, requireUser, requireAdmin }
}
