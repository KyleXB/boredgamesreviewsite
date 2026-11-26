// Express route controller for reviews
const express = require('express')
const router = express.Router()
const reviewService = require('../services/reviewService')
const { authenticateToken } = require('../middlewares/authMiddleware')

router.post('/', authenticateToken, async (req, res) => {
  try {
    const review = await reviewService.saveReview({
      userId: req.user.id,
      gameId: req.body.gameId,
      rating: req.body.rating,
      content: req.body.content,
    })

    res.status(200).json({ review })
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || 'Could not save review.',
    })
  }
})

router.delete('/:gameId', authenticateToken, async (req, res) => {
  try {
    await reviewService.deleteReview({
      userId: req.user.id,
      gameId: req.params.gameId,
    })

    res.status(200).json({ message: 'Review deleted.' })
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || 'Could not delete review.',
    })
  }
})

module.exports = router