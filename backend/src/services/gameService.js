// IGameService - Application logic for games, search, and category counts
const gameRepository = require('../repositories/gameRepository')

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
