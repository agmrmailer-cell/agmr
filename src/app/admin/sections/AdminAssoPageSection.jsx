'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import HelpTip from '@/components/ui/HelpTip'
import { GENERIC_BLOCKS, genericType } from '@/lib/generic-blocks'

const BLOCK_META = {
  header:        { label: 'En-tête de page',      desc: 'Accroche, titre, chapeau' },
  histoire:      { label: 'Notre histoire',        desc: 'Textes et citation en encadré' },
  sections:      { label: 'Les sections',          desc: 'Cartes Section Gym et Section Marche (chiffres, texte)' },
  gouvernance:   { label: 'Gouvernance',           desc: 'Titre et texte intro (le tableau bureau vient de la DB)' },
  affiliations:  { label: 'Affiliations & labels', desc: 'Cartes éditables et ajout/suppression possible' },
  documents_asso:{ label: 'Documents officiels',   desc: 'Règlement, statuts… avec liens de téléchargement' },
}

const DEFAULT_AFFILIATIONS = [
  { eyebrow: 'FFEPGV',             titre: 'Qualité Club Sport Santé', desc: "Label fédéral attestant de la qualité de l'encadrement et du projet club." },
  { eyebrow: 'FFR',                titre: 'Label Rando-Santé',        desc: "Encadrement formé pour les pratiquants nécessitant une marche adaptée." },
  { eyebrow: "Prescri'Forme",      titre: 'Sport sur ordonnance',     desc: "Agrément depuis septembre 2019 pour les Activités Physiques Adaptées (ALD)." },
  { eyebrow: 'Conseil Général 78', titre: 'Partenaire',               desc: "Soutien institutionnel et financement de l'association." },
]

