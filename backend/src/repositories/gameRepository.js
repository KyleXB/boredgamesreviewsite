// IGameRepository - Data access for board games, genres, mechanics, and themes
const prisma = require('../prismaClient')

const gameRepository = {
  // Find all games with optional pagination and filters
  async findAll({ skip = 0, take = 50, orderBy = { createdAt: 'desc' } } = {}) {
    return await prisma.game.findMany({
      skip,
      take,
      orderBy,
      include: {
        genres: true,
        mechanics: true,
        themes: true,
        _count: {
          select: { reviews: true }
        }
      }
    })
  },

  // Find single game by internal ID or BGG ID
  async findById(id) {
    return await prisma.game.findUnique({
      where: { id },
      include: {
        genres: true,
        mechanics: true,
        themes: true,
        expansions: true,
        baseGame: true,
        reviews: {
          include: {
            user: {
              select: { id: true, username: true, role: true }
            },
            comments: true
          }
        }
      }
    })
  },

  async findByBggId(bggId) {
    return await prisma.game.findUnique({
      where: { bggId },
      include: {
        genres: true,
        mechanics: true,
        themes: true
      }
    })
  },

  // Search games by title or publisher
  async search(query) {
    return await prisma.game.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { publisher: { contains: query } }
        ]
      },
      include: {
        genres: true,
        mechanics: true
      },
      take: 20
    })
  },

  // Category counts for landing page
  async getGenresWithCount() {
    return await prisma.genre.findMany({
      select: {
        name: true,
        _count: { select: { games: true } }
      },
      orderBy: { name: 'asc' }
    })
  },

  async getMechanicsWithCount() {
    return await prisma.mechanic.findMany({
      select: {
        name: true,
        _count: { select: { games: true } }
      },
      orderBy: { name: 'asc' }
    })
  },

  async getThemesWithCount() {
    return await prisma.theme.findMany({
      select: {
        name: true,
        _count: { select: { games: true } }
      },
      orderBy: { name: 'asc' }
    })
  },

  // Upsert game from BGG or manual addition (FR-02)
  async upsertGame(gameData) {
    const { genres = [], mechanics = [], themes = [], ...rest } = gameData

    return await prisma.game.upsert({
      where: { bggId: rest.bggId },
      update: {
        ...rest,
        genres: {
          connectOrCreate: genres.map(name => ({
            where: { name },
            create: { name }
          }))
        },
        mechanics: {
          connectOrCreate: mechanics.map(name => ({
            where: { name },
            create: { name }
          }))
        },
        themes: {
          connectOrCreate: themes.map(name => ({
            where: { name },
            create: { name }
          }))
        }
      },
      create: {
        ...rest,
        genres: {
          connectOrCreate: genres.map(name => ({
            where: { name },
            create: { name }
          }))
        },
        mechanics: {
          connectOrCreate: mechanics.map(name => ({
            where: { name },
            create: { name }
          }))
        },
        themes: {
          connectOrCreate: themes.map(name => ({
            where: { name },
            create: { name }
          }))
        }
      }
    })
  }
}

module.exports = gameRepository
