import yaml from 'js-yaml'

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

export interface ParsedNote {
  data: Record<string, unknown>
  content: string
}

export function parseFrontmatter(raw: string): ParsedNote {
  const match = FRONTMATTER_PATTERN.exec(raw)
  if (!match) {
    return { data: {}, content: raw }
  }

  try {
    const parsed = yaml.load(match[1])
    const data = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    return { data, content: raw.slice(match[0].length) }
  } catch {
    return { data: {}, content: raw }
  }
}

export function stringifyWithFrontmatter(content: string, data: Record<string, unknown>): string {
  if (Object.keys(data).length === 0) return content
  return `---\n${yaml.dump(data).trimEnd()}\n---\n${content}`
}
