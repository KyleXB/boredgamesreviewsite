import { Link, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './GamePage.css'

const API_BASE_URL = 'http://localhost:3001/api'

const REVIEWS_PER_PAGE = 5

function formatRange(min, max, unit) {
  if (min == null && max == null) return 'Not available'
  if (min == null) return `Up to ${max} ${unit}`
  if (max == null) return `${min}+ ${unit}`
  if (min === max) return `${min} ${unit}`
  return `${min}–${max} ${unit}`
}

function RatingStars({ rating, className = '' }) {
  const value = Number(rating) || 0
  return (
    <span className={`rating-stars ${className}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, value - star + 1)) * 100

        return (
          <span className="rating-stars__star" key={star}>
            <span className="rating-stars__empty">★</span>
            <span
              className="rating-stars__fill"
              style={{ width: `${fill}%` }}
            >
              ★
            </span>
          </span>
        )
      })}
    </span>
  )
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
  const { user, token } = useAuth()
  const [isSavingReview, setIsSavingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSort, setReviewSort] = useState('date')
  const [currentReviewPage, setCurrentReviewPage] = useState(1)
  const [isDeletingReview, setIsDeletingReview] = useState(false)
  const currentReview = game?.reviews?.find(
    (review) => review.userId === user?.id
  )
  const hasReviewed = Boolean(currentReview)
  const reviews = game?.reviews ?? []
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : null
  const userRating = currentReview?.rating ?? 0

  const getRatingAtPointer = (event, star) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientX < rect.left + rect.width / 2 ? star - 0.5 : star
  }
  const displayedRating = hoveredRating || reviewRating

  const writtenReviews = reviews.filter((review) => review.content?.trim())

  const sortedWrittenReviews = [...writtenReviews].sort((a, b) => {
    if (reviewSort === 'score') {
      return (
        Number(b.rating) - Number(a.rating) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    // Default: newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const reviewPageCount = Math.ceil(
    sortedWrittenReviews.length / REVIEWS_PER_PAGE
  )
  const currentPage = Math.min(currentReviewPage, reviewPageCount || 1)
  const paginatedReviews = sortedWrittenReviews.slice(
    (currentPage - 1) * REVIEWS_PER_PAGE,
    currentPage * REVIEWS_PER_PAGE
  )


  useEffect(() => {
    const controller = new AbortController()

    async function loadGame() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(
          `${API_BASE_URL}/games/${encodeURIComponent(gameId)}`,
          { signal: controller.signal }
        )
        if (!response.ok) {
          throw new Error(
            response.status === 404 ? 'Game not found.' : 'Could not load game.'
          )
        }
        setGame(await response.json())
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadGame()
    return () => controller.abort()
  }, [gameId])

  if (loading) return <main className="game-page">Loading game…</main>
  if (error) return <main className="game-page">{error}</main>
  if (!game) return null

  function openReviewModal() {
    setReviewRating(currentReview?.rating ?? 0)
    setReviewText(currentReview?.content ?? '')
    setHoveredRating(0)
    setReviewError('')
    setIsReviewOpen(true)
  }

  async function handleSaveReview() {
    if (!token || !user) {
      setReviewError('Please log in to save a review.')
      return
    }

    if (!reviewRating) {
      setReviewError('Please choose a star rating.')
      return
    }

    setIsSavingReview(true)
    setReviewError('')

    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameId,
          rating: reviewRating,
          content: reviewText,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Could not save your review.')
      }

      setGame((currentGame) => ({
        ...currentGame,
        reviews: [
          ...(currentGame.reviews || []).filter(
            (review) => review.userId !== user.id
          ),
          data.review,
        ],
      }))

      setIsReviewOpen(false)
    } catch (error) {
      setReviewError(error.message)
    } finally {
      setIsSavingReview(false)
    }
  }

  async function handleDeleteReview() {
    if (!token || !user || !hasReviewed) return

    if (!window.confirm('Delete your review for this game?')) return

    setIsDeletingReview(true)
    setReviewError('')

    try {
      const response = await fetch(
        `${API_BASE_URL}/reviews/${encodeURIComponent(gameId)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Could not delete your review.')
      }

      setGame((currentGame) => ({
        ...currentGame,
        reviews: (currentGame.reviews || []).filter(
          (review) => review.userId !== user.id
        ),
      }))

      setReviewRating(0)
      setReviewText('')
      setIsReviewOpen(false)
    } catch (error) {
      setReviewError(error.message)
    } finally {
      setIsDeletingReview(false)
    }
  }

  return (
    <main className="game-page">

      <div className="game-page__top-layout">
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
                <div
                  className="game-stars"
                  aria-label={
                    userRating
                      ? `Your rating: ${userRating} out of 5`
                      : 'Your rating: not rated'
                  }
                >
                  <RatingStars rating={userRating} />
                  <strong>{userRating ? `${userRating.toFixed(1)}/5` : '—/5'}</strong>
                </div>
              </div>
            </div>

            <button type="button" className="game-page__review-button" onClick={openReviewModal}>
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
                <RatingStars
                  rating={averageRating ?? 0}
                  className="game-page__global-stars"
                />
                <div className="game-page__global-rating-score">
                  <strong>
                    {averageRating == null ? '—' : averageRating.toFixed(1)}
                    <small>/5</small>
                  </strong>
                  <span className="game-page__global-rating-count">
                    {reviews.length} {reviews.length === 1 ? 'rating' : 'ratings'}
                  </span>
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
                    {expansion.image || expansion.thumbnail ? (
                      <img
                        className="game-page__expansion-image"
                        src={expansion.image || expansion.thumbnail}
                        alt={expansion.title}
                      />
                    ) : (
                      <span className="game-page__expansion-image game-page__expansion-image--placeholder">
                        No image
                      </span>
                    )}

                    <span className="game-page__expansion-title">{expansion.title}</span>
                  </Link>
                ))
              ) : (
                <p>No expansions listed.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <section className="game-page__reviews" aria-labelledby="game-reviews-title">
        <div className="game-page__reviews-heading">
          <h2 id="game-reviews-title">Reviews ({writtenReviews.length})</h2>

          <label className="game-page__review-sort">
            Sort by
            <select
              value={reviewSort}
              onChange={(event) => {
                setReviewSort(event.target.value) 
                setCurrentReviewPage(1)
              }}
            >
              <option value="date">Date</option>
              <option value="score">Score</option>
            </select>
          </label>
        </div>

        {sortedWrittenReviews.length > 0 ? (
          <>
            <div className="game-page__review-list">
              {paginatedReviews.map((review) => (
                <article className="game-page__review" key={review.id}>
                  <header className="game-page__review-header">
                    <div className="game-page__review-author">
                      <strong>{review.user?.username || 'User'}</strong>

                      <div className="game-page__review-rating">
                        <RatingStars rating={review.rating} />
                        <span>{Number(review.rating).toFixed(1)}/5</span>
                      </div>
                    </div>

                    <time dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </time>
                  </header>

                  <p>{review.content}</p>
                </article>
              ))}
            </div> 
            {reviewPageCount > 1 && (
              <nav className="game-page__review-pagination" aria-label="Review pages">
                <button
                  type="button"
                  className="game-page__review-page"
                  onClick={() => setCurrentReviewPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {Array.from({ length: reviewPageCount }, (_, index) => index + 1).map(
                  (page) => (
                    <button
                      key={page}
                      type="button"
                      className="game-page__review-page"
                      aria-current={currentPage === page ? 'page' : undefined}
                      onClick={() => setCurrentReviewPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="game-page__review-page"
                  onClick={() => setCurrentReviewPage(currentPage + 1)}
                  disabled={currentPage === reviewPageCount}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : (
          <p className="game-page__no-reviews">No written reviews yet.</p>
        )}
      </section>
      





      {isReviewOpen && (
        <div
          className="review-modal-backdrop"
        >
          <section
            className="review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
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

              {reviewError && <p role="alert">{reviewError}</p>}
              <div className="review-modal__actions">
                {hasReviewed && (
                  <button
                    type="button"
                    className="review-modal__delete"
                    onClick={handleDeleteReview}
                    disabled={isSavingReview || isDeletingReview}
                  >
                    {isDeletingReview ? 'Deleting…' : 'Delete review'}
                  </button>
                )}

                <button
                  type="button"
                  className="review-modal__save"
                  onClick={handleSaveReview}
                  disabled={isSavingReview || isDeletingReview}
                >
                  {isSavingReview ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}