'use client'
import { useState, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { createClient } from '@/lib/supabase-client'

// ── Helpers ───────────────────────────────────────────────────

function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', err => reject(err))
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}

async function getCroppedBlob(imageSrc, pixelCrop, quality = 0.88) {
  const image  = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx    = canvas.getContext('2d')
  canvas.width  = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  )
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('Conversion échouée')), 'image/webp', quality)
  )
}

async function resizeBlob(blob, maxW = 1200) {
  const url  = URL.createObjectURL(blob)
  const img  = await createImage(url)
  URL.revokeObjectURL(url)
  if (img.naturalWidth <= maxW) return blob
  const ratio  = maxW / img.naturalWidth
  const canvas = document.createElement('canvas')
  canvas.width  = maxW
  canvas.height = Math.round(img.naturalHeight * ratio)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((res, rej) =>
    canvas.toBlob(b => b ? res(b) : rej(new Error('Resize échoué')), 'image/webp', 0.88)
  )
}

// ── Ratios disponibles ────────────────────────────────────────
const RATIOS = [
  { label: '16 : 9', value: 16 / 9 },
  { label: '4 : 3',  value: 4  / 3 },
  { label: '1 : 1',  value: 1      },
  { label: '3 : 2',  value: 3  / 2 },
  { label: 'Libre',  value: null    },
]

// ── Modal de recadrage ────────────────────────────────────────
function CropModal({ src, onConfirm, onCancel }) {
  const [crop, setCrop]           = useState({ x: 0, y: 0 })
  const [zoom, setZoom]           = useState(1)
  const [ratio, setRatio]         = useState(16 / 9)
  const [croppedPixels, setCroppedPixels] = useState(null)
  const [loading, setLoading]     = useState(false)

  const onCropComplete = useCallback((_, pixels) => setCroppedPixels(pixels), [])

  const handleConfirm = async () => {
    if (!croppedPixels) return
    setLoading(true)
    try {
      const blob    = await getCroppedBlob(src, croppedPixels)
      const resized = await resizeBlob(blob, 1400)
      onConfirm(resized)
    } catch (e) {
      alert('Erreur lors du recadrage : ' + e.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(10,14,10,0.96)', display: 'flex', flexDirection: 'column' }}>

      {/* Barre haute */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: '#0d1510', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <span style={{ color: '#f0ece2', fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 600 }}>Recadrer l'image</span>

        {/* Sélecteur de ratio */}
        <div style={{ display: 'flex', gap: 6 }}>
          {RATIOS.map(r => (
            <button
              key={r.label}
              onClick={() => setRatio(r.value)}
              style={{
                padding: '5px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                background: ratio === r.value ? '#b8451f' : 'rgba(255,255,255,0.08)',
                border: ratio === r.value ? '1px solid #b8451f' : '1px solid rgba(255,255,255,0.15)',
                color: '#f0ece2', fontFamily: 'inherit',
              }}
            >{r.label}</button>
          ))}
        </div>

        <button
          onClick={onCancel}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#f0ece2', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.86rem' }}
        >Annuler</button>
      </div>

      {/* Zone de crop */}
      <div style={{ position: 'relative', flex: 1 }}>
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={ratio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#0d1510' },
            cropAreaStyle:  { border: '2px solid #b8451f', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' },
          }}
          showGrid={true}
          zoomWithScroll={true}
        />
      </div>

      {/* Barre basse */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', background: '#0d1510', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        {/* Zoom slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 320 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Zoom</span>
          <input
            type="range" min={1} max={3} step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#b8451f' }}
          />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', minWidth: 32 }}>{zoom.toFixed(1)}×</span>
        </div>

        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', flex: 1 }}>
          Déplacez l'image pour cadrer · Molette ou slider pour zoomer
        </span>

        <button
          onClick={handleConfirm}
          disabled={loading}
          style={{ background: '#b8451f', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 24px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.96rem', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Traitement…' : '✓ Valider le recadrage'}
        </button>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export default function ImageUpload({ value, onChange, folder = 'medias', height = 140, label = 'Image' }) {
  const [rawSrc, setRawSrc]   = useState(null)   // URL objet avant crop
  const [uploading, setUploading] = useState(false)
  const [error, setError]     = useState(null)
  const inputRef = useRef()
  const supabase = createClient()

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const url = URL.createObjectURL(file)
    setRawSrc(url)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleCropConfirm = async (blob) => {
    setRawSrc(null)
    setUploading(true)
    try {
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`
      const { error: upErr } = await supabase.storage
        .from('galerie')
        .upload(fileName, blob, { contentType: 'image/webp', upsert: false })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('galerie').getPublicUrl(fileName)
      onChange(publicUrl)
    } catch (err) {
      setError(err.message ?? "Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  const handleCropCancel = () => {
    if (rawSrc) URL.revokeObjectURL(rawSrc)
    setRawSrc(null)
  }

  return (
    <>
      {/* Modal de crop (portal-like, couvre toute la page) */}
      {rawSrc && (
        <CropModal
          src={rawSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <div className="field">
        <label>{label}</label>

        {/* Aperçu */}
        <div style={{ height, borderRadius: 'var(--r-sm)', border: '1px solid var(--line-strong)', background: value ? 'var(--bg-deep)' : 'var(--bg-elev)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {value
            ? <img src={value} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            : <span style={{ fontSize: '0.84rem', color: 'var(--ink-mute)' }}>{uploading ? 'Upload…' : 'Aucune image'}</span>
          }
          {uploading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
              ⏳ Upload…
            </div>
          )}
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {value ? '🔄 Remplacer' : '📷 Choisir et recadrer'}
          </button>
          {value && (
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={() => onChange(null)} disabled={uploading}>
              Supprimer
            </button>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect}/>
        {error && <div style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--accent)' }}>⚠ {error}</div>}
      </div>
    </>
  )
}
