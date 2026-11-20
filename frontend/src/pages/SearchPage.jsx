import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { SortOrderIcon, StarRating } from './SharedComponents'
import './HomePage.css'
import './SearchPage.css'

// The search text comes from the site header (Header.jsx), which sends:
//   /search?category=<scope>&q=<text>
// where scope is one of the header dropdown values (all, board-games, genres, ...).
// The sidebar adds exact filters on top:  &genre=...&mechanic=...&theme=...
// Sorting:  &sort=name|rating&dir=asc|desc
// Everything lives in the URL, so searches can be bookmarked and shared.

// Mock game data – replace with data from your backend
const GAMES = [
  { id: 'catan', title: 'Catan', year: '1995', players: '3–4', rating: '4.2',
    genres: ['Strategy', 'Family'], mechanics: ['Trading', 'Dice Rolling', 'Resource Management'], themes: ['Economy / Industry'] },
  { id: 'pandemic', title: 'Pandemic', year: '2008', players: '2–4', rating: '4.5',
    genres: ['Cooperative', 'Strategy'], mechanics: ['Hand Management', 'Set Collection', 'Variable Player Powers'], themes: [] },
  { id: 'ticket-to-ride', title: 'Ticket to Ride', year: '2004', players: '2–5', rating: '4.3',
    genres: ['Family'], mechanics: ['Set Collection', 'Hand Management'], themes: [] },
  { id: 'wingspan', title: 'Wingspan', year: '2019', players: '1–5', rating: '4.7',
    genres: ['Strategy', 'Card Game', 'Drafting'], mechanics: ['Hand Management', 'Set Collection', 'Dice Rolling'], themes: ['Animals / Nature'] },
  { id: 'terraforming-mars', title: 'Terraforming Mars', year: '2016', players: '1–5', rating: '4.8',
    genres: ['Strategy'], mechanics: ['Hand Management', 'Tile Placement', 'Variable Player Powers', 'Resource Management'], themes: ['Science Fiction', 'Space Exploration', 'Economy / Industry'] },
  { id: '7-wonders', title: '7 Wonders', year: '2010', players: '2–7', rating: '4.4',
    genres: ['Card Game', 'Drafting', 'Strategy'], mechanics: ['Set Collection', 'Simultaneous Action', 'Hand Management'], themes: ['Civilization', 'Ancient History'] },
  { id: 'azul', title: 'Azul', year: '2017', players: '2–4', rating: '4.6',
    genres: ['Abstract', 'Family', 'Drafting'], mechanics: ['Tile Placement', 'Set Collection'], themes: [] },
  { id: 'carcassonne', title: 'Carcassonne', year: '2000', players: '2–5', rating: '4.2',
    genres: ['Family', 'Strategy'], mechanics: ['Tile Placement', 'Area Majority / Influence'], themes: ['Medieval'] },
  { id: 'scythe', title: 'Scythe', year: '2016', players: '1–5', rating: '4.5',
    genres: ['Strategy', 'Wargame'], mechanics: ['Area Majority / Influence', 'Grid Movement', 'Variable Player Powers', 'Resource Management'], themes: ['Economy / Industry'] },
  { id: 'dune-imperium', title: 'Dune: Imperium', year: '2020', players: '1–4', rating: '4.8',
    genres: ['Strategy', 'Deck-Building', 'Worker Placement'], mechanics: ['Hand Management', 'Area Majority / Influence'], themes: ['Science Fiction'] },
  { id: 'everdell', title: 'Everdell', year: '2018', players: '1–4', rating: '4.4',
    genres: ['Strategy', 'Worker Placement'], mechanics: ['Hand Management', 'Resource Management', 'Set Collection'], themes: ['Fantasy', 'Animals / Nature'] },
  { id: 'root', title: 'Root', year: '2018', players: '2–4', rating: '4.3',
    genres: ['Strategy', 'Wargame'], mechanics: ['Variable Player Powers', 'Area Majority / Influence', 'Dice Rolling'], themes: ['Fantasy', 'Animals / Nature'] },
  { id: 'codenames', title: 'Codenames', year: '2015', players: '2–8', rating: '4.1',
    genres: ['Party', 'Deduction'], mechanics: [], themes: [] },
  { id: 'gloomhaven', title: 'Gloomhaven', year: '2017', players: '1–4', rating: '4.7',
    genres: ['Adventure', 'Cooperative'], mechanics: ['Hand Management', 'Grid Movement', 'Variable Player Powers'], themes: ['Fantasy'] },
  { id: 'dominion', title: 'Dominion', year: '2008', players: '2–4', rating: '4.0',
    genres: ['Card Game', 'Deck-Building'], mechanics: ['Hand Management'], themes: ['Medieval'] },
  { id: 'arkham-horror', title: 'Arkham Horror', year: '2005', players: '1–8', rating: '4.0',
    genres: ['Adventure', 'Cooperative'], mechanics: ['Dice Rolling', 'Variable Player Powers'], themes: ['Horror'] },
  { id: 'libertalia', title: 'Libertalia', year: '2012', players: '2–6', rating: '4.0',
    genres: ['Card Game'], mechanics: ['Simultaneous Action', 'Hand Management'], themes: ['Nautical / Pirates'] },
  { id: 'quacks', title: 'The Quacks of Quedlinburg', year: '2018', players: '2–4', rating: '4.3',
    genres: ['Family'], mechanics: ['Push Your Luck'], themes: ['Medieval'] },
  { id: 'santorini', title: 'Santorini', year: '2016', players: '2–4', rating: '4.2',
    genres: ['Abstract'], mechanics: ['Grid Movement', 'Variable Player Powers'], themes: ['Mythology', 'Ancient History'] }
]

