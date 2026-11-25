import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { SortOrderIcon, StarRating } from './SharedComponents'
import './HomePage.css'
import './SearchPage.css'

// Same backend as HomePage
const API_BASE_URL = 'http://localhost:3001/api'

// The search text comes from the site header (Header.jsx), which sends:
//   /search?category=<scope>&q=<text>
// where scope is one of the header dropdown values (all, board-games, genres, ...).
// The sidebar (and the home page's category links) add exact filters:
//   &genre=...&mechanic=...&theme=...
// Sorting:  &sort=name|rating&dir=asc|desc
// Everything lives in the URL, so searches can be bookmarked and shared.

const CATEGORIES = {
  genres:    { title: 'Genres',    label: 'Genre',    param: 'genre' },
  mechanics: { title: 'Mechanics', label: 'Mechanic', param: 'mechanic' },
  themes:    { title: 'Themes',    label: 'Theme',    param: 'theme' }
}

// Header dropdown scopes: which part of a game the search text is matched against.
// Scopes without data yet (expansions, publishers, users) show a message instead.
const SCOPES = {
  'all':         { label: 'All',         fields: (g) => [g.title, ...g.tags, ...g.genres, ...g.mechanics, ...g.themes] },
  'board-games': { label: 'Board Games', fields: (g) => [g.title] },
  'genres':      { label: 'Genres',      fields: (g) => g.genres },
  'mechanics':   { label: 'Mechanics',   fields: (g) => g.mechanics },
  'themes':      { label: 'Themes',      fields: (g) => g.themes },
  'expansions':  { label: 'Expansions',  unsupported: true },
  'publishers':  { label: 'Publishers',  unsupported: true },
  'users':       { label: 'Users',       unsupported: true }
}

// Accepts ['Strategy', ...] or [{ name: 'Strategy' }, ...]
const toNameList = (value) =>
  Array.isArray(value)
    ? value.map(v => (typeof v === 'string' ? v : v?.name)).filter(Boolean)
    : []

// Turn a game from the API into the shape this page uses,
// so missing fields don't break filtering or rendering
function normalizeGame(game) {
  const minP = game.minPlayers ?? game.min_players
  const maxP = game.maxPlayers ?? game.max_players
  return {
    id: game.id,
    title: game.title ?? game.name ?? '',
    year: game.year ?? game.yearPublished ?? game.year_published ?? null,
    players: game.players ?? (minP && maxP ? (minP === maxP ? `${minP}` : `${minP}–${maxP}`) : null),
    rating: parseFloat(game.rating) || 0,
    image: game.image ?? null,
    tags: toNameList(game.tags),
    genres: toNameList(game.genres),
    mechanics: toNameList(game.mechanics),
    themes: toNameList(game.themes)
  }
}

// ---- Loading every game, not just the first page ----
// The backend sends games in pages (e.g. 50 at a time). This keeps asking for the
// next page until no new games come back. It sends the common paging parameter names
// (page/limit, offset/limit, skip/take, per_page, pageSize) so it works with most
// backends without knowing which one this server uses.
const PAGE_SIZE = 100
const MAX_PAGES = 500 // safety stop

// Pull the list of games and any paging info out of a response
function readPage(data) {
  if (Array.isArray(data)) return { list: data, meta: {} }
  const list = data?.games ?? data?.data ?? data?.items ?? data?.results ?? data?.rows ?? []
  const meta = data?.pagination ?? data?.meta ?? data ?? {}
  return {
    list: Array.isArray(list) ? list : [],
    meta: {
      total: meta.total ?? meta.totalCount ?? meta.total_count ?? meta.count,
      totalPages: meta.totalPages ?? meta.total_pages ?? meta.pages ?? meta.lastPage ?? meta.last_page,
      hasMore: meta.hasMore ?? meta.has_more ?? meta.hasNextPage
    }
  }
}

