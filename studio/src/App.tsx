/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import Editor, { type EditorMode } from './components/Editor'
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
import LeftRibbon from './components/LeftRibbon'
import TabHeader, { type TabItem } from './components/TabHeader'
import RightInspector from './components/RightInspector'
import StatusBar from './components/StatusBar'
import { useArchive } from './hooks/useArchive'
import { useTheme } from './hooks/useTheme'
import { useRecentNotes } from './hooks/useRecentNotes'
import { SettingsProvider } from './hooks/useSettings'
import { fileKindOf } from './lib/fileTypes'
import logoMark from './assets/submission-archives-mark.png'
import { Settings as SettingsIcon } from 'lucide-react'
import './App.css'

type SidebarTab = 'files' | 'tags' | 'search' | 'trash'

const TAB_LABELS: Record<SidebarTab, string> = {
  files: 'Files',
  tags: 'Tags',
  search: 'Search',
  trash: 'Trash',
}

function stemOf(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path
  return base
}

function App() {
  const { archivePath, setArchivePath } = useArchive()
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<TabItem[]>([])
  const [historyStack, setHistoryStack] = useState<string[]>([])
  const [historyPointer, setHistoryPointer] = useState(-1)
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files')
  const [editorMode, setEditorMode] = useState<EditorMode>('write')
  const [currentContent, setCurrentContent] = useState('')
  const [isSaved, setIsSaved] = useState(true)

  const [refreshToken, setRefreshToken] = useState(0)
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { recordOpen } = useRecentNotes(archivePath ?? '')

  useTheme(archivePath)

  const handleOpenFile = useCallback(
    (path: string) => {
      recordOpen(path)
      setActiveFilePath(path)

      // Add to tabs if not present
      setOpenTabs((prev) => {
        if (prev.some((t) => t.path === path)) return prev
        return [...prev, { path, name: stemOf(path) }]
      })

      // Add to history stack
      setHistoryStack((prev) => {
        const next = prev.slice(0, historyPointer + 1)
        if (next[next.length - 1] === path) return prev
        return [...next, path]
      })
      setHistoryPointer((prev) => prev + 1)
    },
    [historyPointer, recordOpen]
  )

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextTabs = openTabs.filter((t) => t.path !== path)
    setOpenTabs(nextTabs)
    if (activeFilePath === path) {
      if (nextTabs.length > 0) {
        setActiveFilePath(nextTabs[nextTabs.length - 1].path)
      } else {
        setActiveFilePath(null)
      }
    }
  }

  const handleGoBack = () => {
    if (historyPointer > 0) {
      const prevPath = historyStack[historyPointer - 1]
      setHistoryPointer((p) => p - 1)
      setActiveFilePath(prevPath)
    }
  }

  const handleGoForward = () => {
    if (historyPointer < historyStack.length - 1) {
      const nextPath = historyStack[historyPointer + 1]
      setHistoryPointer((p) => p + 1)
      setActiveFilePath(nextPath)
    }
  }

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
      } else if (e.key === 'b') {
        e.preventDefault()
        setSidebarOpen((s) => !s)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [archivePath])

  if (!archivePath) {
    return <WelcomeScreen onArchiveSelected={setArchivePath} />
  }

  const handleChangeArchive = async () => {
    const path = await open({ directory: true, multiple: false, title: 'Choose your Archive folder' })
    if (typeof path === 'string') {
      setArchivePath(path)
      setActiveFilePath(null)
      setOpenTabs([])
      setHistoryStack([])
      setHistoryPointer(-1)
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
      setOpenTabs((prev) => prev.filter((t) => t.path !== path))
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
    { id: 'toggle-sidebar', label: 'Toggle Sidebar Explorer', run: () => setSidebarOpen((s) => !s) },
    { id: 'toggle-inspector', label: 'Toggle Inspector (Outline & Backlinks)', run: () => setInspectorOpen((i) => !i) },
    { id: 'open-files', label: 'View: Files', run: () => { setSidebarTab('files'); setSidebarOpen(true) } },
    { id: 'open-tags', label: 'View: Tags', run: () => { setSidebarTab('tags'); setSidebarOpen(true) } },
    { id: 'open-search', label: 'View: Search', run: () => { setSidebarTab('search'); setSidebarOpen(true) } },
    { id: 'open-trash', label: 'View: Trash', run: () => { setSidebarTab('trash'); setSidebarOpen(true) } },
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

  const wordCount = currentContent ? currentContent.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = currentContent ? currentContent.length : 0

  return (
    <SettingsProvider archivePath={archivePath}>
      <main className="h-screen w-screen bg-ed-bg text-ed-fg flex flex-col font-sans overflow-hidden">
        {/* Title Bar — Glassmorphism with subtle bottom glow */}
        <div
          className="h-11 shrink-0 glass border-b border-ed-rule flex items-center gap-3 px-4 relative z-50 select-none"
          data-tauri-drag-region
        >
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent pointer-events-none" />
          <img src={logoMark} alt="" className="h-5 w-5 opacity-90" draggable={false} />
          <div className="font-semibold text-xs tracking-tight text-white/80 flex-1" data-tauri-drag-region>
            SubmissionArchives Studio
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            className="tactile p-1.5 rounded-md text-white/35 hover:text-white/80 hover:bg-white/[0.06]"
          >
            <SettingsIcon size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Far Left Vertical Ribbon (Obsidian style) */}
          <LeftRibbon
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((s) => !s)}
            onOpenSearch={() => { setSidebarTab('search'); setSidebarOpen(true) }}
            onOpenQuickSwitcher={() => setQuickSwitcherOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenGraph={() => setGraphOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            inspectorOpen={inspectorOpen}
            onToggleInspector={() => setInspectorOpen((i) => !i)}
            onNewNote={handleNewNote}
          />

          {/* Collapsible Left Sidebar (Archive Explorer) */}
          {sidebarOpen && (
            <div className="w-[250px] shrink-0 border-r border-ed-rule flex flex-col bg-ed-bg/60 z-30 animate-fade-in">
              <div className="flex border-b border-ed-rule shrink-0 bg-ed-surface/40 backdrop-blur-xl">
                {(['files', 'tags', 'search', 'trash'] as SidebarTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`relative flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 tactile ${
                      sidebarTab === tab
                        ? 'text-white'
                        : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    {sidebarTab === tab && (
                      <span className="absolute inset-x-1 bottom-0.5 h-0.5 rounded-full bg-white/80 transition-all duration-300" />
                    )}
                    {TAB_LABELS[tab]}
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
          )}

          {/* Main Workspace Center Area (Tabs + Editor + Status Bar) */}
          <div className="flex-1 flex flex-col min-w-0 bg-ed-bg relative">
            {/* Top Tab Bar & Breadcrumbs */}
            {openTabs.length > 0 && (
              <TabHeader
                tabs={openTabs}
                activeFilePath={activeFilePath}
                archivePath={archivePath}
                onSelectTab={setActiveFilePath}
                onCloseTab={handleCloseTab}
                onNewTab={handleNewNote}
                canGoBack={historyPointer > 0}
                canGoForward={historyPointer < historyStack.length - 1}
                onGoBack={handleGoBack}
                onGoForward={handleGoForward}
              />
            )}

            {/* Editor or Viewer Body */}
            <div className="flex-1 overflow-hidden relative">
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
                  mode={editorMode}
                  onModeChange={setEditorMode}
                  onContentChange={setCurrentContent}
                  onStatusChange={setIsSaved}
                />
              )}
            </div>

            {/* Bottom Status Bar */}
            {activeFilePath && fileKindOf(activeFilePath) === 'markdown' && (
              <StatusBar
                wordCount={wordCount}
                charCount={charCount}
                backlinksCount={0}
                editorMode={editorMode}
                onModeChange={setEditorMode}
                isSaved={isSaved}
              />
            )}
          </div>

          {/* Collapsible Far Right Inspector (Outline & Backlinks) */}
          {inspectorOpen && (
            <RightInspector
              archivePath={archivePath}
              filePath={activeFilePath}
              content={currentContent}
              onOpenFile={handleOpenFile}
              onClose={() => setInspectorOpen(false)}
            />
          )}
        </div>

        {/* Modals */}
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
