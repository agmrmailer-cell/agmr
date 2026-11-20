'use client'
import { useMemo, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { saveEditable } from '@/lib/editable-save'
import { CropModal, uploadImageBlob } from '@/components/ui/ImageUpload'

function notify(message, type = 'ok') {
  window.dispatchEvent(new CustomEvent('agmr-edit-toast', { detail: { message, type } }))
}

// Boutons « Changer l'image / Retirer » posés sur une image du site en mode édition
export default function ImageEditButtonClient({ src, hasImage, aspect = 16 / 9, folder = 'medias', position = 'top-left', removable = true }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [raw, setRaw] = useState(null)
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()

  const stop = e => { e.preventDefault(); e.stopPropagation() }

  const save = async (url, message) => {
    setBusy(true)
    try {
      await saveEditable(supabase, src, url)
      notify(message)
      startTransition(() => router.refresh())
    } catch (e) {
      notify(e.message ?? "Erreur lors de l'enregistrement de l'image", 'error')
    }
    setBusy(false)
  }

  // Sélecteur de fichier créé à la volée (hors du DOM) : aucun risque de déclencher un lien parent
  const pickFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) setRaw(URL.createObjectURL(file))
    }
    input.click()
  }

  const onCropped = async blob => {
    if (raw) URL.revokeObjectURL(raw)
    setRaw(null)
    setBusy(true)
    try {
      const url = await uploadImageBlob(supabase, blob, folder)
      await save(url, 'Image remplacée')
    } catch (e) {
      notify(e.message ?? "Erreur lors de l'envoi de l'image", 'error')
      setBusy(false)
    }
  }

  return (
    <>
      <div className={`image-edit image-edit-${position}`} onClick={stop}>
        <button type="button" disabled={busy} onClick={e => { stop(e); pickFile() }}>
          {busy ? 'Envoi…' : hasImage ? "📷 Changer l'image" : '📷 Ajouter une image'}
        </button>
        {removable && hasImage && (
          <button type="button" disabled={busy} title="Retirer l'image" onClick={e => {
            stop(e)
            if (confirm("Retirer cette image ? (l'illustration par défaut sera affichée)")) save(null, 'Image retirée')
          }}>✕</button>
        )}
      </div>
      {raw && createPortal(
        <CropModal src={raw} defaultAspect={aspect} onConfirm={onCropped} onCancel={() => { URL.revokeObjectURL(raw); setRaw(null) }}/>,
        document.body,
      )}
    </>
  )
}
