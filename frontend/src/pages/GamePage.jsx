import { useParams } from 'react-router'

export default function GamePage() {
  const { gameId } = useParams()

  return <main><h1>Game: {gameId}</h1></main>
}