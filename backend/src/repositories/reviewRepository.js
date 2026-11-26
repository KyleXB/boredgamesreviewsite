// IReviewRepository - Data access for ratings and reviews
const prisma = require('../prismaClient')

const reviewRepository = {
  async gameExists(gameId) {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    })

    return Boolean(game)
  },

  async upsertForUserAndGame({ userId, gameId, rating, content }) {
    return prisma.review.upsert({
      where: {
        userId_gameId: { userId, gameId },
      },
      create: {
        rating,
        content,
        user: { connect: { id: userId } },
        game: { connect: { id: gameId } },
      },
      update: { rating, content },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    })
  },

  async deleteForUserAndGame({ userId, gameId }) {
    const result = await prisma.review.deleteMany({
      where: { userId, gameId },
    })

    return result.count > 0
  },
}

module.exports = reviewRepository