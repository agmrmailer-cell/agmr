'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import HelpTip from '@/components/ui/HelpTip'
import { GENERIC_BLOCKS, genericType } from '@/lib/generic-blocks'
import SortableBlockList from '@/components/admin/SortableBlockList'

const RANDO_BLOCK_META = {
  header:     { label: 'En-tête de page',         desc: 'Accroche, titre principal, chapeau' },
  intro:      { label: 'Introduction',             desc: "Texte d'intro et encadré important (fiche santé)" },
  jeudi:      { label: 'Randonnées du jeudi',      desc: 'Titre, texte intro et note sous le tableau des groupes' },
  dimanche:   { label: 'Randonnées du dimanche',   desc: 'Titre et deux paragraphes' },
  sejours:    { label: 'Sorties & séjours',        desc: 'Titre, texte et lien vers la page séjours' },
  temoignage: { label: 'Témoignage',               desc: 'Citation, nom et rôle de l\'adhérent' },
  sante:      { label: 'Rando-Santé',              desc: 'Bloc vert en bas de page, lien vers la page santé' },
}

const NORDIQUE_BLOCK_META = {
  header: { label: 'En-tête de section',    desc: 'Accroche, titre et chapeau de la section Marche nordique' },
  intro:  { label: 'Introduction',          desc: 'Citation italique et encadré accroche (prêt de bâtons)' },
  seance: { label: "Déroulé d'une séance",  desc: 'Titre, texte intro et liste des étapes' },
  quand:  { label: 'Quand pratiquer',       desc: 'Titre + cartes horaires/encadrement (ajout/suppression possible)' },
}

const DEFAULT_NORDIQUE_CARDS = [
  { eyebrow: 'Mardi après-midi', titre: 'Séance hebdomadaire',   texte: 'Calendrier variable — consulter la page planning pour les horaires exacts.' },
  { eyebrow: 'Samedi matin',     titre: 'Séance hebdomadaire',   texte: 'Calendrier disponible en ligne.' },
  { eyebrow: 'Ponctuel',         titre: 'Sorties nocturnes',     texte: 'À certaines dates, annoncées dans le planning. Lampe frontale recommandée.' },
  { eyebrow: 'Encadrement',      titre: 'Animateurs formés FFR', texte: 'Pierre et Danièle assurent les séances, formés par la Fédération Française de Randonnée.' },
]

// ── Modal ──────────────────────────────────────────────────────
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

// ── InlineBlockLabel ─────────────────────────────────────────
function InlineBlockLabel({ label, onSave }) {
  const [editing, setEditing] = React.useState(false)
  const [val, setVal] = React.useState(label)
  React.useEffect(() => { setVal(label) }, [label])
  if (editing) return (
    <input
      autoFocus
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { onSave(val); setEditing(false) }}
      onKeyDown={e => {
        if (e.key === 'Enter') { onSave(val); setEditing(false) }
        if (e.key === 'Escape') { setVal(label); setEditing(false) }
      }}
      style={{ fontWeight: 600, fontSize: "0.95rem", padding: "2px 6px", border: "1px solid var(--accent)", borderRadius: 4, fontFamily: "inherit", background: "var(--bg-card)", color: "var(--ink)", width: "100%" }}
    />
  )
  return (
    <div
      style={{ fontWeight: 600, fontSize: "0.95rem", cursor: "text", display: "flex", alignItems: "center", gap: 6 }}
      onClick={() => setEditing(true)}
      title="Cliquer pour renommer"
    >
      {label}
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </div>
  )
}

