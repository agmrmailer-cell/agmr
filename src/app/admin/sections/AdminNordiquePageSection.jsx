'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import HelpTip from '@/components/ui/HelpTip'

const BLOCK_META = {
  header: { label: 'En-tête de page',       desc: 'Accroche, titre principal, chapeau' },
  intro:  { label: 'Introduction',          desc: 'Citation italique et encadré accroche (prêt de bâtons)' },
  seance: { label: "Déroulé d'une séance",  desc: 'Titre, texte intro et liste des étapes' },
  quand:  { label: 'Quand pratiquer',       desc: 'Titre + cartes horaires/encadrement (ajout/suppression possible)' },
}

const DEFAULT_CARDS = [
  { eyebrow: 'Mardi après-midi', titre: 'Séance hebdomadaire',   texte: 'Calendrier variable — consulter la page planning pour les horaires exacts.' },
  { eyebrow: 'Samedi matin',     titre: 'Séance hebdomadaire',   texte: 'Calendrier disponible en ligne.' },
  { eyebrow: 'Ponctuel',         titre: 'Sorties nocturnes',     texte: 'À certaines dates, annoncées dans le planning. Lampe frontale recommandée.' },
  { eyebrow: 'Encadrement',      titre: 'Animateurs formés FFR', texte: 'Pierre et Danièle assurent les séances, formés par la Fédération Française de Randonnée.' },
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

export default function AdminNordiquePageSection() {
  const [blocks, setBlocks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const supabase = createClient()

  const load = async () => {
    const { data, error } = await supabase.from('nordique_page_blocks').select('*').order('ordre')
    if (!error) setBlocks(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggleVisible = async (key, current) => {
    await supabase.from('nordique_page_blocks').update({ visible: !current }).eq('block_key', key)
    load()
  }
  const saveBlock = async (key, content) => {
    await supabase.from('nordique_page_blocks').update({ content }).eq('block_key', key)
    setEditing(null); load()
  }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Page Marche Nordique <HelpTip text="Gérez le contenu de la page publique dédiée à la Marche Nordique. Chaque bloc correspond à une section de la page : en-tête, introduction, déroulé d'une séance et horaires. Modifiez les textes ou masquez des sections si besoin." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Contenu et blocs de la page</p>
        </div>
        <a className="btn btn-ghost btn-sm" href="/activites/nordique" target="_blank" rel="noopener noreferrer">Voir la page →</a>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {blocks.map(block => {
          const meta = BLOCK_META[block.block_key] ?? { label: block.block_key, desc: '' }
          return (
            <div key={block.block_key} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, opacity: block.visible ? 1 : 0.5 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{meta.label}</div>
                <div className="muted" style={{ fontSize: "0.82rem", marginTop: 2 }}>{meta.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>{block.visible ? 'Visible' : 'Masqué'}</span>
                <button className={`switch ${block.visible ? 'on' : ''}`} onClick={() => toggleVisible(block.block_key, block.visible)}/>
                <button className="icon-btn" onClick={() => setEditing(block)}><Icon name="edit" size={14}/></button>
              </div>
            </div>
          )
        })}
      </div>

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

  // Cards helpers for 'quand'
  const cards = Array.isArray(c.cards) ? c.cards : DEFAULT_CARDS
  const addCard    = () => u('cards', [...cards, { eyebrow: '', titre: '', texte: '' }])
  const removeCard = (i) => u('cards', cards.filter((_, idx) => idx !== i))
  const updateCard = (i, field, val) => u('cards', cards.map((card, idx) => idx === i ? { ...card, [field]: val } : card))

  // Steps helpers for 'seance'
  const stepsText = Array.isArray(c.steps) ? c.steps.join('\n') : 'Échauffement\nMarche nordique\nRenforcement musculaire\nRetour à la marche\nÉtirements'

  return (
    <div className="form">
      {key === 'header' && <>
        <div className="field"><label>Accroche (eyebrow)</label><input value={c.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)} placeholder="Activités · Marche dynamique"/></div>
        <div className="field"><label>Titre H1</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="La Marche Nordique"/></div>
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

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(block.block_key, c)}>Enregistrer</button>
      </div>
    </div>
  )
}
