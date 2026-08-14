import { Extension, textInputRule } from '@tiptap/core'

export interface AcademicTransliterationOptions {
  enabled?: boolean
  autoExpandTerms?: boolean
  diacriticModifiers?: boolean
}

const TERM_MAP: Record<string, string> = {
  quran: "Qur'ān",
  hadith: "Ḥadīth",
  surah: "Sūrah",
  surat: "Sūrat",
  tawhid: "Tawḥīd",
  tawheed: "Tawḥīd",
  sunnah: "Sunnah",
  shariah: "Sharīʿah",
  sharia: "Sharīʿah",
  kaaba: "Kaʿbah",
  kabah: "Kaʿbah",
  isnad: "Isnād",
  matn: "Matn",
  fiqh: "Fiqh",
  usul: "Uṣūl",
  sahih: "Ṣaḥīḥ",
  daif: "Ḍaʿīf",
  hasan: "Ḥasan",
  ayah: "Āyah",
  ayat: "Āyāt",
  tafsir: "Tafsīr",
  iman: "Īmān",
  salah: "Ṣalāh",
  zakah: "Zakāh",
  ramadan: "Ramaḍān",
}

export const AcademicTransliteration = Extension.create<AcademicTransliterationOptions>({
  name: 'academicTransliteration',

  addOptions() {
    return {
      enabled: true,
      autoExpandTerms: true,
      diacriticModifiers: true,
    }
  },

  addInputRules() {
    if (this.options.enabled === false) return []

    const rules = []

    if (this.options.autoExpandTerms !== false) {
      for (const [term, replacement] of Object.entries(TERM_MAP)) {
        // Matches word boundary followed by the term and trailing space
        const pattern = new RegExp(`\\b${term}\\s$`, 'i')
        rules.push(
          textInputRule({
            find: pattern,
            replace: `${replacement} `,
          })
        )
      }
    }

    if (this.options.diacriticModifiers !== false) {
      const modifiers: [RegExp, string][] = [
        [/a=$/, 'ā'],
        [/A=$/, 'Ā'],
        [/i=$/, 'ī'],
        [/I=$/, 'Ī'],
        [/u=$/, 'ū'],
        [/U=$/, 'Ū'],
        [/h\.$/, 'ḥ'],
        [/H\.$/, 'Ḥ'],
        [/s\.$/, 'ṣ'],
        [/S\.$/, 'Ṣ'],
        [/d\.$/, 'ḍ'],
        [/D\.$/, 'Ḍ'],
        [/t\.$/, 'ṭ'],
        [/T\.$/, 'Ṭ'],
        [/z\.$/, 'ẓ'],
        [/Z\.$/, 'Ẓ'],
        [/dh\.$/, 'ḏ'],
        [/DH\.$/, 'Ḏ'],
        [/gh\.$/, 'ġ'],
        [/GH\.$/, 'Ġ'],
        [/kh\.$/, 'ḫ'],
        [/KH\.$/, 'Ḫ'],
        [/th\.$/, 'ṯ'],
        [/TH\.$/, 'Ṯ'],
      ]

      for (const [pattern, char] of modifiers) {
        rules.push(
          textInputRule({
            find: pattern,
            replace: char,
          })
        )
      }
    }

    return rules
  },
})
