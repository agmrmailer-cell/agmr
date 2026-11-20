'use client'
import { useEffect, useState } from 'react'

export function setEditModeCookie(on) {
  document.cookie = on
    ? 'agmr_edit=1; path=/; max-age=43200; samesite=lax'
    : 'agmr_edit=; path=/; max-age=0; samesite=lax'
}

// Barre affichée en haut du site quand un administrateur est en mode édition visuelle
export default function EditModeBar() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    document.body.classList.add('agmr-edit-mode')
    let timer
    const onToast = e => {
      setToast(e.detail)
      clearTimeout(timer)
      timer = setTimeout(() => setToast(null), e.detail.type === 'error' ? 6000 : 2500)
    }
    window.addEventListener('agmr-edit-toast', onToast)
    return () => {
      document.body.classList.remove('agmr-edit-mode')
      window.removeEventListener('agmr-edit-toast', onToast)
      clearTimeout(timer)
    }
  }, [])

  const quit = () => {
    setEditModeCookie(false)
    window.location.reload()
  }

  return (
    <>
      <div className="edit-bar" role="region" aria-label="Mode édition">
        <span className="edit-bar-dot"/>
        <strong>Mode édition</strong>
        <span className="edit-bar-hint">Cliquez sur un texte encadré pour le modifier.</span>
        <span style={{ flex: 1 }}/>
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
