import { useState, useMemo } from 'react'

const EMOJI_CATEGORIES: { name: string; emojis: string[] } = {
  name: 'Scholarly & Core',
  emojis: [
    '📁','📂','📄','📝','📖','📚','💡','⭐','🔥','❤️',
    '🕌','🕋','☪️','✨','🌙','📿','🤲','🌿','🕊️','⚡',
    '🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤',
    '1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','✅','❌','❓','❗','📌',
    '🎓','🏛️','📜','🖊️','🖋️','🔍','🏷️','🗂️','📂','📁'
  ]
}

const EMOJI_KEYWORDS: Record<string, string[]> = {
  '📁': ['folder', 'directory', 'archive'],
  '📂': ['folder', 'open', 'directory'],
  '📄': ['file', 'page', 'document', 'note'],
  '📝': ['memo', 'note', 'write', 'pencil'],
  '📖': ['book', 'open', 'read', 'quran'],
  '📚': ['books', 'library', 'study'],
  '💡': ['idea', 'light', 'bulb'],
  '⭐': ['star', 'favorite'],
  '🔥': ['fire', 'hot', 'important'],
  '❤️': ['heart', 'love'],
  '🕌': ['mosque', 'islamic', 'sermon', 'jumuah'],
  '🕋': ['kaaba', 'mecca', 'quran'],
  '☪️': ['star', 'crescent', 'islam'],
  '✨': ['sparkles', 'magic', 'clean'],
  '🌙': ['moon', 'crescent', 'ramadan'],
  '📿': ['beads', 'tasbih', 'dhikr'],
  '🤲': ['dua', 'hands', 'prayer'],
  '🌿': ['leaf', 'nature', 'growth'],
  '🕊️': ['dove', 'peace'],
  '⚡': ['lightning', 'zap', 'fast'],
  '🎓': ['grad', 'academic', 'study'],
  '📜': ['scroll', 'manuscript', 'history'],
  '📌': ['pin', 'pinned', 'important'],
  '🔍': ['search', 'find'],
  '🏷️': ['tag', 'label']
}

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  currentEmoji?: string
}

export function EmojiPicker({ onSelect, onClose, currentEmoji }: EmojiPickerProps) {
  const [search, setSearch] = useState('')

  const filteredEmojis = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return EMOJI_CATEGORIES.emojis

    return EMOJI_CATEGORIES.emojis.filter(emoji => {
      const keywords = EMOJI_KEYWORDS[emoji] || []
      return keywords.some(k => k.includes(q))
    })
  }, [search])

  return (
    <div className="glass-strong rounded-xl p-3 shadow-ed-lg w-64 border border-ed-rule z-50 animate-fadeInUp">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-ed-fg-muted uppercase tracking-wider">Choose Icon</span>
        <button
          onClick={onClose}
          className="text-ed-fg-muted hover:text-ed-fg text-xs px-1 rounded hover:bg-ed-surface-strong"
        >
          ✕
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search emoji..."
        className="w-full bg-ed-surface border border-ed-rule rounded-md px-2.5 py-1 text-xs text-ed-fg focus:outline-none focus:border-ed-accent-soft mb-2"
        autoFocus
      />

      <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto p-1 custom-scrollbar">
        {filteredEmojis.map((emoji, idx) => (
          <button
            key={`${emoji}-${idx}`}
            onClick={() => {
              onSelect(emoji)
              onClose()
            }}
            className={`hover:bg-ed-surface-strong rounded-md p-1.5 text-lg transition-transform hover:scale-110 flex items-center justify-center ${
              currentEmoji === emoji ? 'bg-ed-surface-strong ring-1 ring-ed-accent' : ''
            }`}
          >
            {emoji}
          </button>
        ))}

        {filteredEmojis.length === 0 && (
          <div className="col-span-6 text-center py-4 text-xs text-ed-fg-muted">
            No matching emojis
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-ed-rule flex justify-between items-center">
        <button
          onClick={() => {
            onSelect('')
            onClose()
          }}
          className="text-xs text-ed-danger hover:underline"
        >
          Remove Custom Icon
        </button>
      </div>
    </div>
  )
}
