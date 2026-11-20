// Small UI components shared by HomePage and SearchPage

// Sort Icon Component matching the user's reference mockup
// Shows bars with directional arrow: Down arrow for A-Z, Up arrow for Z-A
export function SortOrderIcon({ direction }) {
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

// 5-Star Rating Component
export function StarRating({ rating }) {
  const numRating = parseFloat(rating)
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
