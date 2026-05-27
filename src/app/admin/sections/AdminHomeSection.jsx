'use client'
import { useState, useEffect, useRef } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'

const BLOCK_META = {
  hero:          { label: 'Hero',                   desc: 'Accroche, titre, sous-titre, boutons' },
  trio_gym:      { label: 'Carte Gym',               desc: 'Photo, titre, description, stat, lien' },
  trio_rando:    { label: 'Carte Randonnée',          desc: 'Photo, titre, description, stat, lien' },
  trio_nordique: { label: 'Carte Marche nordique',    desc: 'Photo, titre, description, stat, lien' },
  manifesto:     { label: 'Section Philosophie',      desc: 'Photo, texte éditorial, citation, boutons' },
  actualites:    { label: 'Section Actualités',       desc: 'Reprend automatiquement les dernières actualités' },
  cta_banner:    { label: 'Bandeau CTA',              desc: "Appel à l'action en bas de page" },
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// ── Photo upload ───────────────────────────────────────────────
function PhotoUpload({ value, onChange, supabase }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `home/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('galerie').upload(fileName, file, { upsert: true })
    if (error) { alert('Erreur upload : ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('galerie').getPublicUrl(fileName)
    onChange(publicUrl)
    setUploading(false)
    inputRef.current.value = ''
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {value ? (
        <img src={value} alt="" style={{ width: 100, height: 72, objectFit: "cover", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", flexShrink: 0 }}/>
      ) : (
        <div style={{ width: 100, height: 72, background: "var(--bg-deep)", borderRadius: "var(--r-sm)", border: "2px dashed var(--line-strong)", display: "grid", placeItems: "center", color: "var(--ink-mute)", flexShrink: 0 }}>
          <Icon name="image" size={22}/>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }}/>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => inputRef.current.click()} disabled={uploading}>
          <Icon name="download" size={12}/> {uploading ? 'Upload en cours…' : value ? 'Changer la photo' : 'Choisir une photo'}
        </button>
        {value && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')} style={{ color: "var(--accent)", fontSize: "0.8rem" }}>
            Retirer la photo
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function AdminHomeSection() {
  const [blocks, setBlocks]       = useState([])
  const [stats, setStats]         = useState({ hero: [], band: [] })
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)
  const [editingStat, setEditingStat] = useState(null)
  const supabase = createClient()

  const load = async () => {
    const [bRes, sRes] = await Promise.all([
      supabase.from('home_blocks').select('*').order('ordre'),
      supabase.from('site_stats').select('*').order('ordre'),
    ])
    if (!bRes.error) setBlocks(bRes.data)
    if (!sRes.error) {
      const d = sRes.data
      setStats({
        hero: d.filter(s => s.section === 'hero'),
        band: d.filter(s => s.section === 'band'),
      })
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleVisible = async (block_key, current) => {
    await supabase.from('home_blocks').update({ visible: !current }).eq('block_key', block_key)
    load()
  }

  const saveBlock = async (block_key, content) => {
    await supabase.from('home_blocks').update({ content }).eq('block_key', block_key)
    setEditing(null)
    load()
  }

  const saveStat = async (id, valeur, label) => {
    await supabase.from('site_stats').update({ valeur, label }).eq('id', id)
    setEditingStat(null)
    load()
  }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Page principale</h1>
          <p className="muted" style={{ margin: 0 }}>Contenu, photos, visibilité et chiffres clés</p>
        </div>
      </div>

      {/* ── Blocs ── */}
      <h3 style={{ fontFamily: "var(--sans)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 12 }}>
        Blocs de la page
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36 }}>
        {blocks.map(block => {
          const meta = BLOCK_META[block.block_key] ?? { label: block.block_key, desc: '' }
          const hasPhoto = ['trio_gym','trio_rando','trio_nordique','manifesto'].includes(block.block_key)
          const hasContent = block.block_key !== 'actualites'
          const photoUrl = block.content?.photo_url
          return (
            <div key={block.block_key} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, opacity: block.visible ? 1 : 0.5 }}>
              {hasPhoto && (
                photoUrl ? (
                  <img src={photoUrl} alt="" style={{ width: 56, height: 40, objectFit: "cover", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", flexShrink: 0 }}/>
                ) : (
                  <div style={{ width: 56, height: 40, background: "var(--bg-deep)", borderRadius: "var(--r-sm)", border: "1px dashed var(--line-strong)", display: "grid", placeItems: "center", color: "var(--ink-mute)", flexShrink: 0 }}>
                    <Icon name="image" size={14}/>
                  </div>
                )
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{meta.label}</div>
                <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>{meta.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>
                  {block.visible ? 'Visible' : 'Masqué'}
                </span>
                <button className={`switch ${block.visible ? 'on' : ''}`} onClick={() => toggleVisible(block.block_key, block.visible)}/>
                {hasContent && (
                  <button className="icon-btn" onClick={() => setEditing(block)}>
                    <Icon name="edit" size={14}/>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Chiffres clés — Hero ── */}
      <h3 style={{ fontFamily: "var(--sans)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 12 }}>
        Chiffres clés — Hero
      </h3>
      <table className="tbl" style={{ marginBottom: 28 }}>
        <thead><tr><th>Valeur</th><th>Label</th><th></th></tr></thead>
        <tbody>
          {stats.hero.map(s => (
            <tr key={s.id}>
              <td><strong style={{ fontFamily: "var(--serif)", fontSize: "1.3rem" }}>{s.valeur}</strong></td>
              <td style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.85rem" }}>{s.label}</td>
              <td style={{ textAlign: "right" }}>
                <button className="icon-btn" onClick={() => setEditingStat(s)}><Icon name="edit" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Chiffres clés — Bandeau ── */}
      <h3 style={{ fontFamily: "var(--sans)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 12 }}>
        Chiffres clés — Bandeau stats
      </h3>
      <table className="tbl">
        <thead><tr><th>Valeur</th><th>Description</th><th></th></tr></thead>
        <tbody>
          {stats.band.map(s => (
            <tr key={s.id}>
              <td><strong style={{ fontFamily: "var(--serif)", fontSize: "1.3rem" }}>{s.valeur}</strong></td>
              <td>{s.label}</td>
              <td style={{ textAlign: "right" }}>
                <button className="icon-btn" onClick={() => setEditingStat(s)}><Icon name="edit" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Modals ── */}
      {editing && (
        <Modal
          title={`Modifier — ${BLOCK_META[editing.block_key]?.label ?? editing.block_key}`}
          onClose={() => setEditing(null)}
        >
          <BlockForm block={editing} onSave={saveBlock} onCancel={() => setEditing(null)} supabase={supabase}/>
        </Modal>
      )}
      {editingStat && (
        <Modal title="Modifier le chiffre" onClose={() => setEditingStat(null)}>
          <StatForm stat={editingStat} onSave={saveStat} onCancel={() => setEditingStat(null)}/>
        </Modal>
      )}
    </>
  )
}

// ── Stat form ──────────────────────────────────────────────────
function StatForm({ stat, onSave, onCancel }) {
  const [valeur, setValeur] = useState(stat.valeur)
  const [label,  setLabel]  = useState(stat.label)
  return (
    <div className="form">
      <div className="field"><label>Valeur affichée</label>
        <input value={valeur} onChange={e => setValeur(e.target.value)} placeholder="ex : 750+, 43h, 25…"/>
      </div>
      <div className="field"><label>Label / description</label>
        <input value={label} onChange={e => setLabel(e.target.value)}/>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(stat.id, valeur, label)}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── Block form ─────────────────────────────────────────────────
function BlockForm({ block, onSave, onCancel, supabase }) {
  const [c, setC] = useState(block.content)
  const u = (k, v) => setC(prev => ({ ...prev, [k]: v }))
  const key = block.block_key.startsWith('trio_') ? 'trio' : block.block_key

  return (
    <div className="form">

      {key === 'hero' && <>
        <div className="field"><label>Accroche (eyebrow)</label>
          <input value={c.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Titre — ligne 1</label>
            <input value={c.titre_ligne1 ?? ''} onChange={e => u('titre_ligne1', e.target.value)}/>
          </div>
          <div className="field"><label>Titre — ligne 2 (italique)</label>
            <input value={c.titre_ligne2 ?? ''} onChange={e => u('titre_ligne2', e.target.value)}/>
          </div>
        </div>
        <div className="field"><label>Sous-titre</label>
          <textarea rows={2} value={c.sous_titre ?? ''} onChange={e => u('sous_titre', e.target.value)}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Bouton principal — texte</label>
            <input value={c.cta1_texte ?? ''} onChange={e => u('cta1_texte', e.target.value)}/>
          </div>
          <div className="field"><label>Bouton principal — lien</label>
            <input value={c.cta1_lien ?? ''} onChange={e => u('cta1_lien', e.target.value)}/>
          </div>
        </div>
        <div className="row-2">
          <div className="field"><label>Bouton secondaire — texte</label>
            <input value={c.cta2_texte ?? ''} onChange={e => u('cta2_texte', e.target.value)}/>
          </div>
          <div className="field"><label>Bouton secondaire — lien</label>
            <input value={c.cta2_lien ?? ''} onChange={e => u('cta2_lien', e.target.value)}/>
          </div>
        </div>
      </>}

      {key === 'trio' && <>
        <div className="field"><label>Photo illustrative</label>
          <PhotoUpload value={c.photo_url ?? ''} onChange={url => u('photo_url', url)} supabase={supabase}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Étiquette photo</label>
            <input value={c.tag ?? ''} onChange={e => u('tag', e.target.value)} placeholder="Salle, Forêt, Plein air…"/>
          </div>
          <div className="field"><label>Titre</label>
            <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
          </div>
        </div>
        <div className="field"><label>Description</label>
          <textarea rows={3} value={c.description ?? ''} onChange={e => u('description', e.target.value)}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Statistique</label>
            <input value={c.stat ?? ''} onChange={e => u('stat', e.target.value)} placeholder="43h / semaine"/>
          </div>
          <div className="field"><label>Texte du bouton</label>
            <input value={c.cta ?? ''} onChange={e => u('cta', e.target.value)}/>
          </div>
        </div>
        <div className="field"><label>Lien de la carte</label>
          <input value={c.lien ?? ''} onChange={e => u('lien', e.target.value)}/>
        </div>
      </>}

      {key === 'manifesto' && <>
        <div className="field"><label>Photo illustrative</label>
          <PhotoUpload value={c.photo_url ?? ''} onChange={url => u('photo_url', url)} supabase={supabase}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Badge — texte</label>
            <input value={c.badge ?? ''} onChange={e => u('badge', e.target.value)}/>
          </div>
          <div className="field"><label>Badge — méta</label>
            <input value={c.badge_meta ?? ''} onChange={e => u('badge_meta', e.target.value)}/>
          </div>
        </div>
        <div className="row-2">
          <div className="field"><label>Eyebrow</label>
            <input value={c.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)}/>
          </div>
          <div className="field"><label>Titre</label>
            <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
          </div>
        </div>
        <div className="field"><label>Texte principal</label>
          <textarea rows={4} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
        <div className="field"><label>Citation (pull quote)</label>
          <input value={c.pull ?? ''} onChange={e => u('pull', e.target.value)}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Bouton 1 — texte</label>
            <input value={c.cta1_texte ?? ''} onChange={e => u('cta1_texte', e.target.value)}/>
          </div>
          <div className="field"><label>Bouton 1 — lien</label>
            <input value={c.cta1_lien ?? ''} onChange={e => u('cta1_lien', e.target.value)}/>
          </div>
        </div>
        <div className="row-2">
          <div className="field"><label>Bouton 2 — texte</label>
            <input value={c.cta2_texte ?? ''} onChange={e => u('cta2_texte', e.target.value)}/>
          </div>
          <div className="field"><label>Bouton 2 — lien</label>
            <input value={c.cta2_lien ?? ''} onChange={e => u('cta2_lien', e.target.value)}/>
          </div>
        </div>
      </>}

      {key === 'cta_banner' && <>
        <div className="field"><label>Titre</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
        </div>
        <div className="field"><label>Sous-titre</label>
          <input value={c.sous_titre ?? ''} onChange={e => u('sous_titre', e.target.value)}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Bouton 1 — texte</label>
            <input value={c.cta1_texte ?? ''} onChange={e => u('cta1_texte', e.target.value)}/>
          </div>
          <div className="field"><label>Bouton 1 — lien</label>
            <input value={c.cta1_lien ?? ''} onChange={e => u('cta1_lien', e.target.value)}/>
          </div>
        </div>
        <div className="row-2">
          <div className="field"><label>Bouton 2 — texte</label>
            <input value={c.cta2_texte ?? ''} onChange={e => u('cta2_texte', e.target.value)}/>
          </div>
          <div className="field"><label>Bouton 2 — lien</label>
            <input value={c.cta2_lien ?? ''} onChange={e => u('cta2_lien', e.target.value)}/>
          </div>
        </div>
      </>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(block.block_key, c)}>Enregistrer</button>
      </div>
    </div>
  )
}