// Same category names as the home page, so its links land on a matching filter
const CATEGORIES = {
  genres: {
    title: 'Genres', label: 'Genre', param: 'genre',
    names: ['Strategy', 'Family', 'Cooperative', 'Card Game', 'Party', 'Wargame', 'Abstract', 'Drafting', 'Deck-Building', 'Worker Placement', 'Adventure', 'Deduction']
  },
  mechanics: {
    title: 'Mechanics', label: 'Mechanic', param: 'mechanic',
    names: ['Hand Management', 'Set Collection', 'Dice Rolling', 'Variable Player Powers', 'Tile Placement', 'Area Majority / Influence', 'Auction / Bidding', 'Grid Movement', 'Trading', 'Resource Management', 'Push Your Luck', 'Simultaneous Action']
  },
  themes: {
    title: 'Themes', label: 'Theme', param: 'theme',
    names: ['Fantasy', 'Science Fiction', 'Medieval', 'Animals / Nature', 'Economy / Industry', 'Space Exploration', 'Horror', 'Civilization', 'Nautical / Pirates', 'Ancient History', 'Post-Apocalyptic', 'Mythology']
  }
}


// Header dropdown scopes: which part of a game the search text is matched against.
// Scopes without data yet (expansions, publishers, users) show a message instead.
const SCOPES = {
  'all':         { label: 'All',         fields: (g) => [g.title, ...g.genres, ...g.mechanics, ...g.themes] },
  'board-games': { label: 'Board Games', fields: (g) => [g.title] },
  'genres':      { label: 'Genres',      fields: (g) => g.genres },
  'mechanics':   { label: 'Mechanics',   fields: (g) => g.mechanics },
  'themes':      { label: 'Themes',      fields: (g) => g.themes },
  'expansions':  { label: 'Expansions',  unsupported: true },
  'publishers':  { label: 'Publishers',  unsupported: true },
  'users':       { label: 'Users',       unsupported: true }
}

