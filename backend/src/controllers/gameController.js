// Express route controller for games
const express = require('express')
const router = express.Router()
const gameService = require('../services/gameService')

// GET /api/games/categories - Category counts for landing page
router.get('/categories', async (req, res) => {
  try {
    const summary = await gameService.getCategoriesSummary()
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/games/search?q=... - Search games
router.get('/search', async (req, res) => {
  try {
    const results = await gameService.searchGames(req.query.q)
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/games - List all games
router.get('/', async (req, res) => {
  try {
    const games = await gameService.getAllGames()
    res.json(games)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/games/:id - Specific game details
router.get('/:id', async (req, res) => {
  try {
    const game = await gameService.getGameById(req.params.id)
    res.json(game)
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

module.exports = router
