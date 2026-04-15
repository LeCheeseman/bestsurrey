/**
 * Import CLI entry point.
 *
 * Usage:
 *   npm run import:csv -- --file path/to/listings.csv
 *   npm run import:csv -- --file path/to/listings.csv --dry-run
 *
 * --source csv     (default, only option currently)
 * --file  <path>   path to the input file
 * --dry-run        validate and report without writing to the database
 *
 * Exit codes:
 *   0 = success (or dry-run complete)
 *   1 = validation errors or import errors
 */

import { readCsv }         from './sources/csv'
import { validateRecords } from './validate'
import { upsertListings }  from './upsert'

const args   = process.argv.slice(2)
const getArg = (flag: string) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : undefined }

const filePath = getArg('--file')
const source   = getArg('--source') ?? 'csv'
const dryRun   = args.includes('--dry-run')

if (!filePath) {
  console.error('Usage: npm run import:csv -- --file <path> [--dry-run]')
  process.exit(1)
}

async function main() {
  console.log(`\nBestSurrey import`)
  console.log(`  source:  ${source}`)
  console.log(`  file:    ${filePath}`)
  console.log(`  dry-run: ${dryRun}\n`)

  // ── Load ──────────────────────────────────────────────────────────────────
  let records
  if (source === 'csv') {
    try {
      records = readCsv(filePath!)
    } catch (err) {
      console.error(`Failed to read CSV: ${err instanceof Error ? err.message : err}`)
      process.exit(1)
    }
  } else {
    console.error(`Unknown --source: "${source}". Supported values: csv`)
    process.exit(1)
  }

  console.log(`Loaded ${records.length} record(s).`)

  if (records.length === 0) {
    console.log('Nothing to import.')
    process.exit(0)
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  const errors = validateRecords(records)

  if (errors.length > 0) {
    console.error(`\nValidation failed — ${errors.length} error(s):\n`)
    for (const e of errors) {
      console.error(`  [${e.slug}]  ${e.field}: ${e.message}`)
    }
    console.error('\nFix errors and re-run. No data written.')
    process.exit(1)
  }

  console.log('Validation passed.\n')

  // ── Upsert ────────────────────────────────────────────────────────────────
  const report = await upsertListings(records, { dryRun })

  // ── Report ────────────────────────────────────────────────────────────────
  console.log('Results:')
  console.log(`  Inserted: ${report.inserted}`)
  console.log(`  Updated:  ${report.updated}`)
  console.log(`  Skipped:  ${report.skipped}`)
  console.log(`  Errors:   ${report.errors}`)
  console.log(`  Total:    ${report.total}`)

  if (report.errors > 0) {
    console.error('\nImport errors:')
    report.results
      .filter((r) => r.action === 'error')
      .forEach((r) => console.error(`  [${r.slug}]  ${r.message}`))
  }

  console.log(dryRun ? '\nDry run complete — no data written.' : '\nDone.')
  process.exit(report.errors > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
