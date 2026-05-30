'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import HelpTip from '@/components/ui/HelpTip'

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

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Page Santé par le sport</h1>
          <p className="muted" style={{ margin: 0 }}>Prescri'Forme & Rando-Santé</p>
        </div>
        <a className="btn btn-ghost btn-sm" href="/activites/sante" target="_blank" rel="noopener noreferrer">Voir la page →</a>
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

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(block.block_key, c)}>Enregistrer</button>
      </div>
    </div>
  )
}
