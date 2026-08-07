import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface FrontmatterPanelProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

function toDisplayValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  return String(value ?? '')
}

function fromDisplayValue(raw: string): unknown {
  if (raw.includes(',')) {
    return raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return raw
}

export default function FrontmatterPanel({ data, onChange }: FrontmatterPanelProps) {
  const [newKey, setNewKey] = useState('')
  const keys = Object.keys(data)

  const updateField = (key: string, raw: string) => {
    onChange({ ...data, [key]: fromDisplayValue(raw) })
  }

  const removeField = (key: string) => {
    const next = { ...data }
    delete next[key]
    onChange(next)
  }

  const addField = () => {
    const key = newKey.trim()
    if (!key || key in data) return
    onChange({ ...data, [key]: '' })
    setNewKey('')
  }

  if (keys.length === 0 && newKey === '') {
    return (
      <div className="max-w-3xl mx-auto px-8 pt-6">
        <button
          onClick={() => setNewKey(' ')}
          className="text-xs text-white/25 hover:text-white/50 transition-colors font-mono"
        >
          + add property
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-8 pt-6 pb-2 border-b border-white/5 space-y-1.5">
      {keys.map((key) => (
        <div key={key} className="flex items-center gap-2 group">
          <span className="text-xs text-white/40 font-mono w-24 shrink-0 truncate">{key}</span>
          <input
            defaultValue={toDisplayValue(data[key])}
            onBlur={(e) => updateField(key, e.target.value)}
            className="flex-1 bg-transparent text-sm text-white/80 outline-none border-b border-transparent focus:border-white/20 py-0.5"
          />
          <button
            onClick={() => removeField(key)}
            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-opacity"
          >
            <X size={13} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          value={newKey.trim()}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addField()}
          placeholder="property"
          className="text-xs text-white/50 font-mono w-24 shrink-0 bg-transparent outline-none placeholder:text-white/20"
        />
        <button onClick={addField} className="text-white/30 hover:text-emerald-400 transition-colors">
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}
