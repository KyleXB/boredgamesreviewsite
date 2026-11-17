require('dotenv').config()
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')

// Resolve absolute path to SQLite database file
const dbPath = path.resolve(__dirname, '../dev.db')

// PrismaBetterSqlite3 in Prisma v7 accepts a config object with url
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` })

const prisma = new PrismaClient({ adapter })

module.exports = prisma
