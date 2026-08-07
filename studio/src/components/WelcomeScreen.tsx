import { open } from '@tauri-apps/plugin-dialog'
import { FolderOpen } from 'lucide-react'

interface WelcomeScreenProps {
  onArchiveSelected: (path: string) => void
}

export default function WelcomeScreen({ onArchiveSelected }: WelcomeScreenProps) {
  const handleOpenArchive = async () => {
    const path = await open({ directory: true, multiple: false, title: 'Choose your Archive folder' })
    if (typeof path === 'string') {
      onArchiveSelected(path)
    }
  }

  return (
    <div className="h-screen w-screen bg-[#0f0f11] text-gray-100 flex flex-col items-center justify-center gap-6 font-sans">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-2xl font-semibold text-white/90">SubmissionArchives Studio</h1>
        <p className="text-sm text-white/40 mt-2 max-w-md">
          A local-first knowledge base. Choose a folder on your hard drive to use as your Archive.
        </p>
      </div>
      <button
        onClick={handleOpenArchive}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up [animation-delay:80ms]"
      >
        <FolderOpen size={16} />
        Open Archive Folder
      </button>
    </div>
  )
}
