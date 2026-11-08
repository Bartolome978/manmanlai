// Everything the app saves goes through this file, and nothing else touches storage.
// Today it uses the browser's localStorage. To move to a database later (SQLite on the
// phone, or a cloud database for syncing), rewrite the functions below and leave the
// rest of the app alone.
//
// What is saved:
//   progress: { [wordId]: 'known' | 'learning' }   e.g. { 'hsk5-l1-03': 'known' }
//   last deck: the id of the deck you were studying, e.g. 'hsk5-l2'
//
// As database tables that would be roughly:
//   word_progress(word_id TEXT PRIMARY KEY, status TEXT)
//   settings(key TEXT PRIMARY KEY, value TEXT)

const PROGRESS_KEY = 'manmanlai-progress'
const DECK_KEY = 'manmanlai-deck'

// Storage can be blocked or broken (private browsing, full disk). The app still works
// without it, it just won't remember anything, so every read and write is guarded.
function read(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore: see above
  }
}

// The starter words used to have ids 1, 2, 3… They are now 'starter-01', 'starter-02'…
// This renames any progress saved under the old ids so it is not lost.
function upgradeOldIds(progress) {
  const upgraded = {}
  for (const [id, status] of Object.entries(progress)) {
    const newId = /^\d+$/.test(id) ? `starter-${id.padStart(2, '0')}` : id
    upgraded[newId] = status
  }
  return upgraded
}

export function loadProgress() {
  try {
    const saved = JSON.parse(read(PROGRESS_KEY))
    return saved && typeof saved === 'object' ? upgradeOldIds(saved) : {}
  } catch {
    return {}
  }
}

export function saveProgress(progress) {
  write(PROGRESS_KEY, JSON.stringify(progress))
}

export function loadLastDeckId() {
  return read(DECK_KEY)
}

export function saveLastDeckId(deckId) {
  write(DECK_KEY, deckId)
}
