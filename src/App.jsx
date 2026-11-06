import { useEffect, useState } from 'react'
import words from './data/words.js'
import './App.css'

// Progress is saved in your browser under this name, so it survives a page refresh.
const STORAGE_KEY = 'manmanlai-progress'

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

// Returns a new array with the items in random order.
function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function App() {
  // progress looks like { 1: 'known', 4: 'learning', ... } keyed by word id
  const [progress, setProgress] = useState(loadProgress)
  const [deck, setDeck] = useState(() => shuffle(words))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      // Storage can be blocked (e.g. private browsing); the app still works without it.
    }
  }, [progress])

  const card = deck[index]
  const finished = index >= deck.length
  const knownCount = words.filter((w) => progress[w.id] === 'known').length

  function mark(status) {
    setProgress({ ...progress, [card.id]: status })
    setFlipped(false)
    setIndex(index + 1)
  }

  function restart(onlyLearning) {
    const pool = onlyLearning ? words.filter((w) => progress[w.id] !== 'known') : words
    setDeck(shuffle(pool.length ? pool : words))
    setIndex(0)
    setFlipped(false)
  }

  return (
    <main className="app">
      <header>
        <h1>慢慢来</h1>
        <p className="subtitle">màn màn lái · take it slow</p>
      </header>

      <div className="stats">
        <span>
          Known: <strong>{knownCount}</strong> / {words.length}
        </span>
        {!finished && (
          <span>
            Card {index + 1} of {deck.length}
          </span>
        )}
      </div>

      {finished ? (
        <section className="done">
          <h2>做得好! Well done!</h2>
          <p>You went through all the cards.</p>
          <div className="actions">
            <button className="secondary" onClick={() => restart(false)}>
              Practise all
            </button>
            <button className="primary" onClick={() => restart(true)}>
              Practise ones I'm still learning
            </button>
          </div>
        </section>
      ) : (
        <>
          <button
            className={`card ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
            aria-label={flipped ? 'Show the front' : 'Show the answer'}
          >
            <div className="card-inner">
              <div className="card-face front">
                <span className="hanzi">{card.hanzi}</span>
                <span className="hint">Tap to flip</span>
              </div>
              <div className="card-face back">
                <span className="hanzi small">{card.hanzi}</span>
                <span className="pinyin">{card.pinyin}</span>
                <span className="english">{card.english}</span>
              </div>
            </div>
          </button>

          <div className="actions">
            <button className="secondary" onClick={() => mark('learning')} disabled={!flipped}>
              Still learning
            </button>
            <button className="primary" onClick={() => mark('known')} disabled={!flipped}>
              Got it ✓
            </button>
          </div>
        </>
      )}
    </main>
  )
}
