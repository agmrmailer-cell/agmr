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

function toRad(deg) { return (deg * Math.PI) / 180 }

async function getCroppedBlob(imageSrc, pixelCrop, rotation = 0, quality = 0.88) {
  const image    = await createImage(imageSrc)
  const canvas   = document.createElement('canvas')
  const ctx      = canvas.getContext('2d')

  // Zone sécurisée pour la rotation (diagonale × 2)
  const maxSize  = Math.max(image.width, image.height)
  const safeArea = 2 * Math.ceil((maxSize / 2) * Math.sqrt(2))

  canvas.width  = safeArea
  canvas.height = safeArea

  // Rotation autour du centre
  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate(toRad(rotation))
  ctx.translate(-safeArea / 2, -safeArea / 2)

  // Dessin de l'image centrée dans la zone sécurisée
  ctx.drawImage(
    image,
    safeArea / 2 - image.width  / 2,
    safeArea / 2 - image.height / 2
  )

  // Extraction du crop depuis l'image tournée
  const data = ctx.getImageData(0, 0, safeArea, safeArea)
  canvas.width  = pixelCrop.width
  canvas.height = pixelCrop.height
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width  * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
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
function CropModal({ src, onConfirm, onCancel, defaultAspect = 16 / 9 }) {
  const [crop, setCrop]           = useState({ x: 0, y: 0 })
  const [zoom, setZoom]           = useState(1)
  const [rotation, setRotation]   = useState(0)
  const [ratio, setRatio]         = useState(defaultAspect)
  const [croppedPixels, setCroppedPixels] = useState(null)
  const [loading, setLoading]     = useState(false)

  const onCropComplete = useCallback((_, pixels) => setCroppedPixels(pixels), [])

  const handleConfirm = async () => {
    if (!croppedPixels) return
    setLoading(true)
    try {
      const blob    = await getCroppedBlob(src, croppedPixels, rotation)
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
          rotation={rotation}
          aspect={ratio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 20px', background: '#0d1510', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, flexWrap: 'wrap' }}>

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.76rem', whiteSpace: 'nowrap', width: 36 }}>Zoom</span>
          <input type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#b8451f' }}/>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.76rem', minWidth: 28 }}>{zoom.toFixed(1)}×</span>
        </div>

        {/* Rotation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 240 }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.76rem', whiteSpace: 'nowrap', width: 56 }}>Inclinaison</span>
          {/* Bouton -90° */}
          <button onClick={() => setRotation(r => ((r - 90 + 360) % 360))}
            title="Rotation -90°"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0ece2', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
          </button>
          <input type="range" min={-180} max={180} step={0.5} value={rotation}
            onChange={e => setRotation(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#b8451f' }}/>
          {/* Bouton +90° */}
          <button onClick={() => setRotation(r => (r + 90) % 360)}
            title="Rotation +90°"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0ece2', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
            </svg>
          </button>
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.76rem', minWidth: 34, textAlign: 'right' }}>{rotation > 0 ? '+' : ''}{rotation}°</span>
          {rotation !== 0 && (
            <button onClick={() => setRotation(0)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.7rem', padding: '0 2px' }}
              title="Remettre à 0°">↺</button>
          )}
        </div>

        <div style={{ flex: 1 }}/>

        <button onClick={handleConfirm} disabled={loading}
          style={{ background: '#b8451f', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 24px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.96rem', fontWeight: 600, opacity: loading ? 0.7 : 1, flexShrink: 0 }}>
          {loading ? 'Traitement…' : '✓ Valider le recadrage'}
        </button>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export default function ImageUpload({ value, onChange, folder = 'medias', height = 140, label = 'Image', defaultAspect = 16 / 9 }) {
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
          defaultAspect={defaultAspect}
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
            {value ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2H3v16h5v4l4-4 4 4v-4h5V2z"/><line x1="3" y1="7" x2="21" y2="7"/>
                </svg>
                Remplacer
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                Choisir et recadrer
              </>
            )}
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
