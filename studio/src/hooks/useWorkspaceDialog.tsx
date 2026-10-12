import { useEffect, useRef, useState } from 'react'
export function useWorkspaceDialog() {
 const [request, setRequest] = useState<{ title: string; input: boolean; resolve: (value: string | null) => void } | null>(null)
 const [message, setMessage] = useState('')
 const ref = useRef<HTMLDialogElement>(null)
 useEffect(() => {
  if (!request) return
  const previous = document.activeElement as HTMLElement | null
  ref.current?.showModal()
  return () => { ref.current?.close(); previous?.focus() }
 }, [request])
 function ask(title: string, input = true): Promise<string | null> {
  return new Promise(resolve => setRequest({ title, input, resolve }))
 }
 function finish(value: string | null) { request?.resolve(value); setRequest(null) }
 const dialogs = <>
  {message && <div role="status" className="fixed bottom-12 right-4 z-[100] max-w-md rounded border border-ed-rule bg-ed-surface p-4 text-ed-fg"><p>{message}</p><button onClick={() => setMessage('')}>Dismiss</button></div>}
  {request && <dialog ref={ref} aria-label={request.title} onCancel={e => { e.preventDefault(); finish(null) }} className="m-auto w-[min(90vw,28rem)] rounded-lg border border-ed-rule bg-ed-surface p-6 text-ed-fg backdrop:bg-black/60">
   <form onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); finish(request.input ? String(data.get('value')).trim() : 'confirm') }}>
    <h2 className="mb-4 text-lg">{request.title}</h2>
    {request.input && <input autoFocus name="value" aria-label={request.title} required maxLength={160} className="mb-4 w-full rounded border border-ed-rule bg-ed-bg p-2" />}
    <div className="flex gap-4"><button type="submit" className="rounded bg-ed-accent p-2 text-ed-bg">{request.input ? 'Create' : 'Confirm'}</button><button type="button" onClick={() => finish(null)}>Cancel</button></div>
   </form>
  </dialog>}
 </>
 return { ask, notify: setMessage, dialogs }
}
