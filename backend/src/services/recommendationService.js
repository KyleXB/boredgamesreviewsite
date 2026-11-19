// IRecommendationService - Application logic for game recommendations
const gameRepository = require('../repositories/gameRepository')
const accountRepository = require('../repositories/accountRepository')

function decodeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

const recommendationService = {
  // Recommendation algorithms based on user and game data
  // For now: returns randomized selection of seeded games
  async getRecommendationsForUser(userId = null, limit = 12) {
    const games = await gameRepository.getRandomGames(limit)
    return games.map(g => ({
      id: g.id,
      title: decodeHtml(g.title),
      year: g.yearPublished ? String(g.yearPublished) : '',
      image: g.image || g.thumbnail
    }))
  }
}

module.exports = recommendationService

