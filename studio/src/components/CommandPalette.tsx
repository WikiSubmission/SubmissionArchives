import CommandModal from './CommandModal'

export interface PaletteCommand {
  id: string
  label: string
  run: () => void
}

interface CommandPaletteProps {
  commands: PaletteCommand[]
  onClose: () => void
}

export default function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  return (
    <CommandModal
      items={commands}
      getKey={(command) => command.id}
      getLabel={(command) => command.label}
      onSelect={(command) => command.run()}
      onClose={onClose}
      placeholder="Type a command..."
      emptyMessage="No matching commands."
    />
  )
}
