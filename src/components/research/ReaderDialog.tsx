"use client";
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
export default function ReaderDialog({ children, onClose, label, returnFocusRef }: { children: ReactNode; onClose: () => void; label: string; returnFocusRef?: RefObject<HTMLElement | null> }) {
 const ref = useRef<HTMLDialogElement>(null);
 useEffect(() => {
  const previous = document.activeElement as HTMLElement | null;
  const returnTarget = returnFocusRef?.current ?? previous;
  const dialog = ref.current; dialog?.showModal();
  return () => { dialog?.close(); requestAnimationFrame(() => { if (returnTarget?.isConnected) returnTarget.focus(); }); };
 }, [returnFocusRef]);
 return <dialog ref={ref} aria-label={label} onCancel={e => { e.preventDefault(); onClose(); }} className="reader-native-dialog">{children}</dialog>;
}
