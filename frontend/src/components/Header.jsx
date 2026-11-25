import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router'
import './Header.css'

const CATEGORY_VALUES = ['all', 'board-games', 'expansions', 'publishers', 'genres', 'mechanics', 'themes', 'users']

export default function Header() {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // On the search page, show the current search in the bar
  // (e.g. after following a link from the home page, or pressing Back)
  useEffect(() => {
    if (location.pathname !== '/search') return
    const urlCategory = searchParams.get('category')
    setCategory(CATEGORY_VALUES.includes(urlCategory) ? urlCategory : 'all')
    setQuery(searchParams.get('q') ?? '')
  }, [location.pathname, searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    // Blank search bar: show every game
    if (!query.trim()) {
      navigate('/search')
      return
    }
    // Navigate to search/browse page with query parameters
    navigate(`/search?category=${encodeURIComponent(category)}&q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="site-header">
      {/* Brand / Logo */}
      <div className="header-brand">
        <Link to="/" className="brand-logo" aria-label="Bored Games Home">
          BG
        </Link>
      </div>

      {/* Center/Right Search Bar with Category Dropdown */}
      <form className="header-search-form" onSubmit={handleSearch} role="search">
        <select
          className="search-dropdown"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter search by category"
        >
          <option value="all">All</option>
          <option value="board-games">Board Games</option>
          <option value="expansions">Expansions</option>
          <option value="publishers">Publishers</option>
          <option value="genres">Genres</option>
          <option value="mechanics">Mechanics</option>
          <option value="themes">Themes</option>
          <option value="users">Users</option>
        </select>

        <input
          type="text"
          className="search-input"
          placeholder="Search for Board Games..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search input"
        />
      </form>

      {/* Right Auth Links */}
      <div className="header-auth">
        <Link to="/register" className="auth-btn auth-register">
          Register
        </Link>
        <Link to="/login" className="auth-btn auth-login">
          Login
        </Link>
      </div>
    </header>
  )
}

