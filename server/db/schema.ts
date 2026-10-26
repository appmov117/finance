import { date, integer, pgSchema, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core'

/** Esquema propio para no mezclar tablas con otros proyectos de la misma base. */
export const prestamos = pgSchema('prestamos')

export const users = prestamos.table('users', {
  id: serial('id').primaryKey(),
  role: text('role').$type<'admin' | 'client'>().notNull().default('client'),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  address: text('address').notNull().default(''),
  pinHash: text('pin_hash').notNull(),
  failedAttempts: integer('failed_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  acceptedTermsAt: timestamp('accepted_terms_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const loans = prestamos.table('loans', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').notNull().references(() => users.id),
  status: text('status').$type<'requested' | 'to_sign' | 'active' | 'rejected'>().notNull().default('requested'),
  principal: integer('principal_cents').notNull(),
  rateBp: integer('rate_bp').notNull().default(0),
  weeks: integer('weeks').notNull(),
  lateFee: integer('late_fee_cents').notNull().default(0),
  startDate: date('start_date', { mode: 'string' }),
  note: text('note').notNull().default(''),
  contractText: text('contract_text'),
  contractHash: text('contract_hash'),
  signature: text('signature'),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  signMeta: text('sign_meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const payments = prestamos.table('payments', {
  id: serial('id').primaryKey(),
  loanId: integer('loan_id')
    .notNull()
    .references(() => loans.id, { onDelete: 'cascade' }),
  amount: integer('amount_cents').notNull(),
  paidOn: date('paid_on', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/** Fotos de la credencial como data URL; solo se exponen por rutas autenticadas. */
export const idPhotos = prestamos.table(
  'id_photos',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    side: text('side').$type<'front' | 'back'>().notNull(),
    data: text('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.side] })],
)

export const BOOTSTRAP_SQL = `
CREATE SCHEMA IF NOT EXISTS prestamos;
CREATE TABLE IF NOT EXISTS prestamos.users (
  id serial PRIMARY KEY,
  role text NOT NULL DEFAULT 'client',
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  address text NOT NULL DEFAULT '',
  pin_hash text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prestamos.loans (
  id serial PRIMARY KEY,
  client_id integer NOT NULL REFERENCES prestamos.users(id),
  status text NOT NULL DEFAULT 'requested',
  principal_cents integer NOT NULL,
  rate_bp integer NOT NULL DEFAULT 0,
  weeks integer NOT NULL,
  late_fee_cents integer NOT NULL DEFAULT 0,
  start_date date,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loans_client_idx ON prestamos.loans(client_id);
CREATE TABLE IF NOT EXISTS prestamos.payments (
  id serial PRIMARY KEY,
  loan_id integer NOT NULL REFERENCES prestamos.loans(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  paid_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_loan_idx ON prestamos.payments(loan_id);
ALTER TABLE prestamos.users ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;
ALTER TABLE prestamos.loans ADD COLUMN IF NOT EXISTS contract_text text;
ALTER TABLE prestamos.loans ADD COLUMN IF NOT EXISTS contract_hash text;
ALTER TABLE prestamos.loans ADD COLUMN IF NOT EXISTS signature text;
ALTER TABLE prestamos.loans ADD COLUMN IF NOT EXISTS signed_at timestamptz;
ALTER TABLE prestamos.loans ADD COLUMN IF NOT EXISTS sign_meta text;
CREATE TABLE IF NOT EXISTS prestamos.id_photos (
  user_id integer NOT NULL REFERENCES prestamos.users(id) ON DELETE CASCADE,
  side text NOT NULL,
  data text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, side)
);
`
