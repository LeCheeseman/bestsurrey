import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import fs from 'fs'

async function main() {
  const migrationPath = process.argv[2] ?? 'drizzle/migrations/0003b_subcategories_update.sql'
  const migration = fs.readFileSync(migrationPath, 'utf-8')
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
  console.log(`\nMigration complete: ${migrationPath}`)
  process.exit(0)
}

main()
