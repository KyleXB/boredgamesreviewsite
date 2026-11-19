// Express route controller for recommendations
const express = require('express')
const router = express.Router()
const recommendationService = require('../services/recommendationService')
const { optionalAuth } = require('../middlewares/authMiddleware')

// GET /api/recommendations - Get personalized or discovery recommendations
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null
    const recommendations = await recommendationService.getRecommendationsForUser(userId, 12)
    res.json(recommendations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router

