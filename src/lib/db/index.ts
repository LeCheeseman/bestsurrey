import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Prevent multiple connection pools in Next.js dev (hot reload creates new
// module instances, which would otherwise each open a new pool).
declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle> | undefined
}

function createDb() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // postgres-js client. max=1 for serverless/edge; increase for long-running server.
  const client = postgres(connectionString, { max: 1 })
  return drizzle(client, { schema })
}

export const db = global.__db ?? createDb()

if (process.env.NODE_ENV !== 'production') {
  global.__db = db
}
