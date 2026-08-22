/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from 'react'
import { safeInvoke as invoke } from './lib/ipc'
import { open, save } from '@tauri-apps/plugin-dialog'
import Editor, { type EditorMode } from './components/Editor'
import WelcomeScreen from './components/WelcomeScreen'
import HomeDashboard from './components/HomeDashboard'
import ExplorerPanel, { type SidebarTab } from './components/workspace/ExplorerPanel'
import QuickSwitcher from './components/QuickSwitcher'
import CommandPalette, { type PaletteCommand } from './components/CommandPalette'
import GraphView from './components/GraphView'
import FileViewer from './components/FileViewer'
import SettingsModal from './components/SettingsModal'
import WhatsNewModal from './components/WhatsNewModal'
import ImportWizardModal from './components/import/ImportWizardModal'
import CanvasView from './components/canvas/CanvasView'
import type { SplitPaneState } from './components/workspace/splitPaneState'
import WorkspaceLayout from './components/workspace/WorkspaceLayout'
import PaneSwitcher, { type PaneVisibility } from './components/workspace/PaneSwitcher'
import LeftRibbon from './components/LeftRibbon'
import TabHeader, { type TabItem } from './components/TabHeader'
import RightInspector, { type InspectorTab } from './components/RightInspector'
import StatusBar from './components/StatusBar'
import { useArchive } from './hooks/useArchive'
import { useTheme } from './hooks/useTheme'
import { useAppearance } from './hooks/useAppearance'
import { useTypography } from './hooks/useTypography'
import { useRecentNotes } from './hooks/useRecentNotes'
import { SettingsProvider, useSettings } from './hooks/useSettings'
import { useShortcuts } from './hooks/useShortcuts'
import { useWhatsNew } from './hooks/useWhatsNew'
import { fileKindOf } from './lib/fileTypes'
import { mediaBus } from './lib/mediaBus'
import logoMark from './assets/submission-archives-mark.png'
import { Gear as SettingsIcon, Moon, Sparkle, Sun } from '@phosphor-icons/react'
import './App.css'

function stemOf(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path
  return base
}

interface StudioWorkspaceProps {
  archivePath: string
  setArchivePath: (path: string | null) => void
}

