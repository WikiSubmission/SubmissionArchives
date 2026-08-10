import { useState } from 'react'
import { Plus, X, Tag, Calendar, Hash, CheckSquare, Type, SlidersHorizontal } from 'lucide-react'

interface FrontmatterPanelProps {
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
}

type FieldType = 'text' | 'number' | 'checkbox' | 'date' | 'list'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

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

function getIconForType(key: string, type: FieldType) {
  if (key.toLowerCase() === 'tags') return <Tag size={13} className="text-amber-400/70" />
  switch (type) {
    case 'date':
      return <Calendar size={13} className="text-sky-400/70" />
    case 'number':
      return <Hash size={13} className="text-emerald-400/70" />
    case 'checkbox':
      return <CheckSquare size={13} className="text-purple-400/70" />
    default:
      return <Type size={13} className="text-white/40" />
  }
}

export default function FrontmatterPanel({ data, onChange }: FrontmatterPanelProps) {
  const [newKey, setNewKey] = useState('')
  const [newType, setNewType] = useState<FieldType>('text')
  const [showAddRow, setShowAddRow] = useState(false)
  const keys = Object.keys(data).filter((key) => !SYSTEM_KEYS.has(key))

  const removeField = (key: string) => {
    const next = { ...data }
    delete next[key]
    onChange(next)
  }

  const addTag = (key: string, tagVal: string) => {
    const current = (data[key] as string[]) || []
    if (!tagVal.trim() || current.includes(tagVal.trim())) return
    onChange({ ...data, [key]: [...current, tagVal.trim()] })
  }

  const removeTag = (key: string, index: number) => {
    const current = (data[key] as string[]) || []
    onChange({ ...data, [key]: current.filter((_, idx) => idx !== index) })
  }

  const addField = () => {
    const key = newKey.trim()
    if (!key || key in data || SYSTEM_KEYS.has(key)) return
    onChange({ ...data, [key]: defaultValueForType(newType) })
    setNewKey('')
    setNewType('text')
    setShowAddRow(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-8 pt-4 pb-4 mb-4 border-b border-white/[0.06] select-none">
      {/* Property Section Header */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/30 mb-2.5">
        <SlidersHorizontal size={13} strokeWidth={1.5} />
        <span>Properties</span>
      </div>

      <div className="space-y-2">
        {keys.map((key) => {
          const value = data[key]
          const type = inferType(value)

          return (
            <div key={key} className="flex items-start gap-3 py-1 group rounded-md hover:bg-white/[0.02] px-1.5 transition-colors">
              {/* Property Icon & Key Label */}
              <div className="flex items-center gap-2 w-32 shrink-0 pt-0.5">
                {getIconForType(key, type)}
                <span className="text-xs text-white/50 font-medium truncate">{key}</span>
              </div>

              {/* Property Value Input */}
              <div className="flex-1 min-w-0">
                {type === 'list' || key.toLowerCase() === 'tags' ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.isArray(value) &&
                      value.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 font-medium"
                        >
                          {String(item)}
                          <button
                            onClick={() => removeTag(key, idx)}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    <input
                      placeholder="+ tag"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addTag(key, (e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                      className="text-xs text-white/60 bg-transparent outline-none border-b border-transparent focus:border-white/20 px-1 py-0.5 w-20 placeholder:text-white/20"
                    />
                  </div>
                ) : type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => onChange({ ...data, [key]: e.target.checked })}
                    className="accent-amber-400 cursor-pointer mt-1"
                  />
                ) : type === 'number' ? (
                  <input
                    type="number"
                    defaultValue={String(value)}
                    onBlur={(e) =>
                      onChange({ ...data, [key]: e.target.value === '' ? 0 : Number(e.target.value) })
                    }
                    className="w-full bg-transparent text-xs text-white/80 outline-none border-b border-transparent focus:border-white/20 py-0.5 font-mono"
                  />
                ) : type === 'date' ? (
                  <input
                    type="date"
                    defaultValue={String(value)}
                    onChange={(e) => onChange({ ...data, [key]: e.target.value })}
                    className="bg-transparent text-xs text-white/80 outline-none border-b border-transparent focus:border-white/20 py-0.5 [color-scheme:dark] font-mono"
                  />
                ) : (
                  <input
                    defaultValue={String(value ?? '')}
                    onBlur={(e) => onChange({ ...data, [key]: e.target.value })}
                    className="w-full bg-transparent text-xs text-white/80 outline-none border-b border-transparent focus:border-white/20 py-0.5"
                  />
                )}
              </div>

              {/* Remove Property Action */}
              <button
                onClick={() => removeField(key)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-opacity p-0.5"
              >
                <X size={13} />
              </button>
            </div>
          )
        })}

        {/* Add Property Row */}
        {showAddRow ? (
          <div className="flex items-center gap-2 pt-1">
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addField()}
              placeholder="Property name"
              autoFocus
              className="text-xs text-white/70 bg-white/[0.04] outline-none rounded px-2 py-1 border border-white/10 w-32 placeholder:text-white/20"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as FieldType)}
              className="text-xs text-white/60 bg-[#1c1c1f] outline-none rounded px-2 py-1 border border-white/10"
            >
              <option value="text">Text</option>
              <option value="list">Tag List</option>
              <option value="number">Number</option>
              <option value="checkbox">Checkbox</option>
              <option value="date">Date</option>
            </select>
            <button
              onClick={addField}
              className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddRow(false)}
              className="text-xs text-white/30 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddRow(true)}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-amber-400 transition-colors font-medium pt-1 px-1"
          >
            <Plus size={13} />
            <span>Add property</span>
          </button>
        )}
      </div>
    </div>
  )
}
