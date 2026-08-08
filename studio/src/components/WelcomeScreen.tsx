import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { FolderOpen } from 'lucide-react'
import logoMark from '../assets/submission-archives-mark.png'

interface WelcomeScreenProps {
  onArchiveSelected: (path: string) => void
}

export default function WelcomeScreen({ onArchiveSelected }: WelcomeScreenProps) {
  const [error, setError] = useState<string | null>(null)

  const handleOpenArchive = async () => {
    setError(null)
    try {
      const path = await open({ directory: true, multiple: false, title: 'Choose your Archive folder' })
      if (typeof path === 'string') {
        onArchiveSelected(path)
      }
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="h-screen w-screen bg-ed-bg text-gray-100 flex flex-col items-center justify-center gap-6 font-sans">
      <img src={logoMark} alt="" className="h-16 w-16 select-none animate-fade-in-up" draggable={false} />
      <div className="text-center animate-fade-in-up [animation-delay:40ms]">
        <h1 className="text-2xl font-semibold text-white/90">SubmissionArchives Studio</h1>
        <p className="text-sm text-white/40 mt-2 max-w-md">
          A local-first knowledge base. Choose a folder on your hard drive to use as your Archive.
        </p>
      </div>
      <button
        onClick={handleOpenArchive}
        className="flex items-center gap-2 px-4 py-2.5 bg-ed-accent/10 hover:bg-ed-accent/20 border border-ed-accent/30 rounded-lg text-ed-accent text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up [animation-delay:80ms]"
      >
        <FolderOpen size={16} />
        Open Archive Folder
      </button>
      {error && <div className="text-xs text-red-400 font-mono max-w-md text-center animate-fade-in-up">{error}</div>}
    </div>
  )
}
