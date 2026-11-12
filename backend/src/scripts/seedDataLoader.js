// Seed data loader - Node script to load sample game data into the database
const prisma = require('../prismaClient')

async function main() {
  // Seed initial board games and data
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

