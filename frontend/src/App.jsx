import { BrowserRouter, Routes, Route, Link } from 'react-router'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <nav><Link to="/">Home</Link></nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  )
}