// Returns true if the endpoint answered, false if it didn't exist / failed on the first page
async function fetchAllPages(path, onPage, isCancelled) {
  const all = []
  const seenIds = new Set()

  for (let page = 1; page <= MAX_PAGES; page++) {
    if (isCancelled()) return true

    const offset = all.length
    const params = new URLSearchParams({
      page, limit: PAGE_SIZE, offset,
      skip: offset, take: PAGE_SIZE,
      per_page: PAGE_SIZE, pageSize: PAGE_SIZE
    })
    const res = await fetch(`${API_BASE_URL}${path}?${params}`)
    if (!res.ok) return page > 1 // a later page failing still keeps what we have

    const { list, meta } = readPage(await res.json())

    // Only keep games we haven't seen; if the server ignores paging it
    // returns the same games again, and we stop.
    const fresh = list.filter(g => {
      const key = g.id ?? g.title ?? g.name
      if (seenIds.has(key)) return false
      seenIds.add(key)
      return true
    })
    if (fresh.length === 0) break

    all.push(...fresh)
    onPage([...all])

    if (meta.hasMore === false) break
    if (meta.total != null && all.length >= Number(meta.total)) break
    if (meta.totalPages != null && page >= Number(meta.totalPages)) break
  }
  return true
}

// Build a params object from the current params with some values changed (null removes one)
function withParams(searchParams, changes) {
  const params = new URLSearchParams(searchParams)
  Object.entries(changes).forEach(([key, value]) =>
    value === null || value === '' ? params.delete(key) : params.set(key, value)
  )
  return params
}

