import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Editor from './components/Editor'
import WelcomeScreen from './components/WelcomeScreen'
import ArchiveExplorer from './components/archive/ArchiveExplorer'
import { useArchive } from './hooks/useArchive'
import './App.css'

function App() {
  const { archivePath, setArchivePath } = useArchive()
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  if (!archivePath) {
    return <WelcomeScreen onArchiveSelected={setArchivePath} />
  }

  const handleWikiLinkNavigate = async (pageName: string) => {
    try {
      const path = await invoke<string>('resolve_wiki_link', { archiveRoot: archivePath, pageName })
      setActiveFilePath(path)
      setRefreshToken((t) => t + 1)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="h-screen w-screen bg-[#0f0f11] text-gray-100 flex flex-col font-sans">
      <div className="h-12 border-b border-white/10 flex items-center px-4 shrink-0 shadow-sm" data-tauri-drag-region>
        <div className="font-semibold text-sm tracking-wide text-white/80 select-none">SubmissionArchives Studio</div>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 border-r border-white/10 shrink-0 bg-[#0f0f11]/80">
          <ArchiveExplorer
            archivePath={archivePath}
            activeFilePath={activeFilePath}
            onOpenFile={setActiveFilePath}
            refreshToken={refreshToken}
          />
        </div>

        <div className="flex-1 relative">
          <Editor filePath={activeFilePath} onWikiLinkNavigate={handleWikiLinkNavigate} />
        </div>
      </div>
    </main>
  )
}

export default App