function StudioWorkspace({ archivePath, setArchivePath }: StudioWorkspaceProps) {
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [openTabs, setOpenTabs] = useState<TabItem[]>([])
  const [historyStack, setHistoryStack] = useState<string[]>([])
  const [historyPointer, setHistoryPointer] = useState(-1)

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editorOpen, setEditorOpen] = useState(true)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files')
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('outline')
  const [editorMode, setEditorMode] = useState<EditorMode>('write')
  const [currentContent, setCurrentContent] = useState('')
  const [isSaved, setIsSaved] = useState(true)

  const [refreshToken, setRefreshToken] = useState(0)
  const [quickSwitcherOpen, setQuickSwitcherOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [graphOpen, setGraphOpen] = useState(false)
  const [canvasOpen, setCanvasOpen] = useState(false)
  const [splitState, setSplitState] = useState<SplitPaneState | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [importWizardOpen, setImportWizardOpen] = useState(false)
  const { recordOpen } = useRecentNotes(archivePath)
  const whatsNew = useWhatsNew()
  const appearance = useAppearance()
  const { settings } = useSettings()

  useTypography(settings.typography)
  useTheme(archivePath)

  /* The editor is the pane that has to survive: hiding it is only meaningful
     while something else is on screen to read, so turning off the last visible
     pane turns the editor back on rather than leaving an empty workspace. */
  const setPaneVisible = useCallback((pane: keyof PaneVisibility, visible: boolean) => {
    if (pane === 'explorer') {
      setSidebarOpen(visible)
      if (!visible) setEditorOpen(true)
      return
    }
    if (pane === 'inspector') {
      setInspectorOpen(visible)
      if (!visible) setEditorOpen(true)
      return
    }
    setEditorOpen(visible || (!sidebarOpen && !inspectorOpen))
  }, [inspectorOpen, sidebarOpen])

  /* Media Notes needs roughly 440px to seat a player, a chapter rail and a
     legible transcript, where the text tabs are comfortable at 280px. The panel
     asks for the extra width; the drag handle still overrides it. */
  const openMediaNotes = useCallback(() => {
    setInspectorTab('media')
    setInspectorOpen(true)
    setEditorOpen(true)
  }, [])

  useEffect(() => mediaBus.on('reveal_panel', openMediaNotes), [openMediaNotes])

  const handleOpenFile = useCallback(
    (path: string) => {
      if (!path || typeof path !== 'string') return
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
    if (splitState && (splitState.firstPane === path || splitState.secondPane === path)) {
      setSplitState(null)
    }
  }

  const handleToggleSplit = () => {
    if (splitState) {
      setSplitState(null)
    } else {
      const otherTab = openTabs.find((t) => t.path !== activeFilePath)
      setSplitState({
        id: 'split-1',
        direction: 'vertical',
        splitRatio: 0.5,
        firstPane: activeFilePath,
        secondPane: otherTab ? otherTab.path : activeFilePath,
      })
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

  const handleExportPackage = async () => {
    if (!activeFilePath) return
    try {
      const defaultName = (activeFilePath.split(/[\\/]/).pop() ?? 'note').replace(/\.md$/, '.sanote')
      const destination = await save({
        defaultPath: defaultName,
        filters: [{ name: 'Studio Note Package', extensions: ['sanote'] }],
      })
      if (!destination) return
      await invoke('export_sanote', {
        archiveRoot: archivePath,
        notePath: activeFilePath,
        destinationPath: destination,
      })
      window.alert('Note exported as .sanote package!')
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

  // Register Global Keybindings via central hook
  useShortcuts({
    'app.quick-switcher': () => setQuickSwitcherOpen(true),
    'app.command-palette': () => setCommandPaletteOpen(true),
    'view.toggle-sidebar': () => setPaneVisible('explorer', !sidebarOpen),
    'view.toggle-inspector': () => setPaneVisible('inspector', !inspectorOpen),
    'view.toggle-editor': () => setPaneVisible('editor', !editorOpen),
    'view.toggle-appearance': appearance.toggle,
    'vault.new-note': handleNewNote,
    'editor.cycle-mode': () => setEditorMode((m) => (m === 'write' ? 'blocks' : m === 'blocks' ? 'page' : 'write')),
    'view.open-graph': () => setGraphOpen(true),
    'view.open-canvas': () => setCanvasOpen(true),
    'view.toggle-split': handleToggleSplit,
    'view.open-settings': () => setSettingsOpen(true),
    'media.open-panel': openMediaNotes,
  })

  const commands: PaletteCommand[] = [
    { id: 'quick-switcher', label: 'Quick switcher: Jump to note', run: () => setQuickSwitcherOpen(true) },
    { id: 'new-note', label: 'New note', run: handleNewNote },
    { id: 'toggle-sidebar', label: 'Toggle Sidebar Explorer', run: () => setPaneVisible('explorer', !sidebarOpen) },
    { id: 'toggle-inspector', label: 'Toggle Inspector (Outline & Backlinks)', run: () => setPaneVisible('inspector', !inspectorOpen) },
    { id: 'toggle-editor', label: 'Toggle Editor pane', run: () => setPaneVisible('editor', !editorOpen) },
    { id: 'toggle-appearance', label: `Appearance: switch to ${appearance.resolved === 'dark' ? 'light' : 'dark'}`, run: appearance.toggle },
    { id: 'open-files', label: 'View: Files', run: () => { setSidebarTab('files'); setSidebarOpen(true) } },
    { id: 'open-tags', label: 'View: Tags', run: () => { setSidebarTab('tags'); setSidebarOpen(true) } },
    { id: 'open-search', label: 'View: Search', run: () => { setSidebarTab('search'); setSidebarOpen(true) } },
    { id: 'open-trash', label: 'View: Trash', run: () => { setSidebarTab('trash'); setSidebarOpen(true) } },
    { id: 'open-graph', label: 'Open graph view', run: () => setGraphOpen(true) },
    { id: 'open-canvas', label: 'View: Visual Synthesis Canvas', run: () => setCanvasOpen(true) },
    { id: 'toggle-split', label: 'View: Split Pane Right', run: handleToggleSplit },
    { id: 'open-settings', label: 'Open vault settings', run: () => setSettingsOpen(true) },
    { id: 'open-media-notes', label: 'View: Media Notes (watch & cite lectures)', run: openMediaNotes },
    { id: 'whats-new', label: "Help: What's New", run: () => whatsNew.open() },
    { id: 'import-wizard', label: 'Import: Launch Universal Import Wizard', run: () => setImportWizardOpen(true) },
    { id: 'import-files', label: 'Import individual files...', run: handleImportFiles },
    { id: 'import-zip', label: 'Import ZIP archive...', run: handleImportZip },
    ...(activeFilePath
      ? [
          { id: 'duplicate-note', label: 'Duplicate note', run: handleDuplicateNote },
          { id: 'move-note', label: 'Move note to...', run: handleMoveNote },
          { id: 'copy-path', label: 'Copy note path', run: handleCopyPath },
          { id: 'export-markdown', label: 'Export as Markdown...', run: handleExportMarkdown },
          { id: 'export-sanote', label: 'Export as Studio Package (.sanote)...', run: handleExportPackage },
        ]
      : []),
  ]

  const wordCount = currentContent ? currentContent.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = currentContent ? currentContent.length : 0

  const renderEditorPane = (path: string | null) => {
    if (!path) {
      return <HomeDashboard archivePath={archivePath} onOpenFile={handleOpenFile} />
    }
    if (fileKindOf(path) !== 'markdown') {
      return <FileViewer filePath={path} />
    }
    return (
      <Editor
        archivePath={archivePath}
        filePath={path}
        onWikiLinkNavigate={handleWikiLinkNavigate}
        onOpenFile={handleOpenFile}
        onDuplicate={handleDuplicateNote}
        onMove={handleMoveNote}
        onCopyPath={handleCopyPath}
        onExport={handleExportMarkdown}
        onExportPackage={handleExportPackage}
        mode={editorMode}
        onModeChange={setEditorMode}
        onContentChange={setCurrentContent}
        onStatusChange={setIsSaved}
      />
    )
  }

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-ed-bg font-sans text-ed-fg">
      {/* Title bar */}
      <header
        className="relative z-50 flex h-10 shrink-0 select-none items-center gap-3 border-b border-ed-rule bg-ed-bg-secondary px-3"
        data-tauri-drag-region
      >
        <img src={logoMark} alt="" className="h-4 w-4" draggable={false} />
        <div className="flex-1 truncate text-xs font-medium tracking-tight text-ed-fg" data-tauri-drag-region>
          SubmissionArchives Studio
        </div>

        <PaneSwitcher
          visibility={{ explorer: sidebarOpen, editor: editorOpen, inspector: inspectorOpen }}
          onChange={setPaneVisible}
        />

        <button
          onClick={appearance.toggle}
          title={appearance.resolved === 'dark' ? 'Switch to paper (Ctrl+Shift+D)' : 'Switch to obsidian (Ctrl+Shift+D)'}
          aria-label="Toggle light and dark theme"
          className="tactile rounded-sm p-1.5 text-ed-fg-muted hover:bg-ed-surface hover:text-ed-fg"
        >
          {appearance.resolved === 'dark' ? <Sun size={16} weight="regular" /> : <Moon size={16} weight="regular" />}
        </button>

        <button
          onClick={() => whatsNew.open()}
          title="What's New"
          aria-label="What's New"
          className="tactile rounded-sm p-1.5 text-ed-fg-muted hover:bg-ed-surface hover:text-ed-accent"
        >
          <Sparkle size={16} weight="regular" />
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          title="Settings"
          aria-label="Settings"
          className="tactile rounded-sm p-1.5 text-ed-fg-muted hover:bg-ed-surface hover:text-ed-fg"
        >
          <SettingsIcon size={16} weight="regular" />
        </button>
      </header>

      <WorkspaceLayout
        layoutKey={archivePath}
        explorerOpen={sidebarOpen}
        editorOpen={editorOpen}
        inspectorOpen={inspectorOpen}
        inspectorWide={inspectorTab === 'media'}
        splitState={splitState}
        activeFilePath={activeFilePath}
        renderPane={renderEditorPane}
        ribbon={
          <LeftRibbon
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setPaneVisible('explorer', !sidebarOpen)}
            onOpenSearch={() => {
              setSidebarTab('search')
              setPaneVisible('explorer', true)
            }}
            onOpenQuickSwitcher={() => setQuickSwitcherOpen(true)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            onOpenGraph={() => setGraphOpen(true)}
            onOpenCanvas={() => setCanvasOpen(true)}
            onOpenMediaNotes={openMediaNotes}
            mediaNotesOpen={inspectorOpen && inspectorTab === 'media'}
            onOpenSettings={() => setSettingsOpen(true)}
            inspectorOpen={inspectorOpen}
            onToggleInspector={() => setPaneVisible('inspector', !inspectorOpen)}
            onNewNote={handleNewNote}
          />
        }
        explorer={
          <ExplorerPanel
            archivePath={archivePath}
            activeFilePath={activeFilePath}
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            onOpenFile={handleOpenFile}
            onNewNote={handleNewNote}
            onTrash={handleTrash}
            refreshToken={refreshToken}
          />
        }
        inspector={
          <RightInspector
            archivePath={archivePath}
            filePath={activeFilePath}
            content={currentContent}
            activeTab={inspectorTab}
            onTabChange={setInspectorTab}
            onOpenFile={handleOpenFile}
            onClose={() => setPaneVisible('inspector', false)}
          />
        }
        tabHeader={
          openTabs.length > 0 ? (
            <TabHeader
              tabs={openTabs}
              activeFilePath={activeFilePath}
              archivePath={archivePath}
              isSplit={Boolean(splitState)}
              onSelectTab={setActiveFilePath}
              onCloseTab={handleCloseTab}
              onNewTab={handleNewNote}
              onToggleSplit={handleToggleSplit}
              canGoBack={historyPointer > 0}
              canGoForward={historyPointer < historyStack.length - 1}
              onGoBack={handleGoBack}
              onGoForward={handleGoForward}
            />
          ) : null
        }
        statusBar={
          activeFilePath && fileKindOf(activeFilePath) === 'markdown' ? (
            <StatusBar
              wordCount={wordCount}
              charCount={charCount}
              backlinksCount={0}
              editorMode={editorMode}
              onModeChange={setEditorMode}
              isSaved={isSaved}
            />
          ) : null
        }
      />

      {/* Modals */}
      {quickSwitcherOpen && (
        <QuickSwitcher archivePath={archivePath} onOpenFile={handleOpenFile} onClose={() => setQuickSwitcherOpen(false)} />
      )}
      {commandPaletteOpen && <CommandPalette commands={commands} onClose={() => setCommandPaletteOpen(false)} />}
      {graphOpen && (
        <GraphView archivePath={archivePath} onOpenFile={handleOpenFile} onClose={() => setGraphOpen(false)} />
      )}
      {canvasOpen && (
        <CanvasView
          archivePath={archivePath}
          onOpenFile={handleOpenFile}
          onClose={() => setCanvasOpen(false)}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          archivePath={archivePath}
          onChangeArchive={handleChangeArchive}
          onImportFiles={handleImportFiles}
          onImportZip={handleImportZip}
          onOpenImportWizard={() => setImportWizardOpen(true)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {whatsNew.isOpen && (
        <WhatsNewModal
          releases={whatsNew.releases}
          onClose={whatsNew.dismiss}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}
      {importWizardOpen && (
        <ImportWizardModal
          archivePath={archivePath}
          onImportCompleted={(paths) => {
            setRefreshToken((t) => t + 1)
            if (paths.length > 0) {
              handleOpenFile(paths[0])
            }
          }}
          onClose={() => setImportWizardOpen(false)}
        />
      )}
    </main>
  )
}

function App() {
  const { archivePath, setArchivePath, recentArchives } = useArchive()

  if (!archivePath) {
    return <WelcomeScreen onArchiveSelected={setArchivePath} recentArchives={recentArchives} />
  }

  return (
    <SettingsProvider archivePath={archivePath}>
      <StudioWorkspace archivePath={archivePath} setArchivePath={setArchivePath} />
    </SettingsProvider>
  )
}

export default App
