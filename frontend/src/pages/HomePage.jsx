import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import './HomePage.css'

const API_BASE_URL = 'http://localhost:3001/api'

// Sort Icon Component matching the user's reference mockup
// Shows bars with directional arrow: Down arrow for A-Z, Up arrow for Z-A
function SortOrderIcon({ direction }) {
  return (
    <svg 
      className="sort-icon-svg" 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="5" x2="14" y2="5" />
      <line x1="3" y1="10" x2="11" y2="10" />
      <line x1="3" y1="15" x2="8" y2="15" />
      <line x1="3" y1="20" x2="5" y2="20" />

      {direction === 'asc' ? (
        <>
          <line x1="19" y1="5" x2="19" y2="19" />
          <polyline points="15 15 19 19 23 15" />
        </>
      ) : (
        <>
          <line x1="19" y1="19" x2="19" y2="5" />
          <polyline points="15 9 19 5 23 9" />
        </>
      )}
    </svg>
  )
}

// 5-Star Rating Component for Popular list
function StarRating({ rating }) {
  const numRating = parseFloat(rating) || 0
  return (
    <div className="star-row" title={`Rated ${numRating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const fillPercent = Math.max(0, Math.min(100, (numRating - (starIndex - 1)) * 100))
        return (
          <span key={starIndex} className="star-wrapper">
            <span className="star-empty">★</span>
            <span 
              className="star-filled" 
              style={{ width: `${fillPercent}%` }}
            >
              ★
            </span>
          </span>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  
  // Independent preview override (default matches actual login state)
  const [overrideAuth, setOverrideAuth] = useState(null)
  const userLoggedIn = overrideAuth !== null ? overrideAuth : isAuthenticated

  // Independent alphabetical sorting state for each category (starting at 'asc' = A-Z)
  const [genreSort, setGenreSort] = useState('asc')
  const [mechanicSort, setMechanicSort] = useState('asc')
  const [themeSort, setThemeSort] = useState('asc')

  // Live state from backend
  const [popularGames, setPopularGames] = useState([])
  const [recommendedGames, setRecommendedGames] = useState([])
  const [rawGenres, setRawGenres] = useState([])
  const [rawMechanics, setRawMechanics] = useState([])
  const [rawThemes, setRawThemes] = useState([])
  const [loading, setLoading] = useState(true)

  const carouselRef = useRef(null)

  const scrollRecommendations = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 400
      carouselRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Fetch live games, categories, and recommendations from backend
  useEffect(() => {
    async function fetchHomeData() {
      try {
        const [popRes, recRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/games/popular`),
          fetch(`${API_BASE_URL}/recommendations`),
          fetch(`${API_BASE_URL}/games/categories`)
        ])

        if (popRes.ok) {
          const popData = await popRes.json()
          setPopularGames(popData)
        }

        if (recRes.ok) {
          const recData = await recRes.json()
          setRecommendedGames(recData)
        }

        if (catRes.ok) {
          const catData = await catRes.json()
          setRawGenres(catData.genres || [])
          setRawMechanics(catData.mechanics || [])
          setRawThemes(catData.themes || [])
        }
      } catch (err) {
        console.warn('Could not load live backend data, keeping fallback/empty:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  // Sorted items based on current sort direction (asc: A-Z, desc: Z-A)
  const sortedGenres = useMemo(() => {
    return [...rawGenres].sort((a, b) => 
      genreSort === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    )
  }, [rawGenres, genreSort])

  const sortedMechanics = useMemo(() => {
    return [...rawMechanics].sort((a, b) => 
      mechanicSort === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    )
  }, [rawMechanics, mechanicSort])

  const sortedThemes = useMemo(() => {
    return [...rawThemes].sort((a, b) => 
      themeSort === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    )
  }, [rawThemes, themeSort])

  return (
    <div className="home-container">
      {/* Dev toggle to preview logged-in vs logged-out view */}
      <div className="auth-status-bar">
        <span>Preview Mode: <strong>{userLoggedIn ? 'Logged In View' : 'Guest View'}</strong></span>
        <button 
          type="button" 
          onClick={() => setOverrideAuth(!userLoggedIn)}
          className="auth-toggle-btn"
        >
          Switch to {userLoggedIn ? 'Guest View' : 'Logged In View'}
        </button>
      </div>

      <div className="home-layout">
        {/* Left Column: Popular This Week */}
        <aside className="sidebar-popular">
          <div className="section-header sidebar-header">
            <h2>Popular This Week</h2>
          </div>

          <div className="popular-list">
            {popularGames.map((game, index) => {
              const splashStyle = game.image
                ? {
                    backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.90) 0%, rgba(26, 34, 52, 0.72) 100%), url("${game.image}")`
                  }
                : {}

              return (
                <div key={game.id} className="popular-item-card">
                  {/* Whole block click navigates to game page with splash background */}
                  <Link 
                    to={`/game/${game.id}`} 
                    className="popular-main-link" 
                    style={splashStyle}
                    aria-label={`View ${game.title} game page`}
                  >
                    <div className="popular-main-info">
                      <span className="popular-name">
                        <span className="popular-rank">#{index + 1}</span> {game.title}
                      </span>

                      {/* Display two biggest tags for top 3 games as requested */}
                      {index < 3 && game.tags && game.tags.length > 0 && (
                        <div className="popular-tags">
                          {game.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="tag-badge">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Distinct review bubble clickable to the game's reviews (keeps original color) */}
                  <Link 
                    to={`/game/${game.id}#reviews`} 
                    className="popular-rating-bubble" 
                    title={`View reviews for ${game.title} (${parseFloat(game.rating).toFixed(1)} stars)`}
                    aria-label={`View reviews for ${game.title}`}
                  >
                    <StarRating rating={game.rating} />
                    <span className="rating-score-text">{parseFloat(game.rating).toFixed(1)}</span>
                  </Link>
                </div>
              )
            })}
          </div>
        </aside>

        {/* Right Main Content Area */}
        <section className="main-content-column">
          {/* Top Section: Your Board Game Recommendations */}
          <div className="recommendations-box">
            <div className="section-header rec-header">
              <div className="header-title-with-info">
                <h2>Your Board Game Recommendations</h2>
                <span 
                  className="info-bubble" 
                  title="Personalized recommendations based on games you have played, rated, or added to your collection."
                >
                  ?
                </span>
              </div>
              {userLoggedIn && (
                <span className="rec-subtitle">Curated from your play history and preferred mechanics</span>
              )}
            </div>

            {userLoggedIn ? (
              <div className="carousel-wrapper">
                <button 
                  type="button" 
                  className="carousel-btn left-arrow" 
                  onClick={() => scrollRecommendations('left')}
                  aria-label="Previous recommendations"
                >
                  &#8592;
                </button>

                <div className="recommendations-carousel" ref={carouselRef}>
                  {recommendedGames.map((game) => (
                    <Link to={`/game/${game.id}`} key={game.id} className="rec-card">
                      <div className="rec-image-box">
                        <img 
                          src={game.image} 
                          alt={game.title} 
                          loading="lazy" 
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }} 
                        />
                      </div>
                      <div className="rec-info">
                        <h3 className="rec-title">{game.title}</h3>
                        {game.year && <span className="rec-year">{game.year}</span>}
                      </div>
                    </Link>
                  ))}
                </div>

                <button 
                  type="button" 
                  className="carousel-btn right-arrow" 
                  onClick={() => scrollRecommendations('right')}
                  aria-label="Next recommendations"
                >
                  &#8594;
                </button>
              </div>
            ) : (
              /* Not logged in placeholder */
              <div className="logged-out-rec-placeholder">
                <div className="placeholder-icon">🎲</div>
                <h3>Sign in for personalized recommendations</h3>
                <p>
                  Create an account or log in to receive recommendations tailored to your favorite genres, player counts, and mechanics.
                </p>
                <div className="placeholder-buttons">
                  <Link to="/register" className="rec-auth-btn register">Create Account</Link>
                  <Link to="/login" className="rec-auth-btn login">Log In</Link>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section: Categories Breakdown (Genres, Mechanics, Themes) */}
          <div className="categories-section">
            {/* Genres Column */}
            <div className="category-block">
              <div className="category-header">
                <h3>Genres</h3>
                <button
                  type="button"
                  className="sort-toggle-btn"
                  onClick={() => setGenreSort(prev => prev === 'asc' ? 'desc' : 'asc')}
                  title={`Sort alphabetically: currently ${genreSort === 'asc' ? 'A to Z' : 'Z to A'} (click to change)`}
                  aria-label={`Sort genres ${genreSort === 'asc' ? 'Z to A' : 'A to Z'}`}
                >
                  <SortOrderIcon direction={genreSort} />
                </button>
              </div>
              <div className="category-scrollable-list">
                <ul>
                  {sortedGenres.map(item => (
                    <li key={item.name}>
                      <span className="cat-item-row">
                        <span className="cat-name">{item.name}</span>
                        <span className="cat-count">({item.count})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mechanics Column */}
            <div className="category-block">
              <div className="category-header">
                <h3>Mechanics</h3>
                <button
                  type="button"
                  className="sort-toggle-btn"
                  onClick={() => setMechanicSort(prev => prev === 'asc' ? 'desc' : 'asc')}
                  title={`Sort alphabetically: currently ${mechanicSort === 'asc' ? 'A to Z' : 'Z to A'} (click to change)`}
                  aria-label={`Sort mechanics ${mechanicSort === 'asc' ? 'Z to A' : 'A to Z'}`}
                >
                  <SortOrderIcon direction={mechanicSort} />
                </button>
              </div>
              <div className="category-scrollable-list">
                <ul>
                  {sortedMechanics.map(item => (
                    <li key={item.name}>
                      <span className="cat-item-row">
                        <span className="cat-name">{item.name}</span>
                        <span className="cat-count">({item.count})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Themes Column */}
            <div className="category-block">
              <div className="category-header">
                <h3>Themes</h3>
                <button
                  type="button"
                  className="sort-toggle-btn"
                  onClick={() => setThemeSort(prev => prev === 'asc' ? 'desc' : 'asc')}
                  title={`Sort alphabetically: currently ${themeSort === 'asc' ? 'A to Z' : 'Z to A'} (click to change)`}
                  aria-label={`Sort themes ${themeSort === 'asc' ? 'Z to A' : 'A to Z'}`}
                >
                  <SortOrderIcon direction={themeSort} />
                </button>
              </div>
              <div className="category-scrollable-list">
                <ul>
                  {sortedThemes.map(item => (
                    <li key={item.name}>
                      <span className="cat-item-row">
                        <span className="cat-name">{item.name}</span>
                        <span className="cat-count">({item.count})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
