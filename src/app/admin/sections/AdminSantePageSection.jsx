'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import HelpTip from '@/components/ui/HelpTip'
import { GENERIC_BLOCKS, genericType } from '@/lib/generic-blocks'

const BLOCK_META = {
  header:      { label: 'En-tête de page',  desc: 'Accroche, titre, chapeau' },
  prescri:     { label: "Prescri'Forme",    desc: "Textes, encadré certification, lien vers lasanteparlesport.fr" },
  rando_sante: { label: 'Rando-Santé',      desc: 'Titre, texte et citation mise en avant' },
  temoignage:  { label: 'Témoignage',       desc: 'Citation, nom et rôle' },
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

export default function AdminSantePageSection() {
  const [blocks, setBlocks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showCatalogue, setShowCatalogue] = useState(false)
  const supabase = createClient()

  const load = async () => {
    const { data, error } = await supabase.from('sante_page_blocks').select('*').order('ordre')
    if (!error) setBlocks(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggleVisible = async (key, current) => {
    await supabase.from('sante_page_blocks').update({ visible: !current }).eq('block_key', key)
    load()
  }
  const saveBlock = async (key, content) => {
    await supabase.from('sante_page_blocks').update({ content }).eq('block_key', key)
    setEditing(null); load()
  }
  const moveBlock = async (idx, dir) => {
    const target = blocks[idx + dir]
    const current = blocks[idx]
    if (!target) return
    await supabase.from('sante_page_blocks').update({ ordre: target.ordre }).eq('id', current.id)
    await supabase.from('sante_page_blocks').update({ ordre: current.ordre }).eq('id', target.id)
    load()
  }
  const deleteBlock = async (block) => {
    if (!confirm(`Supprimer le bloc "${BLOCK_META[block.block_key]?.label ?? block.block_key}" ?`)) return
    await supabase.from('sante_page_blocks').delete().eq('id', block.id)
    load()
  }
  const addBlock = async (key) => {
    const maxOrdre = Math.max(0, ...blocks.map(b => b.ordre ?? 0))
    await supabase.from('sante_page_blocks').insert({ block_key: key, label: (genericType(key) ? (GENERIC_BLOCKS.find(g => g.type === genericType(key))?.label ?? key) : (BLOCK_META[key]?.label ?? key)), visible: true, content: {}, ordre: maxOrdre + 10 })
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
          <h1>Page Santé par le sport <HelpTip text="Gérez le contenu de la page dédiée aux activités physiques adaptées : Prescri'Forme (sport sur ordonnance) et Rando-Santé (marche adaptée). Modifiez les textes ou masquez des blocs si nécessaire." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Prescri'Forme & Rando-Santé</p>
        </div>
        <a className="btn btn-ghost btn-sm" href="/activites/sante" target="_blank" rel="noopener noreferrer">Voir la page →</a>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowCatalogue(true)}>
          <Icon name="plus" size={13}/> Ajouter un bloc
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {blocks.map((block, idx) => {
          const meta = BLOCK_META[block.block_key] ?? { label: block.block_key, desc: '' }
          return (
            <div key={block.block_key} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, opacity: block.visible ? 1 : 0.5 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button className="icon-btn" style={{ padding: 2 }} disabled={idx === 0} onClick={() => moveBlock(idx, -1)}><Icon name="chevronUp" size={12}/></button>
                <button className="icon-btn" style={{ padding: 2 }} disabled={idx === blocks.length - 1} onClick={() => moveBlock(idx, 1)}><Icon name="chevronDown" size={12}/></button>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{meta.label}</div>
                <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>{meta.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>{block.visible ? 'Visible' : 'Masqué'}</span>
                <button className={`switch ${block.visible ? 'on' : ''}`} onClick={() => toggleVisible(block.block_key, block.visible)}/>
                <button className="icon-btn" onClick={() => setEditing(block)}><Icon name="edit" size={14}/></button>
                <button className="icon-btn" onClick={() => deleteBlock(block)} style={{ color: 'var(--red)' }}><Icon name="trash" size={14}/></button>
              </div>
            </div>
          )
        })}
      </div>

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

      {editing && (
        <Modal title={`Modifier — ${BLOCK_META[editing.block_key]?.label ?? editing.block_key}`} onClose={() => setEditing(null)}>
          <BlockForm block={editing} onSave={saveBlock} onCancel={() => setEditing(null)}/>
        </Modal>
      )}
    </>
  )
}

function BlockForm({ block, onSave, onCancel }) {
  const [c, setC] = useState(block.content ?? {})
  const u = (k, v) => setC(prev => ({ ...prev, [k]: v }))
  const key = block.block_key

  return (
    <div className="form">
      {key === 'header' && <>
        <div className="field"><label>Accroche (eyebrow)</label><input value={c.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)} placeholder="Santé par le Sport · Activités Physiques Adaptées"/></div>
        <div className="field"><label>Titre H1</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Prescri'Forme & Rando-Santé"/></div>
        <div className="field"><label>Chapeau</label><textarea rows={3} value={c.lede ?? ''} onChange={e => u('lede', e.target.value)}/></div>
      </>}

      {key === 'prescri' && <>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Prescri'Forme — Sport sur ordonnance"/></div>
        <div className="field"><label>Premier paragraphe</label><textarea rows={4} value={c.texte1 ?? ''} onChange={e => u('texte1', e.target.value)}/></div>
        <div className="field"><label>Deuxième paragraphe</label><textarea rows={3} value={c.texte2 ?? ''} onChange={e => u('texte2', e.target.value)}/></div>
        <div className="field"><label>Texte Certification</label><textarea rows={2} value={c.cert_texte ?? ''} onChange={e => u('cert_texte', e.target.value)} placeholder="Section gym certifiée auprès de la DRJSCS Yvelines…"/></div>
        <div className="row-2">
          <div className="field"><label>Lien externe — URL</label><input value={c.lien_url ?? ''} onChange={e => u('lien_url', e.target.value)} placeholder="http://www.lasanteparlesport.fr"/></div>
          <div className="field"><label>Lien externe — texte</label><input value={c.lien_texte ?? ''} onChange={e => u('lien_texte', e.target.value)} placeholder="lasanteparlesport.fr"/></div>
        </div>
      </>}

      {key === 'rando_sante' && <>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Rando-Santé — Marche adaptée"/></div>
        <div className="field"><label>Texte</label><textarea rows={3} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/></div>
        <div className="field"><label>Citation mise en avant</label><textarea rows={2} value={c.citation ?? ''} onChange={e => u('citation', e.target.value)} placeholder="Plus lentement, moins longtemps et moins loin…"/></div>
      </>}

      {key === 'temoignage' && <>
        <div className="field"><label>Citation</label><textarea rows={3} value={c.citation ?? ''} onChange={e => u('citation', e.target.value)}/></div>
        <div className="row-2">
          <div className="field"><label>Nom / prénom</label><input value={c.auteur ?? ''} onChange={e => u('auteur', e.target.value)} placeholder="Henri, 71 ans"/></div>
          <div className="field"><label>Rôle / contexte</label><input value={c.role ?? ''} onChange={e => u('role', e.target.value)} placeholder="Cours Prescri'Forme"/></div>
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
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(block.block_key, c)}>Enregistrer</button>
      </div>
    </div>
  )
}
