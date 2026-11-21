'use client'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { HISTORY_EVENT, readHistory, undoLast } from '@/lib/edit-history'
import { frenchError } from '@/lib/errors'

export function setEditModeCookie(on) {
  document.cookie = on
    ? 'agmr_edit=1; path=/; max-age=43200; samesite=lax'
    : 'agmr_edit=; path=/; max-age=0; samesite=lax'
}

// Une saisie est en cours (champ, éditeur de texte) : Ctrl+Z doit agir sur le texte, pas sur le site
function isTyping(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

// Barre affichée en haut du site quand un administrateur est en mode édition visuelle
export default function EditModeBar() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [toast, setToast] = useState(null)
  const [history, setHistory] = useState([])
  const [undoing, setUndoing] = useState(false)
  const undoingRef = useRef(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    document.body.classList.add('agmr-edit-mode')
    let timer
    const onToast = e => {
      setToast(e.detail)
      clearTimeout(timer)
      timer = setTimeout(() => setToast(null), e.detail.type === 'error' ? 6000 : 2500)
    }
    const onHistory = () => setHistory(readHistory())
    onHistory()
    window.addEventListener('agmr-edit-toast', onToast)
    window.addEventListener(HISTORY_EVENT, onHistory)
    window.addEventListener('storage', onHistory)
    return () => {
      document.body.classList.remove('agmr-edit-mode')
      window.removeEventListener('agmr-edit-toast', onToast)
      window.removeEventListener(HISTORY_EVENT, onHistory)
      window.removeEventListener('storage', onHistory)
      clearTimeout(timer)
    }
  }, [])

  const notify = (message, type = 'ok') =>
    window.dispatchEvent(new CustomEvent('agmr-edit-toast', { detail: { message, type } }))

  const undo = useCallback(async () => {
    if (undoingRef.current) return
    undoingRef.current = true
    setUndoing(true)
    try {
      const label = await undoLast(supabase)
      if (label) {
        notify(`Annulé : ${label}`)
        startTransition(() => router.refresh())
      }
    } catch (e) {
      notify(`Annulation impossible. ${frenchError(e)}`, 'error')
    }
    undoingRef.current = false
    setUndoing(false)
  }, [supabase, router])

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z' && !isTyping(document.activeElement)) {
        if (!readHistory().length) return
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

  const quit = () => {
    setEditModeCookie(false)
    window.location.reload()
  }

  const last = history[history.length - 1]

  return (
    <>
      <div className="edit-bar" role="region" aria-label="Mode édition">
        <span className="edit-bar-dot"/>
        <strong>Mode édition</strong>
        <span className="edit-bar-hint">Cliquez sur un texte encadré pour le modifier · glissez ⠿ pour déplacer un bloc.</span>
        <span style={{ flex: 1 }}/>
        <button
          type="button"
          className="edit-bar-btn"
          disabled={!last || undoing}
          onClick={undo}
          title={last ? `Annuler : ${last.label} (Ctrl+Z)` : 'Aucune modification à annuler'}
        >
          {undoing ? 'Annulation…' : `↶ Annuler${history.length ? ` (${history.length})` : ''}`}
        </button>
        <a className="edit-bar-btn" href="/admin">Back-office</a>
        <button type="button" className="edit-bar-btn edit-bar-btn-primary" onClick={quit}>Quitter le mode édition</button>
      </div>
      {toast && (
        <div className={`edit-toast${toast.type === 'error' ? ' is-error' : ''}`} role="status">
          {toast.type === 'error' ? '⚠ ' : '✓ '}{toast.message}
        </div>
      )}
    </>
  )
}
