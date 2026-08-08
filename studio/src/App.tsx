import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import Editor from './components/Editor'
import WelcomeScreen from './components/WelcomeScreen'
import HomeDashboard from './components/HomeDashboard'
import ArchiveExplorer from './components/archive/ArchiveExplorer'
import TagsPane from './components/archive/TagsPane'
import SearchPane from './components/archive/SearchPane'
import TrashPane from './components/archive/TrashPane'
import QuickSwitcher from './components/QuickSwitcher'
import CommandPalette, { type PaletteCommand } from './components/CommandPalette'
import GraphView from './components/GraphView'
import FileViewer from './components/FileViewer'
import SettingsModal from './components/SettingsModal'
import { useArchive } from './hooks/useArchive'
import { useTheme } from './hooks/useTheme'
import { useRecentNotes } from './hooks/useRecentNotes'
import { SettingsProvider } from './hooks/useSettings'
import { fileKindOf } from './lib/fileTypes'
import logoMark from './assets/submission-archives-mark.png'
import { Settings as SettingsIcon } from 'lucide-react'
import './App.css'

type SidebarTab = 'files' | 'tags' | 'search' | 'trash'

function App() {
  const { archivePath, setArchivePath } = useArchive()
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files')
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { recordOpen } = useRecentNotes(archivePath ?? '')

  useTheme(archivePath)

  useEffect(() => {
    if (!archivePath) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return

      if (e.key === 'o') {
        e.preventDefault()
        setQuickSwitcherOpen(true)
      } else if (e.key === 'p') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [archivePath])

  if (!archivePath) {
    return <WelcomeScreen onArchiveSelected={setArchivePath} />
  }

  const handleOpenFile = (path: string) => {
    recordOpen(path)
    setActiveFilePath(path)
  }

  const handleChangeArchive = async () => {
    const path = await open({ directory: true, multiple: false, title: 'Choose your Archive folder' })
    if (typeof path === 'string') {
      setArchivePath(path)
      setActiveFilePath(null)
      setRefreshToken((t) => t + 1)
    }
  }

  const handleWikiLinkNavigate = async (pageName: string) => {
    try {
      const path = await invoke<string>('resolve_wiki_link', { archiveRoot: archivePath, pageName })
      handleOpenFile(path)
      setRefreshToken((t) => t + 1)
    } catch (err) {
      console.error(err)
    }
  }

  const handleNewNote = async () => {
    const name = window.prompt('Note name')
    if (!name) return
    try {
      const path = await invoke<string>('create_note', { dir: archivePath, name })
      handleOpenFile(path)
      setRefreshToken((t) => t + 1)
    } catch (err) {
      window.alert(String(err))
    }
  }

  const handleTrash = async (path: string) => {
    try {
      await invoke('trash_note', { archiveRoot: archivePath, path })
      if (activeFilePath === path) setActiveFilePath(null)
      setRefreshToken((t) => t + 1)
    } catch (err) {
      window.alert(String(err))
    }
  }

  const handleDuplicateNote = async () => {
    if (!activeFilePath) return
    try {
      const path = await invoke<string>('duplicate_note', { path: activeFilePath })
      handleOpenFile(path)
      setRefreshToken((t) => t + 1)
    } catch (err) {
      window.alert(String(err))
    }
  }

  const handleMoveNote = async () => {
    if (!activeFilePath) return
    const targetDir = window.prompt('Move to folder (full path):', archivePath)
    if (!targetDir) return
    try {
      const path = await invoke<string>('move_note', { path: activeFilePath, targetDir })
      handleOpenFile(path)
      setRefreshToken((t) => t + 1)
    } catch (err) {
      window.alert(String(err))
    }
  }

  const handleCopyPath = async () => {
    if (!activeFilePath) return
    try {
      await navigator.clipboard.writeText(activeFilePath)
    } catch (err) {
      window.alert(String(err))
    }
  }

  const handleExportMarkdown = async () => {
    if (!activeFilePath) return
    try {
      const content = await invoke<string>('read_note', { path: activeFilePath })
      const defaultName = activeFilePath.split(/[\\/]/).pop() ?? 'note.md'
      const destination = await save({ defaultPath: defaultName, filters: [{ name: 'Markdown', extensions: ['md'] }] })
      if (!destination) return
      await invoke('write_note', { path: destination, content })
    } catch (err) {
      window.alert(String(err))
    }
  }

  const handleImportFiles = async () => {
    try {
      const selected = await open({ multiple: true, title: 'Import files' })
      if (!selected) return
      const paths = Array.isArray(selected) ? selected : [selected]
      await invoke('import_files', { archiveRoot: archivePath, sourcePaths: paths })
      setRefreshToken((t) => t + 1)
    } catch (err) {
      window.alert(String(err))
    }
  }

  const handleImportZip = async () => {
    try {
      const selected = await open({
        multiple: false,
        title: 'Import ZIP',
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
      })
      if (!selected || typeof selected !== 'string') return
      await invoke('import_zip', { archiveRoot: archivePath, zipPath: selected })
      setRefreshToken((t) => t + 1)
    } catch (err) {
      window.alert(String(err))
    }
  }

  const commands: PaletteCommand[] = [
    { id: 'quick-switcher', label: 'Quick switcher: Jump to note', run: () => setQuickSwitcherOpen(true) },
    { id: 'new-note', label: 'New note', run: handleNewNote },
    { id: 'open-files', label: 'View: Files', run: () => setSidebarTab('files') },
    { id: 'open-tags', label: 'View: Tags', run: () => setSidebarTab('tags') },
    { id: 'open-search', label: 'View: Search', run: () => setSidebarTab('search') },
    { id: 'open-trash', label: 'View: Trash', run: () => setSidebarTab('trash') },
    { id: 'open-graph', label: 'Open graph view', run: () => setGraphOpen(true) },
    { id: 'open-settings', label: 'Open settings', run: () => setSettingsOpen(true) },
    { id: 'import-files', label: 'Import files...', run: handleImportFiles },
    { id: 'import-zip', label: 'Import ZIP...', run: handleImportZip },
    ...(activeFilePath
      ? [
          { id: 'duplicate-note', label: 'Duplicate note', run: handleDuplicateNote },
          { id: 'move-note', label: 'Move note to...', run: handleMoveNote },
          { id: 'copy-path', label: 'Copy note path', run: handleCopyPath },
          { id: 'export-markdown', label: 'Export as Markdown...', run: handleExportMarkdown },
        ]
      : []),
  ]

  return (
    <SettingsProvider archivePath={archivePath}>
      <main className="h-screen w-screen bg-ed-bg text-gray-100 flex flex-col font-sans">
        <div className="h-12 border-b border-ed-rule flex items-center gap-2 px-4 shrink-0 shadow-sm" data-tauri-drag-region>
          <img src={logoMark} alt="" className="h-5 w-5 select-none" draggable={false} />
          <div className="font-semibold text-sm tracking-wide text-white/80 select-none flex-1">
            SubmissionArchives Studio
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <SettingsIcon size={15} />
          </button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-64 border-r border-ed-rule shrink-0 bg-ed-bg/80 flex flex-col">
            <div className="flex border-b border-ed-rule shrink-0">
              {(['files', 'tags', 'search', 'trash'] as SidebarTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider capitalize transition-colors ${
                    sidebarTab === tab ? 'text-white bg-white/5' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-hidden">
              {sidebarTab === 'files' && (
                <ArchiveExplorer
                  archivePath={archivePath}
                  activeFilePath={activeFilePath}
                  onOpenFile={handleOpenFile}
                  onNewNote={handleNewNote}
                  onTrash={handleTrash}
                  refreshToken={refreshToken}
                />
              )}
              {sidebarTab === 'tags' && (
                <TagsPane archivePath={archivePath} onOpenFile={handleOpenFile} refreshToken={refreshToken} />
              )}
              {sidebarTab === 'search' && <SearchPane archivePath={archivePath} onOpenFile={handleOpenFile} />}
              {sidebarTab === 'trash' && (
                <TrashPane archivePath={archivePath} onRestore={handleOpenFile} refreshToken={refreshToken} />
              )}
            </div>
          </div>

          <div className="flex-1 relative">
            {!activeFilePath ? (
              <HomeDashboard archivePath={archivePath} onOpenFile={handleOpenFile} />
            ) : fileKindOf(activeFilePath) !== 'markdown' ? (
              <FileViewer filePath={activeFilePath} />
            ) : (
              <Editor
                archivePath={archivePath}
                filePath={activeFilePath}
                onWikiLinkNavigate={handleWikiLinkNavigate}
                onOpenFile={handleOpenFile}
                onDuplicate={handleDuplicateNote}
                onMove={handleMoveNote}
                onCopyPath={handleCopyPath}
                onExport={handleExportMarkdown}
              />
            )}
          </div>
        </div>

        {quickSwitcherOpen && (
          <QuickSwitcher archivePath={archivePath} onOpenFile={handleOpenFile} onClose={() => setQuickSwitcherOpen(false)} />
        )}
        {commandPaletteOpen && <CommandPalette commands={commands} onClose={() => setCommandPaletteOpen(false)} />}
        {graphOpen && (
          <GraphView archivePath={archivePath} onOpenFile={handleOpenFile} onClose={() => setGraphOpen(false)} />
        )}
        {settingsOpen && (
          <SettingsModal
            archivePath={archivePath}
            onChangeArchive={handleChangeArchive}
            onImportFiles={handleImportFiles}
            onImportZip={handleImportZip}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </main>
    </SettingsProvider>
  )
}

export default App
