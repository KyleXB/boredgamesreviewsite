// IReviewService - Application logic for reviews, ratings, and comments
const reviewRepository = require('../repositories/reviewRepository')

const reviewService = {
  async saveReview({ userId, gameId, rating, content }) {
    if (typeof gameId !== 'string' || !gameId.trim()) {
      const error = new Error('Game ID is required.')
      error.status = 400
      throw error
    }

    const numericRating = Number(rating)

    if (
      !Number.isFinite(numericRating) ||
      numericRating < 0.5 ||
      numericRating > 5 ||
      !Number.isInteger(numericRating * 2)
    ) {
      const error = new Error('Rating must be from 0.5 to 5 in half-star steps.')
      error.status = 400
      throw error
    }

    if (content != null && typeof content !== 'string') {
      const error = new Error('Review text must be a string.')
      error.status = 400
      throw error
    }

    const normalizedGameId = gameId.trim()

    if (!(await reviewRepository.gameExists(normalizedGameId))) {
      const error = new Error('Game not found.')
      error.status = 404
      throw error
    }

    return reviewRepository.upsertForUserAndGame({
      userId,
      gameId: normalizedGameId,
      rating: numericRating,
      content: content?.trim() || null,
    })
  },
}

module.exports = reviewService