// ── Shared CRUD hook for a *_page_blocks table ──────────────────
function useBlockTable(table) {
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = async () => {
    const { data, error } = await supabase.from(table).select('*').order('ordre')
    if (!error) setBlocks(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggleVisible = async (block_key, current) => {
    await supabase.from(table).update({ visible: !current }).eq('block_key', block_key)
    load()
  }
  const saveBlock = async (block_key, content) => {
    await supabase.from(table).update({ content }).eq('block_key', block_key)
    load()
  }
  const moveBlock = async (idx, dir) => {
    const target = blocks[idx + dir]
    const current = blocks[idx]
    if (!target) return
    await supabase.from(table).update({ ordre: target.ordre }).eq('id', current.id)
    await supabase.from(table).update({ ordre: current.ordre }).eq('id', target.id)
    load()
  }
  const renameBlock = async (id, newLabel) => {
    if (!newLabel.trim()) return
    await supabase.from(table).update({ label: newLabel.trim() }).eq('id', id)
    load()
  }
  const handleReorder = async (newBlocks) => {
    const updates = newBlocks.map((b, i) => ({ id: b.id, ordre: (i + 1) * 10 }))
    await Promise.all(updates.map(u => supabase.from(table).update({ ordre: u.ordre }).eq('id', u.id)))
    load()
  }
  const deleteBlock = async (block, label) => {
    if (!confirm(`Supprimer le bloc "${label}" ?`)) return
    await supabase.from(table).delete().eq('id', block.id)
    load()
  }
  const addBlock = async (meta, key, customLabel) => {
    const maxOrdre = Math.max(0, ...blocks.map(b => b.ordre ?? 0))
    await supabase.from(table).insert({ block_key: key, label: customLabel || (genericType(key) ? (GENERIC_BLOCKS.find(g => g.type === genericType(key))?.label ?? key) : (meta[key]?.label ?? key)), visible: true, content: {}, ordre: maxOrdre + 10 })
    load()
  }

  return { blocks, loading, toggleVisible, saveBlock, moveBlock, renameBlock, handleReorder, deleteBlock, addBlock }
}

// ── Shared block list + catalogue + edit modal ──────────────────
function BlockManager({ meta, ctrl, FormComponent }) {
  const [editing, setEditing] = useState(null)
  const [showCatalogue, setShowCatalogue] = useState(false)
  const [pendingGeneric, setPendingGeneric] = useState(null)

  const existingKeys = new Set(ctrl.blocks.map(b => b.block_key))
  const catalogueItems = Object.entries(meta).filter(([key]) => !existingKeys.has(key))

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowCatalogue(true)}>
          <Icon name="plus" size={13}/> Ajouter un bloc
        </button>
      </div>
      <SortableBlockList
        blocks={ctrl.blocks}
        onReorder={ctrl.handleReorder}
        renderBlock={(block, idx, total) => {
          const m = meta[block.block_key] ?? { label: block.label ?? block.block_key, desc: '' }
          return (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, opacity: block.visible ? 1 : 0.5 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button className="icon-btn" disabled={idx === 0} onClick={() => ctrl.moveBlock(idx, -1)} style={{ background: "#1a2e1e", borderColor: "#1a2e1e", color: "#fff", opacity: idx === 0 ? 0.3 : 1 }}><Icon name="chevronUp" size={16}/></button>
                <button className="icon-btn" disabled={idx === total - 1} onClick={() => ctrl.moveBlock(idx, 1)} style={{ background: "#1a2e1e", borderColor: "#1a2e1e", color: "#fff", opacity: idx === total - 1 ? 0.3 : 1 }}><Icon name="chevronDown" size={16}/></button>
              </div>
              <div style={{ flex: 1 }}>
                <InlineBlockLabel label={m.label} onSave={lbl => ctrl.renameBlock(block.id, lbl)} />
                <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>{m.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>
                  {block.visible ? 'Visible' : 'Masqué'}
                </span>
                <button className={`switch ${block.visible ? 'on' : ''}`} onClick={() => ctrl.toggleVisible(block.block_key, block.visible)}/>
                <button className="icon-btn" onClick={() => setEditing(block)}>
                  <Icon name="edit" size={14}/>
                </button>
                <button className="icon-btn" onClick={() => ctrl.deleteBlock(block, m.label)} style={{ color: 'var(--red)' }}>
                  <Icon name="trash" size={14}/>
                </button>
              </div>
            </div>
          )
        }}
      />

      {showCatalogue && (
        <Modal title="Ajouter un bloc" onClose={() => { setShowCatalogue(false); setPendingGeneric(null) }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {catalogueItems.length > 0 && <>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-mute)", marginBottom: 4 }}>Blocs de page</div>
                {catalogueItems.map(([key, m]) => (
                  <button key={key} onClick={() => { ctrl.addBlock(meta, key); setShowCatalogue(false) }} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 18px", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-mute)" }}>{m.desc}</span>
                  </button>
                ))}
                <div style={{ margin: "8px 0 4px", borderTop: "1px solid var(--line-soft)" }}/>
              </>}
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-mute)", marginBottom: 4 }}>Blocs réutilisables</div>
              {GENERIC_BLOCKS.map(g => (
                pendingGeneric?.type === g.type ? (
                  <div key={g.type} style={{ background: "var(--bg-deep)", border: "2px solid var(--accent)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <span style={{ fontWeight: 600 }}>{g.label}</span>
                    <input
                      autoFocus
                      value={pendingGeneric.label}
                      onChange={e => setPendingGeneric(p => ({ ...p, label: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && pendingGeneric.label.trim()) { ctrl.addBlock(meta, `${g.type}_${Date.now()}`, pendingGeneric.label.trim()); setPendingGeneric(null); setShowCatalogue(false) }
                        if (e.key === 'Escape') setPendingGeneric(null)
                      }}
                      placeholder={`Nommer ce bloc (ex : ${g.label})`}
                      style={{ padding: "8px 12px", border: "1px solid var(--line-strong)", borderRadius: "var(--r-sm)", fontFamily: "inherit", fontSize: "0.94rem", background: "var(--bg-card)", color: "var(--ink)", width: "100%" }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary btn-sm" disabled={!pendingGeneric.label.trim()} onClick={() => { ctrl.addBlock(meta, `${g.type}_${Date.now()}`, pendingGeneric.label.trim()); setPendingGeneric(null); setShowCatalogue(false) }}>
                        Ajouter
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setPendingGeneric(null)}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  <button key={g.type} onClick={() => setPendingGeneric({ type: g.type, label: g.label })} style={{ background: "var(--bg-deep)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 18px", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>{g.label}</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--ink-mute)" }}>{g.desc}</span>
                  </button>
                )
              ))}
            </div>
        </Modal>
      )}

      {editing && (
        <Modal title={`Modifier — ${meta[editing.block_key]?.label ?? editing.block_key}`} onClose={() => setEditing(null)}>
          <FormComponent block={editing} onSave={(key, content) => { ctrl.saveBlock(key, content); setEditing(null) }} onCancel={() => setEditing(null)}/>
        </Modal>
      )}
    </>
  )
}

// ── Generic fields shared by both forms ──────────────────────────
function GenericFields({ blockKey, c, u }) {
  const type = genericType(blockKey)
  return (
    <>
      {type === 'texte' && <>
        <div className="field"><label>Titre</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
        </div>
        <div className="field"><label>Texte</label>
          <textarea rows={5} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
      </>}
      {type === 'citation' && <>
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
      {type === 'cta' && <>
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
      {type === 'alerte' && <>
        <div className="field"><label>Titre (optionnel)</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
        </div>
        <div className="field"><label>Texte</label>
          <textarea rows={4} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
      </>}
    </>
  )
}

// ── Rando block form ─────────────────────────────────────────────
function RandoBlockForm({ block, onSave, onCancel }) {
  const [c, setC] = useState(block.content ?? {})
  const u = (k, v) => setC(prev => ({ ...prev, [k]: v }))
  const key = block.block_key

  return (
    <div className="form">

      {key === 'header' && <>
        <div className="field"><label>Accroche (eyebrow)</label>
          <input value={c.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)} placeholder="Activités · Fédération Française de Randonnée"/>
        </div>
        <div className="field"><label>Titre H1</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="La Randonnée"/>
        </div>
        <div className="field"><label>Chapeau</label>
          <textarea rows={3} value={c.lede ?? ''} onChange={e => u('lede', e.target.value)} placeholder="Forêt de Rambouillet et alentours…"/>
        </div>
      </>}

      {key === 'intro' && <>
        <div className="field"><label>Titre de section</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Marcher dans la forêt de Rambouillet"/>
        </div>
        <div className="field"><label>Paragraphe principal</label>
          <textarea rows={4} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
        <div className="field"><label>Texte de l'encadré Important</label>
          <textarea rows={3} value={c.alerte ?? ''} onChange={e => u('alerte', e.target.value)} placeholder="tout randonneur devrait avoir dans son sac…"/>
        </div>
        <div className="row-2">
          <div className="field"><label>Lien de l'encadré — texte</label>
            <input value={c.alerte_lien_texte ?? ''} onChange={e => u('alerte_lien_texte', e.target.value)} placeholder="Télécharger la fiche"/>
          </div>
          <div className="field"><label>Lien de l'encadré — URL</label>
            <input value={c.alerte_lien ?? ''} onChange={e => u('alerte_lien', e.target.value)} placeholder="/fichiers/fiche-sante.pdf"/>
          </div>
        </div>
      </>}

      {key === 'jeudi' && <>
        <div className="field"><label>Titre de section</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Les randonnées du jeudi"/>
        </div>
        <div className="field"><label>Texte d'introduction (sous le titre)</label>
          <input value={c.intro ?? ''} onChange={e => u('intro', e.target.value)} placeholder="5 groupes de niveau, chaque jeudi après-midi."/>
        </div>
        <div className="field"><label>Note sous le tableau</label>
          <textarea rows={3} value={c.note ?? ''} onChange={e => u('note', e.target.value)} placeholder="Les groupes 2A et 2B pourront être réunis…"/>
        </div>
      </>}

      {key === 'dimanche' && <>
        <div className="field"><label>Titre de section</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Les randonnées du dimanche"/>
        </div>
        <div className="field"><label>Premier paragraphe</label>
          <textarea rows={3} value={c.texte1 ?? ''} onChange={e => u('texte1', e.target.value)}/>
        </div>
        <div className="field"><label>Deuxième paragraphe</label>
          <textarea rows={3} value={c.texte2 ?? ''} onChange={e => u('texte2', e.target.value)}/>
        </div>
      </>}

      {key === 'sejours' && <>
        <div className="field"><label>Titre de section</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Sorties à la journée et séjours"/>
        </div>
        <div className="field"><label>Texte</label>
          <textarea rows={3} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Bouton — texte</label>
            <input value={c.cta_texte ?? ''} onChange={e => u('cta_texte', e.target.value)} placeholder="Voir les séjours"/>
          </div>
          <div className="field"><label>Bouton — lien</label>
            <input value={c.cta_lien ?? ''} onChange={e => u('cta_lien', e.target.value)} placeholder="/actualites/sejours"/>
          </div>
        </div>
      </>}

      {key === 'temoignage' && <>
        <div className="field"><label>Citation</label>
          <textarea rows={3} value={c.citation ?? ''} onChange={e => u('citation', e.target.value)} placeholder="On marche en silence dans la forêt…"/>
        </div>
        <div className="row-2">
          <div className="field"><label>Nom / prénom</label>
            <input value={c.auteur ?? ''} onChange={e => u('auteur', e.target.value)} placeholder="Jean-Pierre, animateur rando"/>
          </div>
          <div className="field"><label>Rôle / ancienneté</label>
            <input value={c.role ?? ''} onChange={e => u('role', e.target.value)} placeholder="Bénévole depuis 2014"/>
          </div>
        </div>
      </>}

      {key === 'sante' && <>
        <div className="field"><label>Titre</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Rando-Santé"/>
        </div>
        <div className="field"><label>Texte</label>
          <textarea rows={4} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Bouton — texte</label>
            <input value={c.cta_texte ?? ''} onChange={e => u('cta_texte', e.target.value)} placeholder="En savoir plus"/>
          </div>
          <div className="field"><label>Bouton — lien</label>
            <input value={c.cta_lien ?? ''} onChange={e => u('cta_lien', e.target.value)} placeholder="/activites/sante"/>
          </div>
        </div>
      </>}

      <GenericFields blockKey={key} c={c} u={u} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(block.block_key, c)}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── Nordique block form ───────────────────────────────────────────
function NordiqueBlockForm({ block, onSave, onCancel }) {
  const [c, setC] = useState(block.content ?? {})
  const u = (k, v) => setC(prev => ({ ...prev, [k]: v }))
  const key = block.block_key

  const cards = Array.isArray(c.cards) ? c.cards : DEFAULT_NORDIQUE_CARDS
  const addCard    = () => u('cards', [...cards, { eyebrow: '', titre: '', texte: '' }])
  const removeCard = (i) => u('cards', cards.filter((_, idx) => idx !== i))
  const updateCard = (i, field, val) => u('cards', cards.map((card, idx) => idx === i ? { ...card, [field]: val } : card))

  const stepsText = Array.isArray(c.steps) ? c.steps.join('\n') : 'Échauffement\nMarche nordique\nRenforcement musculaire\nRetour à la marche\nÉtirements'

  return (
    <div className="form">
      {key === 'header' && <>
        <div className="field"><label>Accroche (eyebrow)</label><input value={c.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)} placeholder="Activités · Marche dynamique"/></div>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="La Marche Nordique"/></div>
        <div className="field"><label>Chapeau</label><textarea rows={3} value={c.lede ?? ''} onChange={e => u('lede', e.target.value)}/></div>
      </>}

      {key === 'intro' && <>
        <div className="field"><label>Citation introductive (italique)</label>
          <textarea rows={4} value={c.quote ?? ''} onChange={e => u('quote', e.target.value)} placeholder="En appuyant sur les bâtons, on va plus vite…"/>
        </div>
        <div className="field"><label>Texte de l'encadré (ex: prêt de bâtons)</label>
          <input value={c.alerte ?? ''} onChange={e => u('alerte', e.target.value)} placeholder="On peut vous prêter des bâtons pour un essai."/>
        </div>
      </>}

      {key === 'seance' && <>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Comment se déroule une séance"/></div>
        <div className="field"><label>Texte d'introduction</label><input value={c.texte ?? ''} onChange={e => u('texte', e.target.value)} placeholder="Chaque séance dure entre 1h30 et 2h."/></div>
        <div className="field">
          <label>Étapes <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(une par ligne)</span></label>
          <textarea rows={6} value={stepsText} onChange={e => u('steps', e.target.value.split('\n').filter(l => l.trim()))}/>
        </div>
      </>}

      {key === 'quand' && <>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Quand pratiquer"/></div>
        <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600, fontSize: "0.9rem" }}>Cartes ({cards.length})</div>
        {cards.map((card, i) => (
          <div key={i} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-sm)", padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: "0.82rem", color: "var(--ink-mute)", fontWeight: 600 }}>Carte {i + 1}</span>
              <button type="button" className="icon-btn" onClick={() => removeCard(i)}><Icon name="trash" size={13}/></button>
            </div>
            <div className="row-2">
              <div className="field"><label>Accroche</label><input value={card.eyebrow} onChange={e => updateCard(i, 'eyebrow', e.target.value)} placeholder="Mardi après-midi"/></div>
              <div className="field"><label>Titre</label><input value={card.titre} onChange={e => updateCard(i, 'titre', e.target.value)} placeholder="Séance hebdomadaire"/></div>
            </div>
            <div className="field"><label>Texte</label><textarea rows={2} value={card.texte} onChange={e => updateCard(i, 'texte', e.target.value)}/></div>
          </div>
        ))}
        <button type="button" className="btn btn-ghost btn-sm" onClick={addCard} style={{ marginTop: 4 }}>
          <Icon name="plus" size={13}/> Ajouter une carte
        </button>
      </>}

      <GenericFields blockKey={key} c={c} u={u} />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(block.block_key, c)}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── Groupe form ────────────────────────────────────────────────
function GroupeForm({ groupe, onSave, onCancel }) {
  const [f, setF] = useState({
    groupe:   groupe.groupe   ?? '',
    distance: groupe.distance ?? '',
    retour:   groupe.retour   ?? '',
    rdv:      groupe.rdv      ?? '',
    id:       groupe.id,
  })
  const u = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  return (
    <div className="form">
      <div className="row-2">
        <div className="field"><label>Nom du groupe</label>
          <input value={f.groupe} onChange={e => u('groupe', e.target.value)} placeholder="Groupe 1, Groupe 2A…"/>
        </div>
        <div className="field"><label>Distance</label>
          <input value={f.distance} onChange={e => u('distance', e.target.value)} placeholder="12 à 14 km"/>
        </div>
      </div>
      <div className="row-2">
        <div className="field"><label>Retour vers</label>
          <input value={f.retour} onChange={e => u('retour', e.target.value)} placeholder="17h30"/>
        </div>
        <div className="field"><label>Point de RDV</label>
          <input value={f.rdv} onChange={e => u('rdv', e.target.value)} placeholder="Parking Leclerc"/>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(f)}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function AdminRandoPageSection() {
  const [activeTab, setActiveTab] = useState('blocs')
  const randoCtrl    = useBlockTable('rando_page_blocks')
  const nordiqueCtrl = useBlockTable('nordique_page_blocks')
  const [groupes, setGroupes]               = useState([])
  const [groupesLoading, setGroupesLoading] = useState(true)
  const [editingGroupe, setEditingGroupe]   = useState(null)
  const supabase = createClient()

  const loadGroupes = async () => {
    const { data, error } = await supabase.from('rando_jeudi_groupes').select('*').order('ordre')
    if (!error) setGroupes(data)
    setGroupesLoading(false)
  }
  useEffect(() => { loadGroupes() }, [])

  const saveGroupe = async (data) => {
    const payload = { groupe: data.groupe, distance: data.distance, retour: data.retour, rdv: data.rdv }
    if (data.id) {
      await supabase.from('rando_jeudi_groupes').update(payload).eq('id', data.id)
    } else {
      const maxOrdre = Math.max(0, ...groupes.map(g => g.ordre || 0))
      await supabase.from('rando_jeudi_groupes').insert({ ...payload, ordre: maxOrdre + 1 })
    }
    setEditingGroupe(null)
    loadGroupes()
  }
  const deleteGroupe = async (id) => {
    if (!confirm('Supprimer ce groupe ?')) return
    await supabase.from('rando_jeudi_groupes').delete().eq('id', id)
    loadGroupes()
  }

  if (randoCtrl.loading || nordiqueCtrl.loading || groupesLoading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  const tabs = [
    ['blocs',    'Randonnée'],
    ['nordique', 'Marche nordique'],
    ['groupes',  `Groupes du jeudi (${groupes.length})`],
  ]

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Page Randonnée & Marche nordique <HelpTip text="Gérez le contenu de la page publique fusionnée : les textes de présentation, les sorties du jeudi et du dimanche, la section Marche nordique, et les groupes de niveau du jeudi (distance, horaire, point de RDV)." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Contenu, marche nordique, groupes du jeudi</p>
        </div>
        <a className="btn btn-ghost btn-sm" href="/activites/randonnee" target="_blank" rel="noopener noreferrer">
          Voir la page →
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", marginBottom: 28, borderBottom: "1px solid var(--line)" }}>
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: activeTab === id ? "2px solid var(--accent)" : "2px solid transparent", color: activeTab === id ? "var(--ink)" : "var(--ink-mute)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.92rem", fontWeight: activeTab === id ? 600 : 400, marginBottom: -1 }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Blocs Randonnée tab ── */}
      {activeTab === 'blocs' && (
        <BlockManager meta={RANDO_BLOCK_META} ctrl={randoCtrl} FormComponent={RandoBlockForm}/>
      )}

      {/* ── Blocs Marche nordique tab ── */}
      {activeTab === 'nordique' && (
        <BlockManager meta={NORDIQUE_BLOCK_META} ctrl={nordiqueCtrl} FormComponent={NordiqueBlockForm}/>
      )}

      {/* ── Groupes du jeudi tab ── */}
      {activeTab === 'groupes' && (
        <>
          <div style={{ marginBottom: 14, padding: "10px 16px", background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", fontSize: "0.88rem", color: "var(--ink-mute)" }}>
            Ces groupes apparaissent dans le tableau de la section « Randonnées du jeudi ». L'ordre est celui de la saisie (modifiable via le champ Ordre).
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setEditingGroupe({ groupe: '', distance: '', retour: '', rdv: '' })}>
              <Icon name="plus" size={14}/> Ajouter un groupe <HelpTip text="Ajoute un groupe de randonnée du jeudi. Renseignez le nom du groupe (ex : Groupe 1), la distance habituelle, l'heure de retour et le point de rendez-vous. Ces infos s'affichent dans le tableau sur la page Randonnée." position="bottom" />
            </button>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Groupe</th><th>Distance</th><th>Retour vers</th><th>Point de RDV</th><th></th></tr>
            </thead>
            <tbody>
              {groupes.map(g => (
                <tr key={g.id}>
                  <td><strong>{g.groupe}</strong></td>
                  <td>{g.distance}</td>
                  <td>{g.retour}</td>
                  <td>{g.rdv}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="icon-btn" onClick={() => setEditingGroupe(g)}><Icon name="edit" size={14}/></button>
                    <button className="icon-btn" onClick={() => deleteGroupe(g.id)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ── Groupe modal ── */}
      {editingGroupe && (
        <Modal title={editingGroupe.id ? 'Modifier le groupe' : 'Nouveau groupe'} onClose={() => setEditingGroupe(null)}>
          <GroupeForm groupe={editingGroupe} onSave={saveGroupe} onCancel={() => setEditingGroupe(null)}/>
        </Modal>
      )}
    </>
  )
}
