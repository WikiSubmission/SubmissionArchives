import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { SlashCommandItem } from './items'

interface CommandListProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

export interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export const CommandList = forwardRef<CommandListRef, CommandListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => setSelectedIndex(0), [props.items])

  const selectItem = (index: number) => {
    const item = props.items[index]
    if (item) props.command(item)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  if (props.items.length === 0) {
    return null
  }

  return (
    <div className="bg-[#1c1c1f] border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[240px] py-1 animate-fade-in-up">
      {props.items.map((item, index) => (
        <button
          key={item.title}
          onClick={() => selectItem(index)}
          className={`w-full text-left px-3 py-2 flex flex-col gap-0.5 transition-colors ${
            index === selectedIndex ? 'bg-emerald-500/10 text-white' : 'text-white/70'
          }`}
        >
          <span className="text-sm font-medium">{item.title}</span>
          <span className="text-xs text-white/40 font-mono">{item.description}</span>
        </button>
      ))}
    </div>
  )
})

CommandList.displayName = 'CommandList'
