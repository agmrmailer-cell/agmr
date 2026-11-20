'use client'
import React from 'react'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import HelpTip from '@/components/ui/HelpTip'
import { GENERIC_BLOCKS, genericType } from '@/lib/generic-blocks'
import SortableBlockList from '@/components/admin/SortableBlockList'
import RichTextEditor from '@/components/admin/RichTextEditor'
import GenericBlockFields from '@/components/admin/GenericBlockFields'

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
  const [pendingGeneric, setPendingGeneric] = useState(null)
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

  const renameBlock = async (id, newLabel) => {
    if (!newLabel.trim()) return
    await supabase.from('sante_page_blocks').update({ label: newLabel.trim() }).eq('id', id)
    load()
  }
  const handleReorder = async (newBlocks) => {
    const updates = newBlocks.map((b, i) => ({ id: b.id, ordre: (i + 1) * 10 }))
    await Promise.all(updates.map(u => supabase.from('sante_page_blocks').update({ ordre: u.ordre }).eq('id', u.id)))
    load()
  }
  const deleteBlock = async (block) => {
    if (!confirm(`Supprimer le bloc "${BLOCK_META[block.block_key]?.label ?? block.block_key}" ?`)) return
    await supabase.from('sante_page_blocks').delete().eq('id', block.id)
    load()
  }
  const addBlock = async (key, customLabel) => {
    const maxOrdre = Math.max(0, ...blocks.map(b => b.ordre ?? 0))
    await supabase.from('sante_page_blocks').insert({ block_key: key, label: customLabel || (genericType(key) ? (GENERIC_BLOCKS.find(g => g.type === genericType(key))?.label ?? key) : (BLOCK_META[key]?.label ?? key)), visible: true, content: {}, ordre: maxOrdre + 10 })
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
      <SortableBlockList
        blocks={blocks}
        onReorder={handleReorder}
        renderBlock={(block, idx, total) => {
          const meta = BLOCK_META[block.block_key] ?? { label: block.label ?? block.block_key, desc: '' }
          return (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, opacity: block.visible ? 1 : 0.5 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <button className="icon-btn" disabled={idx === 0} onClick={() => moveBlock(idx, -1)} style={{ background: "#1a2e1e", borderColor: "#1a2e1e", color: "#fff", opacity: idx === 0 ? 0.3 : 1 }}><Icon name="chevronUp" size={16}/></button>
                <button className="icon-btn" disabled={idx === total - 1} onClick={() => moveBlock(idx, 1)} style={{ background: "#1a2e1e", borderColor: "#1a2e1e", color: "#fff", opacity: idx === total - 1 ? 0.3 : 1 }}><Icon name="chevronDown" size={16}/></button>
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
        }}
      />

      {showCatalogue && (
        <Modal title="Ajouter un bloc" onClose={() => { setShowCatalogue(false); setPendingGeneric(null) }}>
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
                pendingGeneric?.type === g.type ? (
                  <div key={g.type} style={{ background: "var(--bg-deep)", border: "2px solid var(--accent)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <span style={{ fontWeight: 600 }}>{g.label}</span>
                    <input
                      autoFocus
                      value={pendingGeneric.label}
                      onChange={e => setPendingGeneric(p => ({ ...p, label: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && pendingGeneric.label.trim()) { addBlock(`${g.type}_${Date.now()}`, pendingGeneric.label.trim()); setPendingGeneric(null) }
                        if (e.key === 'Escape') setPendingGeneric(null)
                      }}
                      placeholder={`Nommer ce bloc (ex : ${g.label})`}
                      style={{ padding: "8px 12px", border: "1px solid var(--line-strong)", borderRadius: "var(--r-sm)", fontFamily: "inherit", fontSize: "0.94rem", background: "var(--bg-card)", color: "var(--ink)", width: "100%" }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-primary btn-sm" disabled={!pendingGeneric.label.trim()} onClick={() => { addBlock(`${g.type}_${Date.now()}`, pendingGeneric.label.trim()); setPendingGeneric(null) }}>
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
        <div className="field"><label>Petite ligne au-dessus du titre</label><input value={c.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)} placeholder="Santé par le Sport · Activités Physiques Adaptées"/></div>
        <div className="field"><label>Titre H1</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Prescri'Forme & Rando-Santé"/></div>
        <div className="field"><label>Chapeau</label><RichTextEditor value={c.lede ?? ''} onChange={v => u('lede', v)} minHeight={84}/></div>
      </>}

      {key === 'prescri' && <>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Prescri'Forme — Sport sur ordonnance"/></div>
        <div className="field"><label>Premier paragraphe</label><RichTextEditor value={c.texte1 ?? ''} onChange={v => u('texte1', v)} minHeight={112}/></div>
        <div className="field"><label>Deuxième paragraphe</label><RichTextEditor value={c.texte2 ?? ''} onChange={v => u('texte2', v)} minHeight={84}/></div>
        <div className="field"><label>Texte Certification</label><RichTextEditor value={c.cert_texte ?? ''} onChange={v => u('cert_texte', v)} minHeight={80}/></div>
        <div className="row-2">
          <div className="field"><label>Lien externe — URL</label><input value={c.lien_url ?? ''} onChange={e => u('lien_url', e.target.value)} placeholder="http://www.lasanteparlesport.fr"/></div>
          <div className="field"><label>Lien externe — texte</label><input value={c.lien_texte ?? ''} onChange={e => u('lien_texte', e.target.value)} placeholder="lasanteparlesport.fr"/></div>
        </div>
      </>}

      {key === 'rando_sante' && <>
        <div className="field"><label>Titre de section</label><input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Rando-Santé — Marche adaptée"/></div>
        <div className="field"><label>Texte</label><RichTextEditor value={c.texte ?? ''} onChange={v => u('texte', v)} minHeight={84}/></div>
        <div className="field"><label>Citation mise en avant</label><RichTextEditor simple value={c.citation ?? ''} onChange={v => u('citation', v)} minHeight={70}/></div>
      </>}

      {key === 'temoignage' && <>
        <div className="field"><label>Citation</label><RichTextEditor simple value={c.citation ?? ''} onChange={v => u('citation', v)} minHeight={70}/></div>
        <div className="row-2">
          <div className="field"><label>Nom / prénom</label><input value={c.auteur ?? ''} onChange={e => u('auteur', e.target.value)} placeholder="Henri, 71 ans"/></div>
          <div className="field"><label>Rôle / contexte</label><input value={c.role ?? ''} onChange={e => u('role', e.target.value)} placeholder="Cours Prescri'Forme"/></div>
        </div>
      </>}


      {/* Blocs génériques */}
      <GenericBlockFields blockKey={block.block_key} c={c} u={u}/>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(block.block_key, c)}>Enregistrer</button>
      </div>
    </div>
  )
}
