import { useEffect, useState } from 'react'
import { useSettings } from './useSettings'
import releases from '../assets/release_notes.json'

export interface ReleaseCategoryItem {
  title: string
  description: string
}

export interface ReleaseCategory {
  name: string
  badgeColor: 'amber' | 'sky' | 'emerald' | 'rose'
  items: ReleaseCategoryItem[]
}

export interface ReleaseNote {
  version: string
  releaseDate: string
  headline: string
  summary: string
  categories: ReleaseCategory[]
}

export const LATEST_VERSION = '0.2.0'

export function useWhatsNew() {
  const { settings, updateSettings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // If user has not seen the latest version yet, trigger modal
    if (settings.lastSeenVersion && settings.lastSeenVersion !== LATEST_VERSION) {
      setIsOpen(true)
    }
  }, [settings.lastSeenVersion])

  const dismiss = () => {
    setIsOpen(false)
    updateSettings((s) => ({ ...s, lastSeenVersion: LATEST_VERSION }))
  }

  return {
    isOpen,
    open: () => setIsOpen(true),
    dismiss,
    releases: releases as ReleaseNote[],
    latestVersion: LATEST_VERSION,
  }
}
