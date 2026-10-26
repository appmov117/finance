import { sql } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { BOOTSTRAP_SQL } from './schema.ts'

export type DB = PgDatabase<PgQueryResultHKT>

/** Acepta también URLs con driver explícito, como postgresql+psycopg://. */
export function connect(databaseUrl: string): DB {
  const url = databaseUrl.replace(/^postgres(ql)?\+\w+:/, 'postgresql:')
  const client = postgres(url, { ssl: 'require', max: 5, prepare: false, onnotice: () => {} })
  return drizzle(client)
}

export async function bootstrap(db: DB): Promise<void> {
  for (const statement of BOOTSTRAP_SQL.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.execute(sql.raw(statement))
  }
}
