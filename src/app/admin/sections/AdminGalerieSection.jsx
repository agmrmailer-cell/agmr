'use client'
import { useState, useEffect, useRef } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'

const ALBUMS = ["Séjour Alsace","Marche nordique","Cours de Pilates","Pique-nique printemps","Rando dimanche","Stage Yoga"]

export default function AdminGalerieSection() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState(ALBUMS[0])
  const [newAlbum, setNewAlbum] = useState("")
  const fileRef = useRef()
  const supabase = createClient()

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('galerie_photos')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setPhotos(data)
    setLoading(false)
  }

  useEffect(() => { fetchPhotos() }, [])

  const handleUpload = async (e) => {
  const files = Array.from(e.target.files)
  if (!files.length) return
  setUploading(true)
  const album = newAlbum.trim() || selectedAlbum
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    console.log("Upload vers:", fileName)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('galerie')
      .upload(fileName, file)
    console.log("Résultat upload:", uploadData, uploadError)
    if (uploadError) {
      alert("Erreur upload: " + uploadError.message)
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage
      .from('galerie')
      .getPublicUrl(fileName)
    await supabase.from('galerie_photos').insert({
      album,
      nom_fichier: fileName,
      url: publicUrl,
      legende: file.name,
    })
  }
  setUploading(false)
  fileRef.current.value = ""
  fetchPhotos()
}

  const deletePhoto = async (photo) => {
    if (!confirm("Supprimer cette photo ?")) return
    await supabase.storage.from('galerie').remove([photo.nom_fichier])
    await supabase.from('galerie_photos').delete().eq('id', photo.id)
    fetchPhotos()
  }

  const albums = [...new Set([...ALBUMS, ...photos.map(p => p.album)])]
  const [filterAlbum, setFilterAlbum] = useState("all")
  const filtered = filterAlbum === "all" ? photos : photos.filter(p => p.album === filterAlbum)

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Galerie</h1>
          <p className="muted" style={{ margin: 0 }}>{photos.length} photos — <strong style={{ color: "var(--green)" }}>Supabase Storage</strong></p>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontFamily: "var(--sans)", fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>Uploader des photos</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div className="field">
            <label>Album existant</label>
            <select value={selectedAlbum} onChange={e => setSelectedAlbum(e.target.value)}>
              {albums.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Ou nouvel album</label>
            <input value={newAlbum} onChange={e => setNewAlbum(e.target.value)} placeholder="Nom du nouvel album"/>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              style={{ display: "none" }}
              id="file-upload"
            />
            <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: "pointer" }}>
              <Icon name="plus" size={16}/>
              {uploading ? "Upload en cours..." : "Choisir des photos"}
            </label>
          </div>
        </div>
        {uploading && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--green-tint)", borderRadius: "var(--r-sm)", fontSize: "0.9rem", color: "var(--green)" }}>
            Upload en cours... ne fermez pas cette page.
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button className={`chip ${filterAlbum === "all" ? "active" : ""}`} onClick={() => setFilterAlbum("all")}>Toutes les photos</button>
        {albums.map(a => (
          <button key={a} className={`chip ${filterAlbum === a ? "active" : ""}`} onClick={() => setFilterAlbum(a)}>{a}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--ink-mute)", background: "var(--bg-elev)", borderRadius: "var(--r-md)", border: "2px dashed var(--line)" }}>
          <Icon name="image" size={32}/>
          <p style={{ marginTop: 12 }}>Aucune photo dans cet album.<br/>Uploadez des photos ci-dessus.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {filtered.map(photo => (
            <div key={photo.id} style={{ position: "relative", borderRadius: "var(--r-sm)", overflow: "hidden", aspectRatio: "1/1", background: "var(--bg-deep)" }}>
              <img src={photo.url} alt={photo.legende} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", transition: "background 0.2s", display: "flex", alignItems: "flex-end", padding: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.4)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0)"}>
                <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#fff", fontSize: "0.78rem", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{photo.legende?.slice(0,20)}</span>
                  <button onClick={() => deletePhoto(photo)} style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "grid", placeItems: "center", cursor: "pointer", color: "var(--accent)" }}>
                    <Icon name="trash" size={12}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
