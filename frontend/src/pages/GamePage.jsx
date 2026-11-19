import { Link, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import './GamePage.css'

const API_BASE_URL = 'http://localhost:3001/api'

const images = [
  '/placeholder3.jpg',
  '/placeholder2.jpg',
  '/placeholder.jpg',
]

const hasReviewed = false // placeholder until review data exists

function formatRange(min, max, unit) {
  if (min == null && max == null) return 'Not available'
  if (min == null) return `Up to ${max} ${unit}`
  if (max == null) return `${min}+ ${unit}`
  if (min === max) return `${min} ${unit}`
  return `${min}–${max} ${unit}`
}

export default function GamePage() {
  const { gameId } = useParams()
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadGame() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `${API_BASE_URL}/games/${encodeURIComponent(gameId)}`
        )

        if (!response.ok) {
          throw new Error(
            response.status === 404 ? 'Game not found.' : 'Could not load game.'
          )
        }

        setGame(await response.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadGame()
  }, [gameId])
  const [imageIndex, setImageIndex] = useState(0)

  const showPrevious = () => {
    setImageIndex((current) => (current - 1 + images.length) % images.length)
  }

  const showNext = () => {
    setImageIndex((current) => (current + 1) % images.length)
  }

  if (loading) return <main className="game-page">Loading game…</main>
  if (error) return <main className="game-page">{error}</main>
  if (!game) return null

  return (
    <main className="game-page">

      <div className='game-page__media'>
        <div className="game-gallery">
          <div className="game-image">
            {game.image || game.thumbnail ? (
              <img
                className="game-image__card"
                src={game.image || game.thumbnail}
                alt={game.title}
              />
            ) : (
              <div className="game-image__card game-image__placeholder">
                No image available
              </div>
            )}
          </div>
        </div>

          <div className="game-ratings">

            <div>
              <span>Your rating</span>
              <div className="game-stars" aria-label="Your rating: not rated">
                <span aria-hidden="true">☆☆☆☆☆</span>
                <strong>—/5</strong>
              </div>
            </div>
          </div>

          <button type="button" className="game-page__review-button">
            {hasReviewed ? 'Edit your review' : 'Write a review'}
          </button>
      </div>


      <div className="game-page__details">
        <div className="game-page__title-row">
          <h1 className="game-page__title">{game.title}</h1>
            {game.yearPublished != null && (
              <span className="game-page__year">({game.yearPublished})</span>
            )}

          <div className="game-page__global-rating">
            <span className="game-page__global-label">Global rating</span>

            <div className="game-page__global-rating-main">
              <span className="game-page__global-stars" aria-hidden="true">★★★★☆</span>

              <div className="game-page__global-rating-score">
                <strong>4.3<small>/5</small></strong>
                <span className="game-page__global-rating-count">1,234 ratings</span>
              </div>
            </div>
          </div>
        </div>

        <div className="game-page__facts">
          <div className="game-page__fact">
            <span>Players</span>
            <strong>{formatRange(game.minPlayers, game.maxPlayers, 'players')}</strong>
          </div>

          <div className="game-page__fact">
            <span>Play time</span>
            <strong>{formatRange(game.minPlaytime, game.maxPlaytime, 'min')}</strong>
          </div>

          <div className="game-page__fact">
            <span>Age</span>
            <strong>{game.minAge == null ? 'Not available' : `${game.minAge}+`}</strong>
          </div>

          <div className="game-page__fact">
            <span>Publisher</span>
            <strong>{game.publisher || 'Not available'}</strong>
          </div>
        </div>

        <section className="game-page__about">
          <h2>About this game</h2>
          <p>
            {game.description || 'No description available.'}
          </p>
        </section>

        <section className="game-page__expansions">
          <h2>Expansions</h2>

          <div className="game-page__expansion-list">
            {game.expansions?.length ? (
              game.expansions.map((expansion) => (
                <Link
                  key={expansion.id}
                  to={`/game/${expansion.id}`}
                  className="game-page__expansion-card"
                >
                  {expansion.title}
                </Link>
              ))
            ) : (
              <p>No expansions listed.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}