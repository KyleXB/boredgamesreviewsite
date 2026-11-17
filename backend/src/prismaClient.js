require('dotenv').config()
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3')
const Database = require('better-sqlite3')

// Resolve path to SQLite database file
const dbPath = path.resolve(__dirname, '../../dev.db')
const sqlite = new Database(dbPath)
const adapter = new PrismaBetterSqlite3(sqlite)

const prisma = new PrismaClient({ adapter })

module.exports = prisma
