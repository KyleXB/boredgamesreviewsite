/**
 * initDb.js
 *
 * Copies the pre-seeded SQLite database (seed.db) to dev.db if dev.db doesn't exist,
 * or allows resetting dev.db with a fresh copy of the catalog.
 *
 * Usage:
 *   npm run db:init       (only creates dev.db if missing)
 *   npm run db:reset      (forces reset of dev.db with clean seed.db)
 */

const fs = require('fs')
const path = require('path')

const seedPath = path.resolve(__dirname, '../../seed.db')
const devPath = path.resolve(__dirname, '../../dev.db')

const force = process.argv.includes('--force')

if (!fs.existsSync(seedPath)) {
  console.error('❌ Error: backend/seed.db was not found.')
  process.exit(1)
}

if (fs.existsSync(devPath) && !force) {
  console.log('ℹ️  backend/dev.db already exists. Skipping initialization.')
  console.log('   (To overwrite with a clean database snapshot, run: npm run db:reset)')
  process.exit(0)
}

try {
  fs.copyFileSync(seedPath, devPath)
  console.log('✅ Successfully initialized backend/dev.db from clean seed snapshot!')
  console.log('   All 2,500 games, categories, mechanics, and themes are ready to use.')
} catch (err) {
  console.error('❌ Failed to copy seed.db:', err.message)
  process.exit(1)
}