// Build a /search URL from the current params with some values changed (null removes one)
function withParams(searchParams, changes) {
  const params = new URLSearchParams(searchParams)
  Object.entries(changes).forEach(([key, value]) =>
    value === null || value === '' ? params.delete(key) : params.set(key, value)
  )
  return params
}

// One filter column in the sidebar, with its own A–Z / Z–A toggle (like the home page)
function FilterBlock({ categoryKey, activeValue, buildUrl }) {
  const [sortDir, setSortDir] = useState('asc')
  const { title, names, param } = CATEGORIES[categoryKey]

  const items = useMemo(() => {
    return names
      .map(name => ({ name, count: GAMES.filter(g => g[categoryKey].includes(name)).length }))
      .sort((a, b) => sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
  }, [names, categoryKey, sortDir])

  return (
    <div className="category-block search-filter-block">
      <div className="category-header">
        <h3>{title}</h3>
        <button
          type="button"
          className="sort-toggle-btn"
          onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
          title={`Sort alphabetically: currently ${sortDir === 'asc' ? 'A to Z' : 'Z to A'} (click to change)`}
          aria-label={`Sort ${title.toLowerCase()} ${sortDir === 'asc' ? 'Z to A' : 'A to Z'}`}
        >
          <SortOrderIcon direction={sortDir} />
        </button>
      </div>
      <div className="category-scrollable-list">
        <ul>
          {items.map(item => {
            const isActive = activeValue === item.name
            return (
              <li key={item.name}>
                <Link
                  to={buildUrl({ [param]: isActive ? null : item.name })}
                  className={isActive ? 'search-filter-active' : ''}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="cat-name">{item.name}</span>
                  <span className="cat-count">({item.count})</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // From the header search bar
  const q = (searchParams.get('q') ?? '').trim()
  const scopeKey = SCOPES[searchParams.get('category')] ? searchParams.get('category') : 'all'
  const scope = SCOPES[scopeKey]

  // From the sidebar
  const filters = Object.fromEntries(
    Object.entries(CATEGORIES).map(([key, cat]) => [key, searchParams.get(cat.param)])
  )

  const sort = searchParams.get('sort') === 'rating' ? 'rating' : 'name'
  const dir = searchParams.get('dir') ?? (sort === 'rating' ? 'desc' : 'asc')

  const buildUrl = (changes) => {
    const str = withParams(searchParams, changes).toString()
    return str ? `/search?${str}` : '/search'
  }

  const results = useMemo(() => {
    if (scope.unsupported) return []
    const needle = q.toLowerCase()

    const filtered = GAMES.filter(game => {
      // Exact sidebar filters
      for (const [key, value] of Object.entries(filters)) {
        if (value && !game[key].includes(value)) return false
      }
      // Header search text, matched within the chosen scope
      if (needle && !scope.fields(game).some(field => field.toLowerCase().includes(needle))) return false
      return true
    })

    return filtered.sort((a, b) => {
      const diff = sort === 'rating'
        ? parseFloat(a.rating) - parseFloat(b.rating)
        : a.title.localeCompare(b.title)
      return dir === 'asc' ? diff : -diff
    })
    // filters is rebuilt each render, so depend on the URL instead
  }, [q, scope, searchParams.toString(), sort, dir])

  const changeSort = (newSort) => {
    // Rating defaults to highest first, name to A–Z
    setSearchParams(withParams(searchParams, { sort: newSort, dir: newSort === 'rating' ? 'desc' : 'asc' }))
  }

  const directionLabel = sort === 'rating'
    ? (dir === 'desc' ? 'highest first' : 'lowest first')
    : (dir === 'asc' ? 'A to Z' : 'Z to A')

  const activeFilters = Object.entries(CATEGORIES).filter(([key]) => filters[key])
  const hasAnything = q || scopeKey !== 'all' || activeFilters.length > 0

  const heading = q
    ? `Results for “${q}”${scopeKey !== 'all' ? ` in ${scope.label}` : ''}`
    : 'All games'

  return (
    <div className="home-container">
      <div className="home-layout">
        {/* Left Column: Filters */}
        <aside className="sidebar-popular search-sidebar">
          <div className="section-header sidebar-header">
            <h2>Filters</h2>
          </div>

          {Object.keys(CATEGORIES).map(key => (
            <FilterBlock
              key={key}
              categoryKey={key}
              activeValue={filters[key]}
              buildUrl={buildUrl}
            />
          ))}
        </aside>

        {/* Right Main Content Area (search text comes from the header) */}
        <section className="main-content-column">
          <div className="search-results">
            <div className="section-header search-results-header">
              <div>
                <h2>{heading}</h2>
                <span className="search-meta">
                  {results.length} {results.length === 1 ? 'game' : 'games'}
                </span>
              </div>

              <div className="search-sort-controls">
                <span className="search-sort-label">Sort by</span>
                <button
                  type="button"
                  className={`search-sort-option ${sort === 'name' ? 'active' : ''}`}
                  onClick={() => changeSort('name')}
                  aria-pressed={sort === 'name'}
                >
                  Name
                </button>
                <button
                  type="button"
                  className={`search-sort-option ${sort === 'rating' ? 'active' : ''}`}
                  onClick={() => changeSort('rating')}
                  aria-pressed={sort === 'rating'}
                >
                  Rating
                </button>
                <button
                  type="button"
                  className="sort-toggle-btn"
                  onClick={() => setSearchParams(withParams(searchParams, { dir: dir === 'asc' ? 'desc' : 'asc' }))}
                  title={`Currently ${directionLabel} (click to reverse)`}
                  aria-label={`Reverse order, currently ${directionLabel}`}
                >
                  <SortOrderIcon direction={dir} />
                </button>
              </div>
            </div>

            {/* Active search + filters, each removable */}
            {hasAnything && (
              <div className="search-active-filters">
                {q && (
                  <span className="tag-badge search-filter-chip">
                    Search: {q}{scopeKey !== 'all' && ` (${scope.label})`}
                    <Link
                      to={buildUrl({ q: null, category: null })}
                      className="search-chip-remove"
                      aria-label="Clear search text"
                    >
                      ✕
                    </Link>
                  </span>
                )}
                {activeFilters.map(([key, cat]) => (
                  <span key={key} className="tag-badge search-filter-chip">
                    {cat.label}: {filters[key]}
                    <Link
                      to={buildUrl({ [cat.param]: null })}
                      className="search-chip-remove"
                      aria-label={`Remove ${cat.label.toLowerCase()} filter ${filters[key]}`}
                    >
                      ✕
                    </Link>
                  </span>
                ))}
              </div>
            )}

            {results.length > 0 ? (
              <div className="popular-list">
                {results.map(game => (
                  <div key={game.id} className="popular-item-card">
                    <Link to={`/game/${game.id}`} className="popular-main-link" aria-label={`View ${game.title} game page`}>
                      <div className="popular-main-info">
                        <span className="popular-name">{game.title}</span>
                        <span className="search-meta">{game.year} · {game.players} players</span>

                        {game.genres.length > 0 && (
                          <div className="popular-tags">
                            {game.genres.map(tag => (
                              <span key={tag} className="tag-badge">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>

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
                ))}
              </div>
            ) : (
              <div className="recommendations-box">
                <div className="logged-out-rec-placeholder">
                  <div className="placeholder-icon">🎲</div>
                  {scope.unsupported ? (
                    <>
                      <h3>Searching {scope.label.toLowerCase()} isn't available yet</h3>
                      <p>Pick another category in the search bar's dropdown.</p>
                    </>
                  ) : (
                    <>
                      <h3>No games found</h3>
                      <p>Try a different search in the bar at the top, or remove a filter.</p>
                    </>
                  )}
                  <div className="placeholder-buttons">
                    <Link to="/search" className="rec-auth-btn login">Clear search</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
