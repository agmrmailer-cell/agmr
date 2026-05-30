'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import PhotoUpload from '@/components/admin/PhotoUpload'
import HelpTip from '@/components/ui/HelpTip'
import { GENERIC_BLOCKS, genericType } from '@/lib/generic-blocks'

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

// ── Main component ─────────────────────────────────────────────
export default function AdminHomeSection() {
  const [blocks, setBlocks]       = useState([])
  const [stats, setStats]         = useState({ hero: [], band: [] })
  const [loading, setLoading]     = useState(true)
  const [editing, setEditing]     = useState(null)
  const [editingStat, setEditingStat] = useState(null)
  const [showCatalogue, setShowCatalogue] = useState(false)
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

  const moveBlock = async (idx, dir) => {
    const target = blocks[idx + dir]
    const current = blocks[idx]
    if (!target) return
    await supabase.from('home_blocks').update({ ordre: target.ordre }).eq('id', current.id)
    await supabase.from('home_blocks').update({ ordre: current.ordre }).eq('id', target.id)
    load()
  }

  const deleteBlock = async (block) => {
    if (!confirm(`Supprimer le bloc "${BLOCK_META[block.block_key]?.label ?? block.block_key}" ?`)) return
    await supabase.from('home_blocks').delete().eq('id', block.id)
    load()
  }

  const addBlock = async (key) => {
    const maxOrdre = Math.max(0, ...blocks.map(b => b.ordre ?? 0))
    await supabase.from('home_blocks').insert({
      block_key: key,
      label: (genericType(key) ? (GENERIC_BLOCKS.find(g => g.type === genericType(key))?.label ?? key) : (BLOCK_META[key]?.label ?? key)),
      visible: true,
      content: {},
      ordre: maxOrdre + 10,
    })
    setShowCatalogue(false)
    load()
  }

  const existingKeys = new Set(blocks.map(b => b.block_key))
  const catalogueItems = Object.entries(BLOCK_META).filter(([key]) => !existingKeys.has(key))

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Page principale <HelpTip text="Gérez le contenu de la page d'accueil du site : la bannière principale (hero), les cartes des activités, la section Philosophie, les actualités et le bandeau d'appel à l'action. Chaque bloc peut être rendu visible ou invisible indépendamment." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Contenu, photos, visibilité et chiffres clés</p>
        </div>
      </div>

      {/* ── Blocs ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontFamily: "var(--sans)", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>
          Blocs de la page
        </h3>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowCatalogue(true)}>
          <Icon name="plus" size={13}/> Ajouter un bloc
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 36 }}>
        {blocks.map((block, idx) => {
          const meta = BLOCK_META[block.block_key] ?? { label: block.block_key, desc: '' }
          const hasPhoto = ['trio_gym','trio_rando','trio_nordique','manifesto'].includes(block.block_key)
          const hasContent = block.block_key !== 'actualites'
          const photoUrl = block.content?.photo_url
          return (
            <div key={block.block_key} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, opacity: block.visible ? 1 : 0.5 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button className="icon-btn" style={{ padding: 2 }} disabled={idx === 0} onClick={() => moveBlock(idx, -1)}><Icon name="chevronUp" size={12}/></button>
                <button className="icon-btn" style={{ padding: 2 }} disabled={idx === blocks.length - 1} onClick={() => moveBlock(idx, 1)}><Icon name="chevronDown" size={12}/></button>
              </div>
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
                <button className="icon-btn" onClick={() => deleteBlock(block)} style={{ color: 'var(--red)' }}>
                  <Icon name="trash" size={14}/>
                </button>
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

      {/* ── Catalogue modal ── */}
      {showCatalogue && (
        <Modal title="Ajouter un bloc" onClose={() => setShowCatalogue(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {catalogueItems.length > 0 && <>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-mute)", marginBottom: 4 }}>Blocs de page</div>
                {catalogueItems.map(([key, meta]) => (
                  <button key={key} onClick={() => addBlock(key)} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 18px", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>{meta.label}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-mute)" }}>{meta.desc}</span>
                  </button>
                ))}
                <div style={{ margin: "8px 0 4px", borderTop: "1px solid var(--line-soft)" }}/>
              </>}
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-mute)", marginBottom: 4 }}>Blocs réutilisables</div>
              {GENERIC_BLOCKS.map(g => (
                <button key={g.type} onClick={() => addBlock(`${g.type}_${Date.now()}`)} style={{ background: "var(--bg-deep)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 18px", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontWeight: 600 }}>{g.label}</span>
                  <span style={{ fontSize: "0.82rem", color: "var(--ink-mute)" }}>{g.desc}</span>
                </button>
              ))}
            </div>
        </Modal>
      )}

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
        <div className="field">
          <label>Photo de fond</label>
          <PhotoUpload value={c.photo_url ?? ''} onChange={url => u('photo_url', url)} supabase={supabase} folder="home" shape="rect"/>
          <div style={{ marginTop: 8, padding: "10px 14px", background: "var(--bg-deep)", borderRadius: "var(--r-sm)", fontSize: "0.8rem", color: "var(--ink-mute)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--ink-soft)" }}>Specs recommandées</strong><br/>
            Format : JPG ou WebP · Dimensions : 1920 × 1080 px minimum<br/>
            Ratio : 16/9 ou plus large · Poids : moins de 1 Mo<br/>
            Sujet au centre — les bords sont rognés sur mobile
          </div>
        </div>
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
          <PhotoUpload value={c.photo_url ?? ''} onChange={url => u('photo_url', url)} supabase={supabase} folder="home" shape="rect"/>
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
          <PhotoUpload value={c.photo_url ?? ''} onChange={url => u('photo_url', url)} supabase={supabase} folder="home" shape="rect"/>
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


      {/* Blocs génériques */}
      {genericType(key) === 'texte' && <>
        <div className="field"><label>Titre</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
        </div>
        <div className="field"><label>Texte</label>
          <textarea rows={5} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
      </>}
      {genericType(key) === 'citation' && <>
        <div className="field"><label>Citation</label>
          <textarea rows={3} value={c.citation ?? ''} onChange={e => u('citation', e.target.value)}/>
        </div>
        <div className="field"><label>Auteur</label>
          <input value={c.auteur ?? ''} onChange={e => u('auteur', e.target.value)}/>
        </div>
        <div className="field"><label>Rôle</label>
          <input value={c.role ?? ''} onChange={e => u('role', e.target.value)}/>
        </div>
      </>}
      {genericType(key) === 'cta' && <>
        <div className="field"><label>Titre</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
        </div>
        <div className="field"><label>Texte</label>
          <textarea rows={3} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
        <div className="field"><label>Texte du bouton</label>
          <input value={c.bouton ?? ''} onChange={e => u('bouton', e.target.value)} placeholder="En savoir plus"/>
        </div>
        <div className="field"><label>Lien du bouton</label>
          <input value={c.lien ?? ''} onChange={e => u('lien', e.target.value)} placeholder="/planning/randonnee"/>
        </div>
      </>}
      {genericType(key) === 'alerte' && <>
        <div className="field"><label>Titre (optionnel)</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
        </div>
        <div className="field"><label>Texte</label>
          <textarea rows={4} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
      </>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(block.block_key, c)}>Enregistrer</button>
      </div>
    </div>
  )
}
