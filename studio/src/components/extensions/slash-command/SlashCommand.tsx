import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import { CommandList, type CommandListRef } from './CommandList'
import { getSlashCommandItems, type SlashCommandItem } from './items'

const suggestion: Omit<SuggestionOptions<SlashCommandItem>, 'editor'> = {
  char: '/',
  allowSpaces: true,
  items: ({ query }) => getSlashCommandItems(query),
  render: () => {
    let component: ReactRenderer<CommandListRef>
    let popup: TippyInstance

    return {
      onStart: (props) => {
        component = new ReactRenderer(CommandList, {
          props: { items: props.items, command: (item: SlashCommandItem) => item.command(props) },
          editor: props.editor,
        })

        popup = tippy(document.body, {
          getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect(),
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })
      },
      onUpdate: (props) => {
        component.updateProps({ items: props.items, command: (item: SlashCommandItem) => item.command(props) })
        popup.setProps({ getReferenceClientRect: () => props.clientRect?.() ?? new DOMRect() })
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          popup.hide()
          return true
        }
        return component.ref?.onKeyDown(props) ?? false
      },
      onExit: () => {
        popup.destroy()
        component.destroy()
      },
    }
  },
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return { suggestion }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
