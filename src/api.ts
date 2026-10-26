import type { User } from './types.ts'

const TOKEN_KEY = 'prestamos.token'
const USER_KEY = 'prestamos.user'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function storedUser(): User | null {
  const raw = read(USER_KEY)
  return raw && read(TOKEN_KEY) ? (JSON.parse(raw) as User) : null
}

export function saveSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function updateStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = read(TOKEN_KEY)
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new ApiError(0, 'Sin conexión. Revisa tu internet.')
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token) {
    clearSession()
    window.location.assign('/')
  }
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Algo salió mal')
  return data as T
}