const DEFAULT_DOCS = [
  { titre: 'Règlement intérieur',              meta: 'Janvier 2024 · 240 ko', url: '#' },
  { titre: 'Statuts AGMR',                     meta: 'Octobre 2024 · 180 ko', url: '#' },
  { titre: "Contrat d'engagement républicain", meta: '2024 · 120 ko',         url: '#' },
]

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default function AdminAssoPageSection() {
  const [blocks, setBlocks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showCatalogue, setShowCatalogue] = useState(false)
  const supabase = createClient()

  const load = async () => {
    const { data, error } = await supabase.from('asso_page_blocks').select('*').order('ordre')
    if (!error) setBlocks(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggleVisible = async (key, current) => {
    await supabase.from('asso_page_blocks').update({ visible: !current }).eq('block_key', key)
    load()
  }
  const saveBlock = async (key, content) => {
    await supabase.from('asso_page_blocks').update({ content }).eq('block_key', key)
    setEditing(null); load()
  }
  const moveBlock = async (idx, dir) => {
    const target = blocks[idx + dir]
    const current = blocks[idx]
    if (!target) return
    await supabase.from('asso_page_blocks').update({ ordre: target.ordre }).eq('id', current.id)
    await supabase.from('asso_page_blocks').update({ ordre: current.ordre }).eq('id', target.id)
    load()
  }
  const deleteBlock = async (block) => {
    if (!confirm(`Supprimer le bloc "${BLOCK_META[block.block_key]?.label ?? block.block_key}" ?`)) return
    await supabase.from('asso_page_blocks').delete().eq('id', block.id)
    load()
  }
  const addBlock = async (key) => {
    const maxOrdre = Math.max(0, ...blocks.map(b => b.ordre ?? 0))
    await supabase.from('asso_page_blocks').insert({ block_key: key, label: (genericType(key) ? (GENERIC_BLOCKS.find(g => g.type === genericType(key))?.label ?? key) : (BLOCK_META[key]?.label ?? key)), visible: true, content: {}, ordre: maxOrdre + 10 })
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
          <h1>Page Présentation <HelpTip text="Gérez ici le contenu de la page de présentation de l'association. Chaque ligne correspond à un bloc de la page : vous pouvez le rendre visible ou invisible, et modifier son texte." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>L'association — contenu éditorial</p>
        </div>
        <a className="btn btn-ghost btn-sm" href="/association" target="_blank" rel="noopener noreferrer">Voir la page →</a>
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

  // Affiliations cards
  const affCards = Array.isArray(c.cards) ? c.cards : DEFAULT_AFFILIATIONS
  const addAff    = () => u('cards', [...affCards, { eyebrow: '', titre: '', desc: '' }])
  const removeAff = (i) => u('cards', affCards.filter((_, idx) => idx !== i))
  const updateAff = (i, field, val) => u('cards', affCards.map((card, idx) => idx === i ? { ...card, [field]: val } : card))

  // Documents
  const docs = Array.isArray(c.docs) ? c.docs : DEFAULT_DOCS
  const addDoc    = () => u('docs', [...docs, { titre: '', meta: '', url: '#' }])
  const removeDoc = (i) => u('docs', docs.filter((_, idx) => idx !== i))
  const updateDoc = (i, field, val) => u('docs', docs.map((d, idx) => idx === i ? { ...d, [field]: val } : d))

  return (
    <div className="form">
      {key === 'header' && <>
        <div className="field"><label>Accroche (eyebrow)</label><input value={c.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)} placeholder="L'association · Loi 1901 · Fondée en 1970"/></div>
        <div className="field"><label>Titre H1</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Une association, un esprit"/></div>
        <div className="field"><label>Chapeau</label><textarea rows={3} value={c.lede ?? ''} onChange={e => u('lede', e.target.value)}/></div>
      </>}

      {key === 'histoire' && <>
        <div className="field"><label>Titre</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Notre histoire"/></div>
        <div className="field"><label>Premier paragraphe</label><textarea rows={4} value={c.texte1 ?? ''} onChange={e => u('texte1', e.target.value)}/></div>
        <div className="field"><label>Citation (encadré)</label><textarea rows={3} value={c.citation ?? ''} onChange={e => u('citation', e.target.value)}/></div>
        <div className="field"><label>Deuxième paragraphe</label><textarea rows={3} value={c.texte2 ?? ''} onChange={e => u('texte2', e.target.value)}/></div>
      </>}

      {key === 'sections' && <>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Les sections"/></div>
        <div style={{ marginTop: 12, padding: "12px 16px", background: "var(--bg-deep)", borderRadius: "var(--r-sm)", marginBottom: 8 }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Section Gym</div>
          <div className="row-2">
            <div className="field"><label>Label</label><input value={c.gym_label ?? ''} onChange={e => u('gym_label', e.target.value)} placeholder="Section Gym"/></div>
            <div className="field"><label>Chiffre clé</label><input value={c.gym_chiffre ?? ''} onChange={e => u('gym_chiffre', e.target.value)} placeholder="~460 pratiquants"/></div>
          </div>
          <div className="field"><label>Texte</label><textarea rows={2} value={c.gym_texte ?? ''} onChange={e => u('gym_texte', e.target.value)}/></div>
        </div>
        <div style={{ padding: "12px 16px", background: "var(--bg-deep)", borderRadius: "var(--r-sm)" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Section Marche</div>
          <div className="row-2">
            <div className="field"><label>Label</label><input value={c.marche_label ?? ''} onChange={e => u('marche_label', e.target.value)} placeholder="Section Marche"/></div>
            <div className="field"><label>Chiffre clé</label><input value={c.marche_chiffre ?? ''} onChange={e => u('marche_chiffre', e.target.value)} placeholder="~290 pratiquants"/></div>
          </div>
          <div className="field"><label>Texte</label><textarea rows={2} value={c.marche_texte ?? ''} onChange={e => u('marche_texte', e.target.value)}/></div>
        </div>
      </>}

      {key === 'gouvernance' && <>
        <div className="field"><label>Titre</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Gouvernance"/></div>
        <div className="field"><label>Texte d'introduction</label><textarea rows={3} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/></div>
        <div style={{ padding: "10px 14px", background: "var(--bg-deep)", borderRadius: "var(--r-sm)", fontSize: "0.84rem", color: "var(--ink-mute)" }}>
          Le tableau des membres du bureau est géré dans <strong>Comité directeur → Bureau</strong>.
        </div>
      </>}

      {key === 'affiliations' && <>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Affiliations & labels"/></div>
        <div style={{ marginTop: 12 }}>
          {affCards.map((card, i) => (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-sm)", padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.82rem", color: "var(--ink-mute)", fontWeight: 600 }}>Affiliation {i + 1}</span>
                <button type="button" className="icon-btn" onClick={() => removeAff(i)}><Icon name="trash" size={13}/></button>
              </div>
              <div className="row-2">
                <div className="field"><label>Organisation</label><input value={card.eyebrow} onChange={e => updateAff(i, 'eyebrow', e.target.value)} placeholder="FFEPGV"/></div>
                <div className="field"><label>Label / titre</label><input value={card.titre} onChange={e => updateAff(i, 'titre', e.target.value)} placeholder="Qualité Club Sport Santé"/></div>
              </div>
              <div className="field"><label>Description</label><textarea rows={2} value={card.desc} onChange={e => updateAff(i, 'desc', e.target.value)}/></div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addAff}><Icon name="plus" size={13}/> Ajouter une affiliation</button>
        </div>
      </>}

      {key === 'documents_asso' && <>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Documents officiels"/></div>
        <div style={{ marginTop: 12 }}>
          {docs.map((d, i) => (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-sm)", padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: "0.82rem", color: "var(--ink-mute)", fontWeight: 600 }}>Document {i + 1}</span>
                <button type="button" className="icon-btn" onClick={() => removeDoc(i)}><Icon name="trash" size={13}/></button>
              </div>
              <div className="field"><label>Titre du document</label><input value={d.titre} onChange={e => updateDoc(i, 'titre', e.target.value)} placeholder="Règlement intérieur"/></div>
              <div className="row-2">
                <div className="field"><label>Méta (date · poids)</label><input value={d.meta} onChange={e => updateDoc(i, 'meta', e.target.value)} placeholder="Janvier 2024 · 240 ko"/></div>
                <div className="field"><label>URL de téléchargement</label><input value={d.url} onChange={e => updateDoc(i, 'url', e.target.value)} placeholder="/documents/reglement.pdf"/></div>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addDoc}><Icon name="plus" size={13}/> Ajouter un document</button>
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
