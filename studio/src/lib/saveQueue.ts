const pending = new Map<string, Promise<unknown>>()
export function queueNoteWrite<T>(path: string, write: () => Promise<T>): Promise<T> {
 const previous = pending.get(path) ?? Promise.resolve()
 const next = previous.catch(() => {}).then(write)
 pending.set(path, next)
 void next.then(() => { if (pending.get(path) === next) pending.delete(path) }, () => {})
 return next
}
export async function flushNoteWrites() { await Promise.all([...pending.values()]) }

export type NoteDraft = { content: string; revision: number; owner: object }
const drafts = new Map<string, NoteDraft>()
const listeners = new Set<(path: string, draft: NoteDraft) => void>()
let revision = 0
export function publishNoteDraft(path: string, content: string, owner: object): NoteDraft {
 const draft = { content, owner, revision: ++revision }
 drafts.set(path, draft)
 for (const listener of listeners) listener(path, draft)
 return draft
}
export function getNoteDraft(path: string) { return drafts.get(path) }
export function acknowledgeNoteDraft(path: string, savedRevision: number): boolean {
 if (drafts.get(path)?.revision !== savedRevision) return false
 drafts.delete(path)
 return true
}
export function subscribeNoteDraft(listener: (path: string, draft: NoteDraft) => void) {
 listeners.add(listener)
 return () => { listeners.delete(listener) }
}
