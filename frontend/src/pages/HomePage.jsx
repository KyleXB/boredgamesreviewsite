import { Link } from 'react-router'

export default function HomePage() {
  return (
    <main>
      <h1>Bored Games</h1>
      <Link to="/game/catan">View Catan</Link>
    </main>
  )
}