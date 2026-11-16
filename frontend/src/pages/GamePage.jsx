import { useState } from 'react'
import { useParams } from 'react-router'
import './GamePage.css'

const images = [
  '/placeholder3.jpg',
  '/placeholder2.jpg',
  '/placeholder.jpg',
]

const hasReviewed = false // placeholder until review data exists

export default function GamePage() {
  const { gameId } = useParams()
  const [imageIndex, setImageIndex] = useState(0)

  const showPrevious = () => {
    setImageIndex((current) => (current - 1 + images.length) % images.length)
  }

  const showNext = () => {
    setImageIndex((current) => (current + 1) % images.length)
  }

  return (
    <main className="game-page">

      <div className='game-page__media'>
        <div className="game-gallery">
          <div className="game-image">
            {images.map((src, offset) => {
              const index = (imageIndex + offset) % images.length
              return (<img
                key={src}
                className={`game-image__card game-image__card--${offset}`}
                src={images[index]}
                alt={offset === 0 ? `${gameId} board game` : ''}/>
              )
            })}
          </div>
          <div className="game-gallery__controls">
            <button type="button" onClick={showPrevious} aria-label="Previous image">
              ←
            </button>
            <span>{imageIndex + 1} / {images.length}</span>
            <button type="button" onClick={showNext} aria-label="Next image">
              →
            </button>
          </div>
        </div>

          <div className="game-ratings">
            <div>
              <span>Global rating</span>
              <div className="game-stars" aria-label="Global rating: 4.3 out of 5">
                <span aria-hidden="true">★★★★☆</span>
                <strong>4.3/5</strong>
              </div>
            </div>

            <div>
              <span>Your rating</span>
              <div className="game-stars" aria-label="Your rating: not rated">
                <span aria-hidden="true">☆☆☆☆☆</span>
                <strong>—/5</strong>
              </div>
            </div>
          </div>

          <button type="button" className="game-page__review-button">
            {hasReviewed ? 'Edit your review' : 'Write a review'}
          </button>
      </div>


      <div className="game-page__details">
        <div className="game-page__title-row">
          <h1 className="game-page__title">{gameId}</h1>
          <span className="game-page__year"> (A random year)</span>
        </div>

        <div className="game-page__facts">
          <div className="game-page__fact">
            <span>Players</span>
            <strong>Random number of players</strong>
          </div>

          <div className="game-page__fact">
            <span>Play time</span>
            <strong>At least one min</strong>
          </div>

          <div className="game-page__fact">
            <span>Age</span>
            <strong>0+</strong>
          </div>

          <div className="game-page__fact">
            <span>Publisher</span>
            <strong> Random Studios</strong>
          </div>
        </div>

        <section className="game-page__about">
          <h2>About this game</h2>
          <p>
          <p>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum Lorem.</p>
          <p>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum Lorem.</p>
          </p>
        </section>

        <section className="game-page__expansions">
          <h2>Expansions</h2>

          <div className="game-page__expansion-list">
            <a href="#" className="game-page__expansion-card">Expansion 1</a>
            <a href="#" className="game-page__expansion-card">Expansion 2</a>
            <a href="#" className="game-page__expansion-card">Expansion 3</a>
            <a href="#" className="game-page__expansion-card">Expansion 4</a>
            <a href="#" className="game-page__expansion-card">Expansion 5</a>
            <a href="#" className="game-page__expansion-card">Expansion 6</a>
          </div>
        </section>
      </div>
    </main>
  )
}