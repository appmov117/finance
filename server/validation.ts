import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

const digits = (value: string) => value.replace(/\D/g, '')

export const phone = z.string().transform(digits).pipe(z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'))
export const pin = z.string().regex(/^\d{4,6}$/, 'El PIN debe tener de 4 a 6 dígitos')
const name = z.string().trim().min(2, 'Escribe el nombre completo').max(120)
const address = z.string().trim().max(250).default('')
const cents = z.number().int().positive().max(100_000_000)
const isoDate = z.iso.date()

export const clientBody = z.object({ name, phone, pin, address })
export const registerBody = clientBody.extend({
  acceptTerms: z.literal(true, 'Debes aceptar el aviso de privacidad y los términos'),
})
export const loginBody = z.object({ phone, pin })
export const profileBody = z.object({ name, address, pin: pin.optional() })

export const loanRequestBody = z.object({
  principal: cents,
  weeks: z.number().int().min(1).max(104),
  note: z.string().trim().max(500).default(''),
})

export const loanTermsBody = z.object({
  principal: cents,
  rateBp: z.number().int().min(0).max(50_000),
  weeks: z.number().int().min(1).max(104),
  lateFee: z.number().int().min(0).max(10_000_000),
  startDate: isoDate,
  note: z.string().trim().max(500).optional(),
})

export const newLoanBody = loanTermsBody.extend({ clientId: z.number().int().positive() })
export const paymentBody = z.object({ amount: cents, paidOn: isoDate })

const dataUrl = (types: string, maxChars: number) =>
  z.string().max(maxChars, 'La imagen es demasiado grande').regex(new RegExp(`^data:image/(${types});base64,[A-Za-z0-9+/=]+$`), 'Imagen inválida')

export const idPhotoBody = z.object({ data: dataUrl('jpeg|png|webp', 3_000_000) })
export const signBody = z.object({ signature: dataUrl('png', 400_000), text: z.string().min(1).max(20_000) })

export async function parseBody<T extends z.ZodType>(req: { json: () => Promise<unknown> }, schema: T): Promise<z.output<T>> {
  const result = schema.safeParse(await req.json().catch(() => null))
  if (!result.success) {
    throw new HTTPException(400, { message: result.error.issues[0]?.message ?? 'Datos inválidos' })
  }
  return result.data
}

export function idParam(value: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new HTTPException(404, { message: 'No encontrado' })
  return id
}