// One filter column in the sidebar, with its own A–Z / Z–A toggle (like the home page)
function FilterBlock({ categoryKey, items, activeValue, buildUrl }) {
  const [sortDir, setSortDir] = useState('asc')
  const { title, param } = CATEGORIES[categoryKey]

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) =>
      sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    )
  }, [items, sortDir])

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
          {sortedItems.map(item => {
            const isActive = activeValue === item.name
            return (
              <li key={item.name}>
                <Link
                  to={buildUrl({ [param]: isActive ? null : item.name })}
                  className={isActive ? 'search-filter-active' : ''}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="cat-name">{item.name}</span>
                  {item.count != null && <span className="cat-count">({item.count})</span>}
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

  // Live state from backend
  const [games, setGames] = useState([])
  const [categoryItems, setCategoryItems] = useState({ genres: [], mechanics: [], themes: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // Fetch every game (page by page) and the categories from the backend (same API as HomePage)
  useEffect(() => {
    let cancelled = false

    async function fetchSearchData() {
      // Categories for the sidebar
      fetch(`${API_BASE_URL}/games/categories`)
        .then(res => (res.ok ? res.json() : null))
        .then(catData => {
          if (cancelled || !catData) return
          setCategoryItems({
            genres: catData.genres || [],
            mechanics: catData.mechanics || [],
            themes: catData.themes || []
          })
        })
        .catch(err => console.warn('Could not load categories:', err))

      // All games. Fall back to the popular list if there is no /games endpoint.
      const onPage = (gamesSoFar) => {
        if (cancelled) return
        setGames(gamesSoFar.map(normalizeGame))
        setLoading(false) // show the first page straight away, keep loading the rest
      }

      try {
        let ok = await fetchAllPages('/games', onPage, () => cancelled)
        if (!ok && !cancelled) ok = await fetchAllPages('/games/popular', onPage, () => cancelled)
        if (!ok && !cancelled) setLoadError(true)
      } catch (err) {
        console.warn('Could not load live backend data for search:', err)
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    }

    setLoadingMore(true)
    fetchSearchData()
    return () => { cancelled = true }
  }, [])

  // If the categories endpoint returned nothing, build the lists from the games instead
  const sidebarItems = useMemo(() => {
    const result = {}
    for (const key of Object.keys(CATEGORIES)) {
      if (categoryItems[key].length > 0) {
        result[key] = categoryItems[key]
      } else {
        const counts = {}
        games.forEach(g => g[key].forEach(name => { counts[name] = (counts[name] || 0) + 1 }))
        result[key] = Object.entries(counts).map(([name, count]) => ({ name, count }))
      }
    }
    return result
  }, [categoryItems, games])

  // From the header search bar
  const q = (searchParams.get('q') ?? '').trim()
  const scopeKey = SCOPES[searchParams.get('category')] ? searchParams.get('category') : 'all'
  const scope = SCOPES[scopeKey]

  // From the sidebar / home page links
  const filters = Object.fromEntries(
    Object.entries(CATEGORIES).map(([key, cat]) => [key, searchParams.get(cat.param)])
  )

  const sort = searchParams.get('sort') === 'rating' ? 'rating' : 'name'
  const dir = searchParams.get('dir') ?? (sort === 'rating' ? 'desc' : 'asc')

  const buildUrl = (changes) => {
    const str = withParams(searchParams, changes).toString()
    return str ? `/search?${str}` : '/search'
  }

  const paramsKey = searchParams.toString()

  const results = useMemo(() => {
    if (scope.unsupported) return []
    const needle = q.toLowerCase()

    const filtered = games.filter(game => {
      // Exact sidebar filters
      for (const [key, value] of Object.entries(filters)) {
        if (value && !game[key].includes(value)) return false
      }
      // Header search text, matched within the chosen scope
      if (needle && !scope.fields(game).some(field => field.toLowerCase().includes(needle))) return false
      return true
    })

    return filtered.sort((a, b) => {
      const diff = sort === 'rating' ? a.rating - b.rating : a.title.localeCompare(b.title)
      return dir === 'asc' ? diff : -diff
    })
    // filters is rebuilt each render, so depend on the URL instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games, paramsKey])

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

  // What to show when there are no results
  const renderEmptyState = () => {
    let title, text
    if (loading) {
      title = 'Loading games…'
      text = ''
    } else if (loadError) {
      title = 'Could not load games'
      text = 'The server did not respond. Check that the backend is running and try again.'
    } else if (scope.unsupported) {
      title = `Searching ${scope.label.toLowerCase()} isn't available yet`
      text = "Pick another category in the search bar's dropdown."
    } else {
      title = 'No games found'
      text = 'Try a different search in the bar at the top, or remove a filter.'
    }

    return (
      <div className="recommendations-box">
        <div className="logged-out-rec-placeholder">
          <div className="placeholder-icon">🎲</div>
          <h3>{title}</h3>
          {text && <p>{text}</p>}
          {!loading && !loadError && (
            <div className="placeholder-buttons">
              <Link to="/search" className="rec-auth-btn login">Clear search</Link>
            </div>
          )}
        </div>
      </div>
    )
  }

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
              items={sidebarItems[key]}
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
                {!loading && (
                  <span className="search-meta">
                    {results.length} {results.length === 1 ? 'game' : 'games'}
                    {loadingMore && ' (loading more…)'}
                  </span>
                )}
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
                {results.map(game => {
                  // Same splash background as the home page's popular list
                  const splashStyle = game.image
                    ? {
                        backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.90) 0%, rgba(26, 34, 52, 0.72) 100%), url("${game.image}")`
                      }
                    : {}
                  const tags = (game.genres.length > 0 ? game.genres : game.tags).slice(0, 3)
                  const meta = [game.year, game.players && `${game.players} players`].filter(Boolean).join(' · ')

                  return (
                    <div key={game.id} className="popular-item-card">
                      <Link
                        to={`/game/${game.id}`}
                        className="popular-main-link"
                        style={splashStyle}
                        aria-label={`View ${game.title} game page`}
                      >
                        <div className="popular-main-info">
                          <span className="popular-name">{game.title}</span>
                          {meta && <span className="search-meta">{meta}</span>}

                          {tags.length > 0 && (
                            <div className="popular-tags">
                              {tags.map(tag => (
                                <span key={tag} className="tag-badge">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </Link>

                      <Link
                        to={`/game/${game.id}#reviews`}
                        className="popular-rating-bubble"
                        title={`View reviews for ${game.title} (${game.rating.toFixed(1)} stars)`}
                        aria-label={`View reviews for ${game.title}`}
                      >
                        <StarRating rating={game.rating} />
                        <span className="rating-score-text">{game.rating.toFixed(1)}</span>
                      </Link>
                    </div>
                  )
                })}
              </div>
            ) : (
              renderEmptyState()
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
