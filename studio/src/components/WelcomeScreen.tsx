/* eslint-disable @next/next/no-img-element */
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
    <div className="h-screen w-screen bg-ed-bg text-ed-fg flex flex-col items-center justify-center gap-6 font-sans relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(107, 52, 16, 0.06) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-md px-6">
        <img
          src={logoMark}
          alt=""
          className="h-16 w-16 select-none animate-fade-in-up opacity-90"
          draggable={false}
        />

        <div className="text-center animate-fade-in-up [animation-delay:60ms]">
          <h1 className="text-2xl font-semibold text-white/90 tracking-tight">
            SubmissionArchives Studio
          </h1>
          <p className="text-sm text-white/35 mt-2 leading-relaxed">
            A local-first knowledge base. Choose a folder on your hard drive to use as your Archive.
          </p>
        </div>

        <button
          onClick={handleOpenArchive}
          className="tactile flex items-center gap-2.5 px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.14] rounded-xl text-white/80 text-sm font-medium transition-all duration-200 shadow-elev-sm hover:shadow-elev-md animate-fade-in-up [animation-delay:120ms] group"
        >
          <FolderOpen size={16} className="text-white/40 group-hover:text-white/60 transition-colors" strokeWidth={1.5} />
          <span>Open Archive Folder</span>
        </button>

        {error && (
          <div className="text-[11px] text-red-400/90 font-mono bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 animate-fade-in-up">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
