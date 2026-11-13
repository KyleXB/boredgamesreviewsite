import { useState, useRef, useMemo } from 'react'
import { Link } from 'react-router'
import './HomePage.css'

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
      {/* 4 horizontal bars with varying widths */}
      <line x1="3" y1="5" x2="14" y2="5" />
      <line x1="3" y1="10" x2="11" y2="10" />
      <line x1="3" y1="15" x2="8" y2="15" />
      <line x1="3" y1="20" x2="5" y2="20" />

      {/* Directional arrow based on current sort: A-Z (down) vs Z-A (up) */}
      {direction === 'asc' ? (
        // Downward arrow: A-Z
        <>
          <line x1="19" y1="5" x2="19" y2="19" />
          <polyline points="15 15 19 19 23 15" />
        </>
      ) : (
        // Upward arrow: Z-A
        <>
          <line x1="19" y1="19" x2="19" y2="5" />
          <polyline points="15 9 19 5 23 9" />
        </>
      )}
    </svg>
  )
}

export default function HomePage() {
  // Mock login state for testing recommendation section (§2 requirement)
  const [isLoggedIn, setIsLoggedIn] = useState(true)

  // Independent alphabetical sorting state for each category (starting at 'asc' = A-Z)
  const [genreSort, setGenreSort] = useState('asc')
  const [mechanicSort, setMechanicSort] = useState('asc')
  const [themeSort, setThemeSort] = useState('asc')

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

  // Mock sample games for Popular This Week (10 games as shown in wireframe)
  const popularGames = [
    { id: 'catan', title: 'Catan', tags: ['Strategy', 'Trading'], rating: '4.2' },
    { id: 'pandemic', title: 'Pandemic', tags: ['Co-op', 'Strategy'], rating: '4.5' },
    { id: 'ticket-to-ride', title: 'Ticket to Ride', tags: ['Family', 'Trains'], rating: '4.3' },
    { id: 'wingspan', title: 'Wingspan', rating: '4.7' },
    { id: 'terraforming-mars', title: 'Terraforming Mars', rating: '4.8' },
    { id: '7-wonders', title: '7 Wonders', rating: '4.4' },
    { id: 'azul', title: 'Azul', rating: '4.6' },
    { id: 'carcassonne', title: 'Carcassonne', rating: '4.2' },
    { id: 'scythe', title: 'Scythe', rating: '4.5' },
    { id: 'dune-imperium', title: 'Dune: Imperium', rating: '4.8' }
  ]

  // Mock recommendations data
  const recommendedGames = [
    {
      id: 'wingspan',
      title: 'Wingspan',
      year: '2019',
      image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=400&q=80',
      rating: '4.7'
    },
    {
      id: 'scythe',
      title: 'Scythe',
      year: '2016',
      image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=400&q=80',
      rating: '4.5'
    },
    {
      id: 'terraforming-mars',
      title: 'Terraforming Mars',
      year: '2016',
      image: 'https://images.unsplash.com/photo-1563941402622-4e7a488bcc57?auto=format&fit=crop&w=400&q=80',
      rating: '4.8'
    },
    {
      id: 'dune-imperium',
      title: 'Dune: Imperium',
      year: '2020',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80',
      rating: '4.8'
    },
    {
      id: 'azul',
      title: 'Azul',
      year: '2017',
      image: 'https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=400&q=80',
      rating: '4.6'
    },
    {
      id: 'everdell',
      title: 'Everdell',
      year: '2018',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      rating: '4.4'
    },
    {
      id: 'root',
      title: 'Root',
      year: '2018',
      image: 'https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?auto=format&fit=crop&w=400&q=80',
      rating: '4.5'
    }
  ]

  // Raw data for categories
  const rawGenres = [
    { name: 'Strategy', count: 48 },
    { name: 'Family', count: 35 },
    { name: 'Cooperative', count: 24 },
    { name: 'Card Game', count: 41 },
    { name: 'Party', count: 19 },
    { name: 'Wargame', count: 14 },
    { name: 'Abstract', count: 22 },
    { name: 'Drafting', count: 28 },
    { name: 'Deck-Building', count: 31 },
    { name: 'Worker Placement', count: 27 },
    { name: 'Adventure', count: 18 },
    { name: 'Deduction', count: 15 }
  ]

  const rawMechanics = [
    { name: 'Hand Management', count: 42 },
    { name: 'Set Collection', count: 37 },
    { name: 'Dice Rolling', count: 29 },
    { name: 'Variable Player Powers', count: 33 },
    { name: 'Tile Placement', count: 21 },
    { name: 'Area Majority / Influence', count: 19 },
    { name: 'Auction / Bidding', count: 16 },
    { name: 'Grid Movement', count: 25 },
    { name: 'Trading', count: 18 },
    { name: 'Resource Management', count: 34 },
    { name: 'Push Your Luck', count: 12 },
    { name: 'Simultaneous Action', count: 14 }
  ]

  const rawThemes = [
    { name: 'Fantasy', count: 39 },
    { name: 'Science Fiction', count: 34 },
    { name: 'Medieval', count: 28 },
    { name: 'Animals / Nature', count: 22 },
    { name: 'Economy / Industry', count: 26 },
    { name: 'Space Exploration', count: 21 },
    { name: 'Horror', count: 13 },
    { name: 'Civilization', count: 17 },
    { name: 'Nautical / Pirates', count: 11 },
    { name: 'Ancient History', count: 16 },
    { name: 'Post-Apocalyptic', count: 9 },
    { name: 'Mythology', count: 15 }
  ]

  // Sorted items based on current sort direction (asc: A-Z, desc: Z-A)
  const sortedGenres = useMemo(() => {
    return [...rawGenres].sort((a, b) => 
      genreSort === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    )
  }, [genreSort])

  const sortedMechanics = useMemo(() => {
    return [...rawMechanics].sort((a, b) => 
      mechanicSort === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    )
  }, [mechanicSort])

  const sortedThemes = useMemo(() => {
    return [...rawThemes].sort((a, b) => 
      themeSort === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    )
  }, [themeSort])

  return (
    <div className="home-container">
      {/* Dev toggle to preview logged-in vs logged-out (§2 in wireframe) */}
      <div className="auth-status-bar">
        <span>Preview Mode: <strong>{isLoggedIn ? 'Logged In' : 'Logged Out (Guest)'}</strong></span>
        <button 
          type="button" 
          onClick={() => setIsLoggedIn(!isLoggedIn)}
          className="auth-toggle-btn"
        >
          Switch to {isLoggedIn ? 'Guest View' : 'Logged In View'}
        </button>
      </div>

      <div className="home-layout">
        {/* Left Column: Popular This Week */}
        <aside className="sidebar-popular">
          <div className="section-header sidebar-header">
            <h2>Popular This Week</h2>
          </div>

          <div className="popular-list">
            {popularGames.map((game, index) => (
              <div key={game.id} className="popular-item">
                <Link to={`/game/${game.id}`} className="popular-name">
                  <span className="popular-rank">#{index + 1}</span> {game.title}
                </Link>

                <div className="popular-meta">
                  {game.tags && (
                    <div className="popular-tags">
                      {game.tags.map(tag => (
                        <span key={tag} className="tag-badge">{tag}</span>
                      ))}
                    </div>
                  )}
                  <span className="rating-pill">⭐ {game.rating}</span>
                </div>
              </div>
            ))}
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
              {isLoggedIn && (
                <span className="rec-subtitle">Curated from your play history and preferred mechanics</span>
              )}
            </div>

            {isLoggedIn ? (
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
                        <img src={game.image} alt={game.title} loading="lazy" />
                        <span className="rec-rating">⭐ {game.rating}</span>
                      </div>
                      <div className="rec-info">
                        <h3 className="rec-title">{game.title}</h3>
                        <span className="rec-year">{game.year}</span>
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
              /* §2 Requirement: Not logged in placeholder */
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
                      <Link to={`/search?category=genres&q=${encodeURIComponent(item.name)}`}>
                        <span className="cat-name">{item.name}</span>
                        <span className="cat-count">({item.count})</span>
                      </Link>
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
                      <Link to={`/search?category=mechanics&q=${encodeURIComponent(item.name)}`}>
                        <span className="cat-name">{item.name}</span>
                        <span className="cat-count">({item.count})</span>
                      </Link>
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
                      <Link to={`/search?category=themes&q=${encodeURIComponent(item.name)}`}>
                        <span className="cat-name">{item.name}</span>
                        <span className="cat-count">({item.count})</span>
                      </Link>
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
