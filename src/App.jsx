import { useEffect, useState } from 'react'
import decks from './data/decks.js'
import { loadLastDeckId, loadProgress, saveLastDeckId, saveProgress } from './storage.js'
import './App.css'

// Opens the deck you were studying last time, or the first deck if that one is gone.
function loadDeckId() {
  const saved = loadLastDeckId()
  return decks.some((d) => d.id === saved) ? saved : decks[0].id
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

// Turns [deck, deck, deck] into [{ group: 'Starter', decks: [...] }, { group: 'HSK 5 上 …', decks: [...] }]
// so the Decks tab can show a heading for each unit.
function groupDecks(list) {
  const groups = []
  for (const d of list) {
    const last = groups[groups.length - 1]
    if (last && last.group === d.group) last.decks.push(d)
    else groups.push({ group: d.group, decks: [d] })
  }
  return groups
}

export default function App() {
  // progress looks like { 'hsk5-l1-03': 'known', 'hsk5-l2-10': 'learning', ... } keyed by word id
  const [progress, setProgress] = useState(loadProgress)
  // Which tab is open: 'study' (the flashcards) or 'decks' (the list of decks)
  const [view, setView] = useState('study')
  const [deckId, setDeckId] = useState(loadDeckId)
  const currentDeck = decks.find((d) => d.id === deckId)
  const words = currentDeck.words

  const [deck, setDeck] = useState(() => shuffle(words))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showPinyin, setShowPinyin] = useState(false)
  const [showVocabList, setShowVocabList] = useState(false)

  useEffect(() => saveProgress(progress), [progress])
  useEffect(() => saveLastDeckId(deckId), [deckId])

  const card = deck[index]
  const finished = index >= deck.length
  const knownIn = (list) => list.filter((w) => progress[w.id] === 'known').length
  const knownCount = knownIn(words)
  const learntWords = words.filter((w) => progress[w.id] === 'known')
  const learningWords = words.filter((w) => progress[w.id] !== 'learning')

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

  function chooseDeck(chosen) {
    setDeckId(chosen.id)
    setDeck(shuffle(chosen.words))
    setIndex(0)
    setFlipped(false)
    setView('study')
  }

  return (
    <main className="app">
      <header>
        <h1>慢慢来</h1>
        <p className="subtitle">màn màn lái · take it slow</p>
      </header>

      <nav className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={view === 'study'}
          className={`tab ${view === 'study' ? 'active' : ''}`}
          onClick={() => setView('study')}
        >
          学习 <span className="tab-en">Study</span>
        </button>
        <button
          role="tab"
          aria-selected={view === 'decks'}
          className={`tab ${view === 'decks' ? 'active' : ''}`}
          onClick={() => setView('decks')}
        >
          卡组 <span className="tab-en">Decks</span>
        </button>
      </nav>

      {view === 'decks' ? (
        <section className="deck-list">
          {groupDecks(decks).map(({ group, decks: groupList }) => (
            <div key={group} className="deck-group">
              <h2 className="deck-group-title">{group}</h2>
              {groupList.map((d) => {
                const known = knownIn(d.words)
                const percent = Math.round((known / d.words.length) * 100)
                return (
                  <button
                    key={d.id}
                    className={`deck-item ${d.id === deckId ? 'current' : ''}`}
                    onClick={() => chooseDeck(d)}
                  >
                    <span className="deck-top">
                      <span className="deck-label">{d.label}</span>
                      {d.id === deckId && <span className="deck-badge">Studying</span>}
                    </span>
                    <span className="deck-title">{d.title}</span>
                    <span className="deck-english">{d.english}</span>
                    <span className="deck-bar" aria-hidden="true">
                      <span className="deck-bar-fill" style={{ width: `${percent}%` }} />
                    </span>
                    <span className="deck-count">
                      {known} / {d.words.length} known
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </section>
      ) : (
        <>
          <button className="current-deck" onClick={() => setView('decks')}>
            <span className="current-deck-label">{currentDeck.label}</span>
            <span className="current-deck-title">{currentDeck.title}</span>
            <span className="current-deck-change">Change ›</span>
          </button>

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
                    <span className="pinyin-slot">
                      {showPinyin && <span className="pinyin">{card.pinyin}</span>}
                    </span>
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

              <button
                className={`pinyin-toggle ${showPinyin ? 'on' : ''}`}
                onClick={() => setShowPinyin(!showPinyin)}
                aria-pressed={showPinyin}
              >
                <span className="pinyin-toggle-icon">拼</span>
                {showPinyin ? 'Hide pinyin' : 'Show pinyin'}
              </button>

              <div className="actions">
                <button className="secondary" onClick={() => mark('learning')} disabled={!flipped}>
                  Still learning
                </button>
                <button className="primary" onClick={() => mark('known')} disabled={!flipped}>
                  Got it ✓
                </button>
              </div>
              {/* A panel that folds open and closed. The header bar is the button. */}
              <section className={`vocab-panel ${showVocabList ? 'open' : ''}`}>
                <button
                  className="vocab-header"
                  onClick={() => setShowVocabList(!showVocabList)}
                  aria-expanded={showVocabList}
                  aria-controls="vocab-body"
                >
                  <span className="vocab-title">
                    词汇 <span className="vocab-title-en">Vocabulary</span>
                  </span>
                  <span className="vocab-total">{words.length} words</span>
                  <svg className="vocab-chevron" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {showVocabList && (
                  <div className="vocab" id="vocab-body">
                    <section className="vocab-column">
                      <h3>
                        Learnt <span className="vocab-count">{learntWords.length}</span>
                      </h3>
                      <ul className="vocab-list">
                        {learntWords.map((w) => (
                          <li key={w.id}>
                            <span className="vocab-hanzi">{w.hanzi}</span>
                            <span className="vocab-pinyin">{w.pinyin}</span>
                            <span className="vocab-english">{w.english}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
  
                    <section className="vocab-column">
                      <h3>
                        Still learning <span className="vocab-count">{learningWords.length}</span>
                      </h3>
                      <ul className="vocab-list">
                        {learningWords.map((w) => (
                          <li key={w.id}>
                            <span className="vocab-hanzi">{w.hanzi}</span>
                            <span className="vocab-pinyin">{w.pinyin}</span>
                            <span className="vocab-english">{w.english}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </main>
  )
}
