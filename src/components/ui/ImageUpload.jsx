'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'

/**
 * Composant upload d'image réutilisable.
 * @param {string}   value      - URL actuelle (ou null)
 * @param {Function} onChange   - appelé avec la nouvelle URL (string) ou null
 * @param {string}   folder     - sous-dossier dans le bucket galerie (ex: "actualites")
 * @param {number}   [height]   - hauteur de la zone de prévisualisation (px, défaut 140)
 * @param {string}   [label]    - label du champ (défaut: "Image")
 */
export default function ImageUpload({ value, onChange, folder = 'medias', height = 140, label = 'Image' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState(null)
  const inputRef = useRef()
  const supabase = createClient()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)

    try {
      // Convertir en WebP via Canvas pour uniformiser et réduire le poids
      const webp = await toWebP(file, 1200)
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

      const { error: upErr } = await supabase.storage
        .from('galerie')
        .upload(fileName, webp, { contentType: 'image/webp', upsert: false })

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from('galerie')
        .getPublicUrl(fileName)

      onChange(publicUrl)
    } catch (err) {
      setError(err.message ?? 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleClear = () => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="field">
      <label>{label}</label>

      {/* Zone de prévisualisation */}
      <div
        style={{
          height,
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--line-strong)',
          background: value ? 'var(--bg-deep)' : 'var(--bg-elev)',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value ? (
          <img
            src={value}
            alt="Aperçu"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '0.84rem', color: 'var(--ink-mute)' }}>
            {uploading ? 'Upload en cours…' : 'Aucune image'}
          </span>
        )}

        {/* Overlay de chargement */}
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
            ⏳ Upload…
          </div>
        )}
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {value ? '🔄 Remplacer' : '📷 Choisir une image'}
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--accent)' }}
            onClick={handleClear}
            disabled={uploading}
          >
            Supprimer
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {error && (
        <div style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--accent)' }}>⚠ {error}</div>
      )}
    </div>
  )
}

/** Convertit un File en Blob WebP via Canvas, max-width = maxW px */
function toWebP(file, maxW = 1200) {
  return new Promise((resolve, reject) => {
    const img  = new Image()
    const url  = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio  = Math.min(1, maxW / img.naturalWidth)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.naturalWidth  * ratio)
      canvas.height = Math.round(img.naturalHeight * ratio)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Conversion échouée')), 'image/webp', 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image invalide')) }
    img.src = url
  })
}
