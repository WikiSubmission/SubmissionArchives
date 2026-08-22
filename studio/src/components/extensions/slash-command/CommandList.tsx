import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { SlashCommandItem } from './items'
import { AppIcon } from '../../ui/Icons'

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
    <div className="glass-strong border border-ed-rule rounded-xl shadow-ed-lg overflow-hidden min-w-[260px] py-1 max-h-[300px] overflow-y-auto animate-fadeInUp">
      {props.items.map((item, index) => (
        <button
          key={`${item.title}-${index}`}
          onClick={() => selectItem(index)}
          className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
            index === selectedIndex ? 'bg-ed-surface-strong text-ed-fg' : 'text-ed-fg-muted hover:text-ed-fg'
          }`}
        >
          {item.icon ? (
            <AppIcon name={item.icon} size={18} weight="bold" className="shrink-0 text-ed-accent" />
          ) : (
            <div className="w-[18px]" />
          )}
          <div className="flex flex-col gap-0.5 truncate">
            <span className="text-xs font-semibold tracking-tight">{item.title}</span>
            <span className="text-[10px] text-ed-fg-muted font-mono truncate">{item.description}</span>
          </div>
        </button>
      ))}
    </div>
  )
})

CommandList.displayName = 'CommandList'
