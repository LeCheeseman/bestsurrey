import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { adminToolsDisabledResponse, adminToolsEnabled } from '@/lib/admin-tools'
import { db } from '@/lib/db'
import { categories, subcategories, towns } from '@/lib/db/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  if (!adminToolsEnabled()) return adminToolsDisabledResponse()

  const [townRows, categoryRows, subcategoryRows] = await Promise.all([
    db.select({ id: towns.id, name: towns.name, slug: towns.slug }).from(towns).orderBy(asc(towns.name)),
    db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select({
        id: subcategories.id,
        name: subcategories.name,
        slug: subcategories.slug,
        categoryId: subcategories.categoryId,
      })
      .from(subcategories)
      .orderBy(asc(subcategories.sortOrder), asc(subcategories.name)),
  ])

  return NextResponse.json({
    towns: townRows,
    categories: categoryRows,
    subcategories: subcategoryRows,
  })
}
