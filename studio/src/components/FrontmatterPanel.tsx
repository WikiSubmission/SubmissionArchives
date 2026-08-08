import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface FrontmatterPanelProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

type FieldType = 'text' | 'number' | 'checkbox' | 'date' | 'list'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// These have their own dedicated UI (the note menu, editor toolbar) — showing
// them again as raw editable rows here would just be double exposure of the
// same implementation detail.
const SYSTEM_KEYS = new Set(['locked', 'fullWidth', 'fontFamily', 'pdfAttachment', 'pdfSplitView'])

function inferType(value: unknown): FieldType {
  if (typeof value === 'boolean') return 'checkbox'
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return 'list'
  if (typeof value === 'string' && DATE_PATTERN.test(value)) return 'date'
  return 'text'
}

function defaultValueForType(type: FieldType): unknown {
  switch (type) {
    case 'checkbox':
      return false
    case 'number':
      return 0
    case 'list':
      return []
    case 'date':
      return new Date().toISOString().slice(0, 10)
    default:
      return ''
  }
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

const inputClass =
  'flex-1 bg-transparent text-sm text-white/80 outline-none border-b border-transparent focus:border-white/20 py-0.5'

export default function FrontmatterPanel({ data, onChange }: FrontmatterPanelProps) {
  const [newKey, setNewKey] = useState('')
  const [newType, setNewType] = useState<FieldType>('text')
  const keys = Object.keys(data).filter((key) => !SYSTEM_KEYS.has(key))

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
    if (!key || key in data || SYSTEM_KEYS.has(key)) return
    onChange({ ...data, [key]: defaultValueForType(newType) })
    setNewKey('')
    setNewType('text')
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
      {keys.map((key) => {
        const value = data[key]
        const type = inferType(value)

        return (
          <div key={key} className="flex items-center gap-2 group">
            <span className="text-xs text-white/40 font-mono w-24 shrink-0 truncate">{key}</span>
            {type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange({ ...data, [key]: e.target.checked })}
                className="accent-white/70"
              />
            ) : type === 'number' ? (
              <input
                type="number"
                defaultValue={String(value)}
                onBlur={(e) => onChange({ ...data, [key]: e.target.value === '' ? 0 : Number(e.target.value) })}
                className={inputClass}
              />
            ) : type === 'date' ? (
              <input
                type="date"
                defaultValue={String(value)}
                onChange={(e) => onChange({ ...data, [key]: e.target.value })}
                className={`${inputClass} [color-scheme:dark]`}
              />
            ) : (
              <input defaultValue={toDisplayValue(value)} onBlur={(e) => updateField(key, e.target.value)} className={inputClass} />
            )}
            <button
              onClick={() => removeField(key)}
              className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-opacity"
            >
              <X size={13} />
            </button>
          </div>
        )
      })}
      <div className="flex items-center gap-2">
        <input
          value={newKey.trim()}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addField()}
          placeholder="property"
          className="text-xs text-white/50 font-mono w-24 shrink-0 bg-transparent outline-none placeholder:text-white/20"
        />
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as FieldType)}
          className="text-xs text-white/40 bg-[#1c1c1f] outline-none rounded px-1 py-0.5 border border-white/10"
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="checkbox">Checkbox</option>
          <option value="date">Date</option>
          <option value="list">List</option>
        </select>
        <button onClick={addField} className="text-white/30 hover:text-ed-accent transition-colors">
          <Plus size={13} />
        </button>
      </div>
    </div>
  )
}
