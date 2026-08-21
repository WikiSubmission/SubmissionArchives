import { useState } from 'react'
import { Plus, X, Tag, Calendar, Hash, CheckSquare, TextT, SlidersHorizontal } from '@phosphor-icons/react'

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
  if (key.toLowerCase() === 'tags') return <Tag size={14} weight="bold" className="text-ed-accent" />
  switch (type) {
    case 'date':
      return <Calendar size={14} weight="regular" className="text-ed-accent" />
    case 'number':
      return <Hash size={14} weight="bold" className="text-ed-success" />
    case 'checkbox':
      return <CheckSquare size={14} weight="regular" className="text-purple-400" />
    default:
      return <TextT size={14} weight="regular" className="text-ed-fg-muted" />
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
    <div className="max-w-3xl mx-auto px-8 pt-4 pb-4 mb-4 border-b border-ed-rule select-none">
      {/* Property Section Header */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ed-fg-muted mb-2.5">
        <SlidersHorizontal size={14} weight="bold" />
        <span>Properties</span>
      </div>

      <div className="space-y-2">
        {keys.map((key) => {
          const value = data[key]
          const type = inferType(value)

          return (
            <div key={key} className="flex items-start gap-3 py-1 group rounded-md hover:bg-ed-surface px-1.5 transition-colors">
              {/* Property Icon & Key Label */}
              <div className="flex items-center gap-2 w-32 shrink-0 pt-0.5">
                {getIconForType(key, type)}
                <span className="text-xs text-ed-fg-muted font-medium truncate">{key}</span>
              </div>

              {/* Property Value Input */}
              <div className="flex-1 min-w-0">
                {type === 'list' || key.toLowerCase() === 'tags' ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.isArray(value) &&
                      value.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-ed-accent-soft border border-ed-accent/25 text-ed-accent font-medium"
                        >
                          {String(item)}
                          <button
                            onClick={() => removeTag(key, idx)}
                            className="hover:text-ed-danger transition-colors"
                          >
                            <X size={10} weight="bold" />
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
                      className="text-xs text-ed-fg font-medium bg-transparent outline-none border-b border-transparent focus:border-ed-rule-strong px-1 py-0.5 w-20 placeholder:text-ed-fg-muted"
                    />
                  </div>
                ) : type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) => onChange({ ...data, [key]: e.target.checked })}
                    className="accent-ed-accent cursor-pointer mt-1"
                  />
                ) : type === 'number' ? (
                  <input
                    type="number"
                    defaultValue={String(value)}
                    onBlur={(e) =>
                      onChange({ ...data, [key]: e.target.value === '' ? 0 : Number(e.target.value) })
                    }
                    className="w-full bg-transparent text-xs text-ed-fg outline-none border-b border-transparent focus:border-ed-rule-strong py-0.5 font-mono"
                  />
                ) : type === 'date' ? (
                  <input
                    type="date"
                    defaultValue={String(value)}
                    onChange={(e) => onChange({ ...data, [key]: e.target.value })}
                    className="bg-transparent text-xs text-ed-fg outline-none border-b border-transparent focus:border-ed-rule-strong py-0.5 font-mono"
                  />
                ) : (
                  <input
                    defaultValue={String(value ?? '')}
                    onBlur={(e) => onChange({ ...data, [key]: e.target.value })}
                    className="w-full bg-transparent text-xs text-ed-fg outline-none border-b border-transparent focus:border-ed-rule-strong py-0.5"
                  />
                )}
              </div>

              {/* Remove Property Action */}
              <button
                onClick={() => removeField(key)}
                className="opacity-0 group-hover:opacity-100 text-ed-fg-muted hover:text-ed-danger transition-opacity p-0.5"
              >
                <X size={13} weight="bold" />
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
              className="text-xs text-ed-fg bg-ed-surface outline-none rounded px-2 py-1 border border-ed-rule w-32 placeholder:text-ed-fg-muted"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as FieldType)}
              className="text-xs text-ed-fg bg-ed-surface outline-none rounded px-2 py-1 border border-ed-rule"
            >
              <option value="text">Text</option>
              <option value="list">Tag List</option>
              <option value="number">Number</option>
              <option value="checkbox">Checkbox</option>
              <option value="date">Date</option>
            </select>
            <button
              onClick={addField}
              className="px-2.5 py-1 rounded bg-ed-accent-soft text-ed-accent text-xs font-semibold hover:bg-ed-accent-soft transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddRow(false)}
              className="text-xs text-ed-fg-muted hover:text-ed-fg transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddRow(true)}
            className="flex items-center gap-1.5 text-xs text-ed-fg-muted hover:text-ed-accent transition-colors font-semibold pt-1 px-1"
          >
            <Plus size={14} weight="bold" />
            <span>Add property</span>
          </button>
        )}
      </div>
    </div>
  )
}
