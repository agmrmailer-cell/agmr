'use client'
import { useState, useRef } from 'react'
import Icon from '@/components/ui/Icon'
import { frenchError } from '@/lib/errors'

/**
 * Convertit n'importe quel fichier image en WebP via le Canvas API.
 * Redimensionne si la largeur dépasse maxWidth (évite les uploads massifs).
 */
async function convertToWebP(file, { quality = 0.85, maxWidth = 1800 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { naturalWidth: w, naturalHeight: h } = img
      if (w > maxWidth) {
        h = Math.round(h * maxWidth / w)
        w = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        blob => blob
          ? resolve(blob)
          : reject(new Error('Conversion WebP échouée (format non supporté par ce navigateur)')),
        'image/webp',
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Impossible de lire le fichier image'))
    }

    img.src = objectUrl
  })
}

/**
 * Composant d'upload de photo partagé entre toutes les sections admin.
 *
 * Props :
 *   value    — URL publique actuelle (string)
 *   onChange — callback(newUrl: string)
 *   supabase — client Supabase (browser)
 *   folder   — sous-dossier dans le bucket 'galerie' (ex: 'bureau', 'animateurs', 'home')
 *   shape    — 'circle' (default) | 'rect'  pour l'aperçu
 */
export default function PhotoUpload({
  value,
  onChange,
  supabase,
  folder = 'uploads',
  shape = 'circle',
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState('')
  const inputRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress('Conversion WebP…')

    try {
      const webpBlob = await convertToWebP(file)

      setProgress('Upload…')
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
      const { error } = await supabase.storage
        .from('galerie')
        .upload(fileName, webpBlob, { upsert: true, contentType: 'image/webp' })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('galerie').getPublicUrl(fileName)
      onChange(publicUrl)
    } catch (err) {
      alert(frenchError(err))
    } finally {
      setUploading(false)
      setProgress('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const previewStyle = shape === 'circle'
    ? { width: 64, height: 64, borderRadius: '50%', border: '1px solid var(--line)', objectFit: 'cover', flexShrink: 0 }
    : { width: 96, height: 64, borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', objectFit: 'cover', flexShrink: 0 }

  const placeholderStyle = shape === 'circle'
    ? { width: 64, height: 64, borderRadius: '50%', border: '2px dashed var(--line-strong)', background: 'var(--bg-deep)', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)', flexShrink: 0 }
    : { width: 96, height: 64, borderRadius: 'var(--r-sm)', border: '2px dashed var(--line-strong)', background: 'var(--bg-deep)', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)', flexShrink: 0 }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {value
        ? <img src={value} alt="" style={previewStyle}/>
        : <div style={placeholderStyle}><Icon name="image" size={20}/></div>
      }
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Icon name="download" size={12}/>
          {' '}{uploading ? progress : value ? 'Changer' : 'Choisir une photo'}
        </button>
        {value && !uploading && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onChange('')}
            style={{ color: 'var(--accent)', fontSize: '0.8rem' }}
          >
            Retirer
          </button>
        )}
      </div>
    </div>
  )
}
