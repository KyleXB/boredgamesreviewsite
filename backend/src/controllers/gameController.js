// Express route controller for games
const express = require('express')
const router = express.Router()
const gameService = require('../services/gameService')

// GET /api/games/popular - Popular games for homepage sidebar
router.get('/popular', async (req, res) => {
  try {
    const popular = await gameService.getPopularGames(10)
    res.json(popular)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

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

// GET /api/games - List games, one page at a time
// Query: ?skip=0&take=100  (also accepts ?offset=&limit= or ?page=&limit=)
// Without paging params it still returns the first 50, as before.
// The SearchPage keeps requesting the next page until one comes back empty.
const DEFAULT_TAKE = 50
const MAX_TAKE = 100

const toNonNegativeInt = (value) => {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

router.get('/', async (req, res) => {
  try {
    const requestedTake = toNonNegativeInt(req.query.take) ?? toNonNegativeInt(req.query.limit)
    const take = Math.min(MAX_TAKE, requestedTake || DEFAULT_TAKE)

    const page = toNonNegativeInt(req.query.page)
    const skip =
      toNonNegativeInt(req.query.skip) ??
      toNonNegativeInt(req.query.offset) ??
      (page ? (page - 1) * take : 0)

    const games = await gameService.getAllGames({
      skip,
      take,
      // id as a tie-breaker: many seeded games share the same createdAt, and without
      // a unique sort order games could repeat or be skipped between pages
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }]
    })
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
