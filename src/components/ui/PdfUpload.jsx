'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'
import { frenchError } from '@/lib/errors'

/**
 * Composant upload PDF vers Supabase Storage (bucket "documents").
 * @param {string}   value    - URL actuelle (ou null)
 * @param {Function} onChange - appelé avec la nouvelle URL
 * @param {string}   folder   - sous-dossier dans le bucket (ex: "ag", "tarifs")
 */
export default function PdfUpload({ value, onChange, folder = 'divers' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState(null)
  const inputRef = useRef()
  const supabase = createClient()

  // Nom du fichier à afficher
  const filename = value
    ? decodeURIComponent(value.split('/').pop().split('?')[0])
    : null

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    setError(null)
    setUploading(true)

    try {
      const safeName = file.name
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire les accents
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .toLowerCase()
      const path = `${folder}/${Date.now()}-${safeName}`

      const { error: upErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: 'application/pdf', upsert: false })

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(path)

      onChange(publicUrl)
    } catch (err) {
      setError(frenchError(err))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Fichier actuel */}
      {value && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}>
          {/* Icône PDF */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="15" y2="17"/>
          </svg>
          <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {filename}
          </span>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.78rem', color: 'var(--accent)', textDecoration: 'none', flexShrink: 0 }}
          >
            Ouvrir ↗
          </a>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{ background: 'none', border: 'none', color: 'var(--ink-mute)', cursor: 'pointer', padding: '0 2px', fontSize: '0.9rem', flexShrink: 0 }}
            title="Retirer"
          >✕</button>
        </div>
      )}

      {/* Bouton d'upload */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '8px 14px', border: '1px solid var(--line-strong)',
            borderRadius: 'var(--r-sm)', background: 'var(--bg-card)',
            color: 'var(--ink-soft)', cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '0.86rem', fontFamily: 'inherit', opacity: uploading ? 0.7 : 1,
            transition: 'border-color .15s, color .15s',
          }}
          onMouseEnter={e => { if (!uploading) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.color = 'var(--ink-soft)' }}
        >
          {uploading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-9-9"/>
              </svg>
              Upload…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <polyline points="12 12 12 18"/>
                <polyline points="9 15 12 12 15 15"/>
              </svg>
              {value ? 'Remplacer le PDF' : 'Uploader un PDF'}
            </>
          )}
        </button>
        {!value && (
          <span style={{ fontSize: '0.78rem', color: 'var(--ink-mute)' }}>ou coller une URL ci-dessous</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      {error && (
        <div style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>⚠ {error}</div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
