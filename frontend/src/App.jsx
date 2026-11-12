import { BrowserRouter, Routes, Route } from 'react-router'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  )
}