import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'

async function main() {
  const migration = fs.readFileSync('drizzle/migrations/0003b_subcategories_update.sql', 'utf-8')
  const statements = migration
    .split('\n')
    .filter(l => !l.trim().startsWith('--') && l.trim())
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    try {
      await db.execute(sql.raw(stmt))
      console.log('✓', stmt.slice(0, 80).replace(/\n/g, ' '))
    } catch (e: any) {
      console.error('✗', stmt.slice(0, 80).replace(/\n/g, ' '), '->', e.message)
    }
  }
  console.log('\nMigration complete.')
  process.exit(0)
}

main()
