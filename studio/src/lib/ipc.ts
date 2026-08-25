import { invoke } from '@tauri-apps/api/core'
import { searchVersesCanonical } from './quranData'

export const isTauriEnvironment = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

// In-memory / localStorage mock store for web preview mode
const MOCK_STORAGE_KEY = 'sa-studio-web-mock-notes'

const DEFAULT_MOCK_NOTES: Record<string, string> = {
  'c:\\vault\\welcome.md': `# Welcome to SubmissionArchives Studio

Welcome to your offline scholarly Quran research and note-taking workspace.

### Key Capabilities
- **Academic Transliteration:** Automatically expands terms like \`Quran\` to \`Qur'ān\`, \`Hadith\` to \`Ḥadīth\`, and diacritics like \`a=\` to \`ā\`.
- **Phonetic Quran Verse Embedding:** Type \`/quran Baqarah 255\` or \`/quran Kahf 1-10\`.
- **Multi-Pane Workspaces:** Split notes side-by-side with \`Ctrl+\\\`.
- **Visual Whiteboard Canvas:** Conceptualize ideas and Arabic grammar (*I‘rāb*) trees.

---
[[Ayat al-Kursi Exegesis]] | [[Surah Al-Kahf Study]]`,
  'c:\\vault\\Ayat al-Kursi Exegesis.md': `# Ayat al-Kursi Exegesis (2:255)

The Verse of the Throne represents the pinnacle of theological monotheism (*Tawhid*) in the Quranic corpus.

> "GOD: there is no god except He, the Living, the Eternal."
> — *Surah Al-Baqarah, Verse 255*

### Syntactic Breakdown
- **Allāhu:** *Mubtada'* (Subject) in the nominative case.
- **Lā ilāha illā Huwa:** Negative particle of absolute category (*Lā an-Nāfiyah lil-Jins*) followed by the exception particle (*Illā*).`,
  'c:\\vault\\Surah Al-Kahf Study.md': `# Surah Al-Kahf Study (18:1-10)

The narrative structure of the Companions of the Cave (*Ashāb al-Kahf*).

### Major Themes
1. Trial of Faith (*Fitnat ad-Dīn*)
2. Trial of Wealth (*Fitnat al-Māl*)
3. Trial of Knowledge (*Fitnat al-‘Ilm*)
4. Trial of Power (*Fitnat as-Sultān*)`,
}

function getMockNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return DEFAULT_MOCK_NOTES
}

function saveMockNotes(notes: Record<string, string>) {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(notes))
  } catch {}
}

export async function safeInvoke<T>(cmd: string, args: Record<string, unknown> = {}): Promise<T> {
  if (isTauriEnvironment()) {
    return invoke<T>(cmd, args)
  }

  // Web Browser Fallback Mock Implementation
  console.info(`[Web IPC Mock] ${cmd}`, args)
  const notes = getMockNotes()

  switch (cmd) {
    case 'scan_archive': {
      const records = Object.entries(notes).map(([path, content]) => {
        const name = path.split(/[\\/]/).pop()?.replace(/\.md$/, '') ?? 'Note'
        const links: string[] = []
        const re = /\[\[(.*?)\]\]/g
        let match
        while ((match = re.exec(content)) !== null) {
          links.push(match[1])
        }
        return {
          path,
          name,
          content,
          tags: ['study', 'quran'],
          links,
        }
      })
      return records as T
    }

    case 'list_directory': {
      const entries = Object.keys(notes).map((path) => {
        const name = path.split(/[\\/]/).pop() ?? 'file.md'
        return {
          name,
          path,
          is_dir: false,
          is_hidden: false,
          ext: 'md',
        }
      })
      return entries as T
    }

    case 'read_note': {
      const path = (args.path as string) || ''
      const content = notes[path] || DEFAULT_MOCK_NOTES[path] || '# Untitled Note\n\nWrite your thoughts here...'
      return content as T
    }

    case 'write_note': {
      const path = (args.path as string) || `c:\\vault\\note-${Date.now()}.md`
      const content = (args.content as string) || ''
      notes[path] = content
      saveMockNotes(notes)
      return undefined as T
    }

    case 'create_note': {
      const name = (args.name as string) || 'New Note'
      const path = `c:\\vault\\${name}.md`
      notes[path] = `# ${name}\n\n`
      saveMockNotes(notes)
      return path as T
    }

    case 'resolve_wiki_link': {
      const pageName = (args.pageName as string) || ''
      const matched = Object.keys(notes).find((p) => {
        const name = p.split(/[\\/]/).pop()?.replace(/\.md$/, '')
        return name?.toLowerCase() === pageName.toLowerCase()
      })
      if (matched) return matched as T
      const newPath = `c:\\vault\\${pageName}.md`
      notes[newPath] = `# ${pageName}\n\n`
      saveMockNotes(notes)
      return newPath as T
    }

    case 'search_verses': {
      const q = (args.query as string) || '1:1'
      const verses = searchVersesCanonical(q)
      return verses as T
    }

    case 'read_settings': {
      return localStorage.getItem('sa-studio-settings') as T
    }

    case 'write_settings': {
      const json = (args.json as string) || '{}'
      localStorage.setItem('sa-studio-settings', json)
      return undefined as T
    }

    case 'read_theme_css': {
      return null as T
    }

    case 'read_folder_icons': {
      return {} as T
    }

    case 'list_trash': {
      return [] as T
    }

    /* The research corpus is bundled into the Rust binary with include_str!,
       so there is nothing for the browser preview to read. Failing by name
       beats returning null and letting the surface crash on a missing field. */
    case 'qc_metadata':
    case 'qc_get_verse':
    case 'qc_count':
    case 'qc_letter_frequency':
    case 'qc_compute_value':
    case 'qc_find_text':
    case 'qc_similarity':
    case 'qc_find_by_number':
    case 'qc_word_info':
    case 'qc_roots':
    case 'qc_get_chapter':
    case 'qc_value_of_text':
      throw new Error(
        `${cmd} needs the desktop build: the QuranCode corpus is bundled into the Tauri binary.`
      )

    default:
      return null as T
  }
}
