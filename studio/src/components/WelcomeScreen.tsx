import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { FolderOpen } from '@phosphor-icons/react'
import logoMark from '../assets/submission-archives-mark.png'
import { motion, springSnappy } from './ui/Motion'

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
    <div className="h-screen w-screen bg-ed-bg text-ed-fg flex flex-col items-center justify-center gap-6 font-sans relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(107, 52, 16, 0.08) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md px-6">
        <img
          src={logoMark}
          alt=""
          className="h-16 w-16 select-none opacity-90"
          draggable={false}
        />

        <div className="text-center">
          <h1 className="text-2xl font-bold text-ed-fg tracking-tight">
            SubmissionArchives Studio
          </h1>
          <p className="text-xs text-ed-fg-muted mt-2 leading-relaxed font-medium">
            Offline scholarly Quran research & writing suite. Select a local folder as your Archive.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.96 }}
          transition={springSnappy}
          onClick={handleOpenArchive}
          className="flex items-center gap-2.5 px-5 py-2.5 bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule rounded-xl text-ed-fg text-xs font-semibold shadow-elev-sm transition-colors group"
        >
          <FolderOpen size={18} weight="bold" className="text-amber-400" />
          <span>Open Archive Folder</span>
        </motion.button>

        {error && (
          <div className="text-[11px] text-red-400 font-mono bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
