// IGameService - Application logic for games, search, and category counts
const gameRepository = require('../repositories/gameRepository')

function decodeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

const gameService = {
  // Get all games with pagination
  async getAllGames(options) {
    return await gameRepository.findAll(options)
  },

  // Get specific game details by ID (FR-02)
  async getGameById(id) {
    const game = await gameRepository.findById(id)
    if (!game) {
      const error = new Error('Game not found')
      error.status = 404
      throw error
    }
    return game
  },

  // Search games by keyword
  async searchGames(query) {
    if (!query || typeof query !== 'string') return []
    return await gameRepository.search(query.trim())
  },

  // Get games for Popular This Week
  async getPopularGames(limit = 10) {
    const games = await gameRepository.getPopularGames(limit)
    return games.map((game, index) => {
      // Pick up to 2 tags from genres, fallback to mechanics if needed
      const tags = []
      if (game.genres && game.genres.length > 0) {
        tags.push(...game.genres.map(g => g.name))
      }
      if (tags.length < 2 && game.mechanics && game.mechanics.length > 0) {
        for (const m of game.mechanics) {
          if (tags.length >= 2) break
          if (!tags.includes(m.name)) tags.push(m.name)
        }
      }

      // Calculate rating: if game has reviews, compute real avg; otherwise deterministic score between 4.1 and 4.9
      let rating = '4.5'
      if (game.reviews && game.reviews.length > 0) {
        const sum = game.reviews.reduce((acc, r) => acc + r.rating, 0)
        rating = (sum / game.reviews.length).toFixed(1)
      } else {
        // Deterministic pseudo-rating based on game title/id
        const hash = (game.title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const pseudo = 4.0 + ((hash % 10) / 10)
        rating = Math.min(5.0, pseudo).toFixed(1)
      }

      return {
        id: game.id,
        title: decodeHtml(game.title),
        image: game.image || game.thumbnail,
        thumbnail: game.thumbnail,
        yearPublished: game.yearPublished,
        tags: tags.slice(0, 2),
        rating
      }
    })
  },

  // Category counts breakdown for the landing page (Genres, Mechanics, Themes)
  async getCategoriesSummary() {
    const [genres, mechanics, themes] = await Promise.all([
      gameRepository.getGenresWithCount(),
      gameRepository.getMechanicsWithCount(),
      gameRepository.getThemesWithCount()
    ])

    return {
      genres: genres.map(g => ({ name: g.name, count: g._count.games })),
      mechanics: mechanics.map(m => ({ name: m.name, count: m._count.games })),
      themes: themes.map(t => ({ name: t.name, count: t._count.games }))
    }
  }
}

module.exports = gameService
