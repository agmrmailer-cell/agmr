'use client'
import { useState, useEffect, useRef } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import HelpTip from '@/components/ui/HelpTip'

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL    = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

/** Convertit un File en Blob WebP (max maxW px) via Canvas */
function toWebP(file, maxW = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio  = Math.min(1, maxW / img.naturalWidth)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.naturalWidth  * ratio)
      canvas.height = Math.round(img.naturalHeight * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('Conversion WebP échouée')),
        'image/webp', 0.88
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image invalide')) }
    img.src = url
  })
}

async function uploadToCloudinary(blob, folder = 'agmr/galerie') {
  const fd = new FormData()
  fd.append('file', blob, 'photo.webp')
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder', folder)
  const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Cloudinary error ${res.status}`)
  }
  return (await res.json()).secure_url
}

// ── Vue album ─────────────────────────────────────────────────
function AlbumView({ album, photos, onBack, onDeleted, onRenamed, supabase }) {
  const [renaming, setRenaming]   = useState(false)
  const [newName, setNewName]     = useState(album)
  const [deleting, setDeleting]   = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected]   = useState(new Set())
  const fileRef = useRef()
  const [progress, setProgress]   = useState(null)

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const deleteSelected = async () => {
    if (!selected.size) return
    if (!confirm(`Supprimer ${selected.size} photo${selected.size > 1 ? 's' : ''} ?`)) return
    const ids = [...selected]
    await supabase.from('galerie_photos').delete().in('id', ids)
    setSelected(new Set())
    setSelecting(false)
    onRenamed(album, album)
  }

  const renameAlbum = async () => {
    if (!newName.trim() || newName === album) { setRenaming(false); return }
    await supabase.from('galerie_photos').update({ album: newName.trim() }).eq('album', album)
    onRenamed(album, newName.trim())
    setRenaming(false)
  }

  const deleteAlbum = async () => {
    if (!confirm(`Supprimer l'album "${album}" et ses ${photos.length} photo(s) ?`)) return
    setDeleting(true)
    await supabase.from('galerie_photos').delete().eq('album', album)
    onDeleted(album)
  }

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setProgress({ done: 0, total: files.length })
    for (let i = 0; i < files.length; i++) {
      try {
        const webp = await toWebP(files[i])
        const url  = await uploadToCloudinary(webp, `agmr/galerie/${album}`)
        await supabase.from('galerie_photos').insert({
          album,
          nom_fichier: `${Date.now()}-${i}.webp`,
          url,
          legende: files[i].name.replace(/\.[^.]+$/, ''),
        })
        setProgress({ done: i + 1, total: files.length })
      } catch (err) {
        alert(`Erreur sur ${files[i].name} : ${err.message}`)
      }
    }
    setProgress(null)
    if (fileRef.current) fileRef.current.value = ''
    onRenamed(album, album) // force refresh
  }

  const deletePhoto = async (photo) => {
    if (!confirm('Supprimer cette photo ?')) return
    await supabase.from('galerie_photos').delete().eq('id', photo.id)
    onRenamed(album, album) // force refresh
  }

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Albums</button>

        {renaming ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') renameAlbum(); if (e.key === 'Escape') setRenaming(false) }}
              style={{ padding: '6px 10px', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-sm)', fontSize: '1rem', fontFamily: 'inherit', flex: 1, maxWidth: 280 }}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={renameAlbum}>Renommer</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setRenaming(false)}>Annuler</button>
          </div>
        ) : (
          <h2 style={{ margin: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            {album}
            <span style={{ fontSize: '0.84rem', color: 'var(--ink-mute)', fontFamily: 'var(--sans)', fontWeight: 400 }}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
          </h2>
        )}

        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {selecting ? (
            <>
              <span style={{ fontSize: '0.84rem', color: 'var(--ink-mute)', display: 'flex', alignItems: 'center' }}>
                {selected.size} sélectionnée{selected.size > 1 ? 's' : ''}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => selected.size === photos.length ? setSelected(new Set()) : setSelected(new Set(photos.map(p => p.id)))}>
                {selected.size === photos.length ? 'Désélectionner tout' : 'Tout sélectionner'}
              </button>
              {selected.size > 0 && (
                <button className="btn btn-sm" style={{ background: 'var(--accent)', color: '#fff', border: 'none' }} onClick={deleteSelected}>
                  <Icon name="trash" size={13}/> Supprimer ({selected.size})
                </button>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => { setSelecting(false); setSelected(new Set()) }}>Annuler</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelecting(true)}>
                ☑ Sélectionner
              </button>
              {!renaming && (
                <button className="btn btn-ghost btn-sm" onClick={() => setRenaming(true)}>
                  <Icon name="edit" size={13}/> Renommer
                </button>
              )}
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent)' }} onClick={deleteAlbum} disabled={deleting}>
                <Icon name="trash" size={13}/> Supprimer l'album
              </button>
            </>
          )}
        </div>
      </div>

      {/* Barre d'ajout */}
      <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} id={`add-to-${album}`} disabled={!!progress}/>
        <label htmlFor={`add-to-${album}`} className="btn btn-ghost btn-sm" style={{ cursor: progress ? 'not-allowed' : 'pointer', opacity: progress ? 0.7 : 1 }}>
          <Icon name="plus" size={14}/> {progress ? `${progress.done}/${progress.total}…` : 'Ajouter des photos'}
        </label>
        {progress && (
          <div style={{ flex: 1, height: 5, background: 'var(--line)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(progress.done / progress.total) * 100}%`, background: 'var(--green)', transition: 'width .3s' }}/>
          </div>
        )}
      </div>

      {/* Grille photos */}
      {photos.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-mute)', background: 'var(--bg-elev)', borderRadius: 'var(--r-md)', border: '2px dashed var(--line)' }}>
          Aucune photo dans cet album.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {photos.map(photo => {
            const isSel = selected.has(photo.id)
            return (
              <div
                key={photo.id}
                onClick={() => selecting ? toggleSelect(photo.id) : null}
                style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: 'var(--bg-deep)', cursor: selecting ? 'pointer' : 'default', outline: isSel ? '3px solid var(--accent)' : 'none', outlineOffset: -3 }}
              >
                <img src={photo.url} alt={photo.legende} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selecting && !isSel ? 0.6 : 1, transition: 'opacity .15s' }}/>

                {/* Overlay sélection */}
                {selecting && (
                  <div style={{ position: 'absolute', top: 8, left: 8, width: 22, height: 22, borderRadius: 4, background: isSel ? 'var(--accent)' : 'rgba(255,255,255,0.85)', border: isSel ? '2px solid var(--accent)' : '2px solid rgba(0,0,0,0.25)', display: 'grid', placeItems: 'center', transition: 'all .1s' }}>
                    {isSel && <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700, lineHeight: 1 }}>✓</span>}
                  </div>
                )}

                {/* Overlay suppression (mode normal) */}
                {!selecting && (
                  <div
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background .2s', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 8 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                  >
                    <button
                      onClick={() => deletePhoto(photo)}
                      style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--accent)' }}
                    >
                      <Icon name="trash" size={12}/>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Section principale ────────────────────────────────────────
export default function AdminGalerieSection() {
  const [photos, setPhotos]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [openAlbum, setOpenAlbum]     = useState(null)
  const [progress, setProgress]       = useState(null)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [selectedExisting, setSelectedExisting] = useState('')
  const fileRef  = useRef()
  const supabase = createClient()

  const fetchPhotos = async () => {
    const { data } = await supabase.from('galerie_photos').select('*').order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchPhotos() }, [])

  // Albums groupés
  const albumsMap = photos.reduce((acc, p) => {
    const k = p.album || 'Sans album'
    if (!acc[k]) acc[k] = []
    acc[k].push(p); return acc
  }, {})
  const albumNames = Object.keys(albumsMap).sort()
  const targetAlbum = newAlbumName.trim() || selectedExisting || albumNames[0] || 'Nouvel album'

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setProgress({ done: 0, total: files.length })
    for (let i = 0; i < files.length; i++) {
      try {
        const webp = await toWebP(files[i])
        const url  = await uploadToCloudinary(webp, `agmr/galerie/${targetAlbum}`)
        await supabase.from('galerie_photos').insert({
          album: targetAlbum,
          nom_fichier: `${Date.now()}-${i}.webp`,
          url,
          legende: files[i].name.replace(/\.[^.]+$/, ''),
        })
        setProgress({ done: i + 1, total: files.length })
      } catch (err) {
        alert(`Erreur sur ${files[i].name} : ${err.message}`)
      }
    }
    setProgress(null)
    if (fileRef.current) fileRef.current.value = ''
    fetchPhotos()
  }

  const handleRenamed = async (oldName, newName) => {
    // Rouvrir l'album renommé si besoin
    if (openAlbum === oldName) setOpenAlbum(newName)
    await fetchPhotos()
  }

  const handleDeleted = async (albumName) => {
    setOpenAlbum(null)
    await fetchPhotos()
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--ink-mute)' }}>Chargement…</div>

  // ── Vue album ouvert ──
  if (openAlbum && albumsMap[openAlbum]) {
    return (
      <>
        <div className="admin-head" style={{ marginBottom: 20 }}>
          <h1>Galerie</h1>
        </div>
        <AlbumView
          album={openAlbum}
          photos={albumsMap[openAlbum]}
          onBack={() => setOpenAlbum(null)}
          onDeleted={handleDeleted}
          onRenamed={handleRenamed}
          supabase={supabase}
        />
      </>
    )
  }

  // ── Vue liste des albums ──
  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Galerie <HelpTip text="Gérez ici la galerie photos du site. Les photos sont organisées par albums (ex : Sorties 2024, Forum des associations). Cliquez sur un album pour l'ouvrir et y ajouter ou supprimer des photos." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>
            {photos.length} photo{photos.length !== 1 ? 's' : ''} · {albumNames.length} album{albumNames.length !== 1 ? 's' : ''} —{' '}
            <strong style={{ color: 'var(--green)' }}>Cloudinary CDN</strong>
          </p>
        </div>
      </div>

      {/* ── Zone d'upload ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: 'var(--sans)', fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Ajouter des photos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div className="field">
            <label>Album existant <HelpTip text="Sélectionnez l'album dans lequel vous souhaitez ajouter les photos. Si vous voulez créer un nouvel album, utilisez le champ à droite." position="right" /></label>
            <select value={selectedExisting} onChange={e => { setSelectedExisting(e.target.value); setNewAlbumName('') }}>
              {albumNames.map(a => <option key={a} value={a}>{a}</option>)}
              {albumNames.length === 0 && <option value="">Aucun album</option>}
            </select>
          </div>
          <div className="field">
            <label>Ou créer un album <HelpTip text="Tapez un nom pour créer un tout nouvel album. Les photos choisies ci-dessous seront automatiquement placées dans cet album." position="right" /></label>
            <input value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} placeholder="Nom du nouvel album…"/>
          </div>
        </div>
        <div style={{ marginBottom: 14, fontSize: '0.84rem', color: 'var(--ink-mute)' }}>
          Album cible : <strong style={{ color: 'var(--ink)' }}>{targetAlbum}</strong>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} id="cld-upload-main" disabled={!!progress}/>
          <label htmlFor="cld-upload-main" className="btn btn-primary" style={{ cursor: progress ? 'not-allowed' : 'pointer', opacity: progress ? 0.7 : 1 }}>
            <Icon name="plus" size={16}/> {progress ? `${progress.done}/${progress.total}…` : 'Choisir des photos'}
          </label>
          <span style={{ fontSize: '0.82rem', color: 'var(--ink-mute)' }}>JPG, PNG, HEIC… → WebP automatique</span>
        </div>
        {progress && (
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 5, background: 'var(--line)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(progress.done / progress.total) * 100}%`, background: 'var(--green)', transition: 'width .3s' }}/>
            </div>
            <div style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--ink-mute)' }}>{progress.done} / {progress.total}</div>
          </div>
        )}
      </div>

      {/* ── Grille d'albums ── */}
      {albumNames.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-mute)', background: 'var(--bg-elev)', borderRadius: 'var(--r-md)', border: '2px dashed var(--line)' }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ marginBottom: 16, opacity: 0.45 }}>
            <rect x="4" y="8" width="48" height="40" rx="4" stroke="var(--ink-soft)" strokeWidth="1.8" fill="none"/>
            <circle cx="18" cy="22" r="4" fill="var(--ink-mute)"/>
            <path d="M4 36 L16 24 L26 34 L36 22 L52 36" stroke="var(--ink-soft)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p style={{ margin: 0 }}>Aucun album. Uploadez des photos ci-dessus pour créer le premier.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {albumNames.map(albumName => {
            const albumPhotos = albumsMap[albumName]
            const cover = albumPhotos[0]
            return (
              <button
                key={albumName}
                onClick={() => setOpenAlbum(albumName)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r-md)', overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'inherit', transition: 'box-shadow .15s, transform .15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sh-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}
              >
                {/* Couverture */}
                <div style={{ aspectRatio: '16/9', background: 'var(--bg-deep)', overflow: 'hidden', position: 'relative' }}>
                  {cover
                    ? <img src={cover.url} alt={albumName} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                    : <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                        <svg width="40" height="34" viewBox="0 0 40 34" fill="none" style={{ opacity: 0.3 }}>
                          <rect x="1" y="1" width="38" height="32" rx="3" stroke="var(--ink)" strokeWidth="1.5" fill="none"/>
                          <circle cx="12" cy="11" r="3.5" fill="var(--ink)"/>
                          <path d="M1 24 L12 14 L20 22 L28 14 L39 24" stroke="var(--ink)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                  }
                </div>
                {/* Infos */}
                <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{albumName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-mute)', marginTop: 2 }}>{albumPhotos.length} photo{albumPhotos.length !== 1 ? 's' : ''}</div>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>Ouvrir →</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
