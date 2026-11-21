import { Link, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import './GamePage.css'

const API_BASE_URL = 'http://localhost:3001/api'

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
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviewText, setReviewText] = useState('')

  const getRatingAtPointer = (event, star) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientX < rect.left + rect.width / 2 ? star - 0.5 : star
  }
  const displayedRating = hoveredRating || reviewRating

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

          <button type="button" className="game-page__review-button" onClick={() => setIsReviewOpen(true)}>
            {hasReviewed ? 'Edit your review' : 'Write a review'}
          </button>
      </div>


      <div className="game-page__details">
        <div className="game-page__title-row">
          <div className="game-page__heading">
            <h1 className="game-page__title">{game.title}</h1>
            {game.yearPublished != null && (
              <span className="game-page__year">({game.yearPublished})</span>
            )}
          </div>

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

        <section className="game-page__tags" aria-label="Game categories and tags">
          {[
            { label: 'Categories', category: 'genres', items: game.genres },
            { label: 'Mechanics', category: 'mechanics', items: game.mechanics },
          ]
            .filter(({ items }) => items?.length)
            .map(({ label, category, items }) => (
              <div className="game-page__tag-group" key={label}>
                <span className="game-page__tag-label">{label}</span>

                <div className="game-page__tag-list">
                  {items.map((item) => (
                    <Link
                      className="game-page__tag"
                      key={item.id}
                      to={`/search?category=${category}&q=${encodeURIComponent(item.name)}`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
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





      {isReviewOpen && (
        <div
          className="review-modal-backdrop"
          onClick={() => setIsReviewOpen(false)}
        >
          <section
            className="review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="review-modal__close"
              aria-label="Close review window"
              onClick={() => setIsReviewOpen(false)}
            >
              ×
            </button>

            <div className="review-modal__game">
              {game.image || game.thumbnail ? (
                <img
                  className="review-modal__game-image"
                  src={game.image || game.thumbnail}
                  alt={game.title}
                />
              ) : (
                <div className="review-modal__image-placeholder">No image available</div>
              )}

              <h2 id="review-modal-title">{game.title}</h2>
              <p>{game.publisher || 'Publisher not available'}</p>
            </div>

            <div className="review-modal__form">
              <div className="review-modal__rating">
                <span>Your rating</span>

                <div
                  className="review-modal__stars"
                  role="group"
                  aria-label="Choose a rating from one half to five stars"
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const fillPercent = Math.max(
                      0,
                      Math.min(1, displayedRating - star + 1)
                    ) * 100

                    return (
                      <button
                        key={star}
                        type="button"
                        className="review-modal__star"
                        aria-label={`Rate ${star - 0.5} or ${star} stars`}
                        onMouseMove={(event) =>
                          setHoveredRating(getRatingAtPointer(event, star))
                        }
                        onClick={(event) => {
                          // Keyboard activation selects the full star.
                          const value =
                            event.detail === 0 ? star : getRatingAtPointer(event, star)
                          setReviewRating(value)
                        }}
                      >
                        <span aria-hidden="true">★</span>
                        <span
                          className="review-modal__star-fill"
                          aria-hidden="true"
                          style={{ width: `${fillPercent}%` }}
                        >
                          ★
                        </span>
                      </button>
                    )
                  })}
                </div>

                <span className="review-modal__rating-value">
                  {displayedRating ? `${displayedRating.toFixed(1)} / 5` : 'Not rated'}
                </span>
              </div>
              <div className="review-modal__review">
                <textarea
                  id="review-text"
                  rows="6"
                  placeholder="Add a review..."
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                />
              </div>

              <button type="button" className="review-modal__save" onClick={() => setIsReviewOpen(false)}>
                Save
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}