import { existsSync } from 'node:fs'
import { z } from 'zod'

if (existsSync('.env')) process.loadEnvFile('.env')

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  SECRET_KEY: z.string().min(32, 'SECRET_KEY debe tener al menos 32 caracteres'),
  ADMIN_PHONE: z.string().regex(/^\d{10}$/, 'ADMIN_PHONE debe tener 10 dígitos'),
  ADMIN_PIN: z.string().regex(/^\d{4,6}$/, 'ADMIN_PIN debe tener de 4 a 6 dígitos'),
  ADMIN_NAME: z.string().default('Administradora'),
  TIMEZONE: z.string().default('America/Mexico_City'),
  CONTRACT_CITY: z.string().default(''),
  CONTACT_EMAIL: z.union([z.email('CONTACT_EMAIL debe ser un correo válido'), z.literal('')]).default(''),
  PORT: z.coerce.number().default(3000),
})

export const env = schema.parse(process.env)
