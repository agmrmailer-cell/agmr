'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import PdfUpload from '@/components/ui/PdfUpload'
import HelpTip from '@/components/ui/HelpTip'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default function AdminAGSection() {
  const [docs, setDocs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // { id?, saison, titre, url, ordre }
  const [newSaison, setNewSaison] = useState('')
  const [showAddSaison, setShowAddSaison] = useState(false)
  const supabase = createClient()

  const load = async () => {
    const { data, error } = await supabase
      .from('ag_documents')
      .select('*')
      .order('saison', { ascending: false })
      .order('ordre')
    if (!error) setDocs(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Group by saison
  const bySaison = docs.reduce((acc, d) => {
    if (!acc[d.saison]) acc[d.saison] = []
    acc[d.saison].push(d)
    return acc
  }, {})
  const saisons = Object.keys(bySaison)

  const saveDoc = async (data) => {
    const payload = { saison: data.saison, titre: data.titre, url: data.url || '#', ordre: Number(data.ordre) || 0 }
    if (data.id) {
      await supabase.from('ag_documents').update(payload).eq('id', data.id)
    } else {
      await supabase.from('ag_documents').insert(payload)
    }
    setEditing(null); load()
  }

  const deleteDoc = async (id) => {
    if (!confirm('Supprimer ce document ?')) return
    await supabase.from('ag_documents').delete().eq('id', id)
    load()
  }

  const addSaison = async () => {
    const s = newSaison.trim()
    if (!s) return
    // Add a placeholder doc for this saison so it appears immediately
    await supabase.from('ag_documents').insert({ saison: s, titre: 'Procès-verbal', url: '#', ordre: 1 })
    setNewSaison(''); setShowAddSaison(false); load()
  }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Assemblée Générale <HelpTip text="Cette section regroupe les documents officiels (procès-verbaux, comptes rendus) de chaque Assemblée Générale, classés par saison." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Documents par saison</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAddSaison(true)}>
            <Icon name="plus" size={14}/> Nouvelle saison <HelpTip text="Crée un nouveau groupe de documents pour une saison sportive. Exemple : '2025-2026'. Une fois la saison créée, vous pourrez y ajouter des documents PDF." position="bottom" />
          </button>
          <a className="btn btn-ghost btn-sm" href="/association/assemblee-generale" target="_blank" rel="noopener noreferrer">Voir la page →</a>
        </div>
      </div>

      {saisons.length === 0 && (
        <div style={{ padding: 40, color: "var(--ink-mute)", textAlign: "center" }}>
          Aucun document. Commencez par créer une saison.
        </div>
      )}

      {saisons.map(saison => (
        <div key={saison} style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ fontFamily: "var(--sans)", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", margin: 0 }}>
              Saison {saison}
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ saison, titre: '', url: '', ordre: (bySaison[saison].length + 1) })}>
              <Icon name="plus" size={13}/> Ajouter un document <HelpTip text="Ajoute un document PDF à cette saison. Donnez-lui un titre (ex : 'Procès-verbal AG') puis chargez le fichier PDF depuis votre ordinateur." position="bottom" />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bySaison[saison].map(doc => (
              <div key={doc.id} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "12px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                {/* Icône PDF */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={doc.url && doc.url !== '#' ? "var(--accent)" : "var(--ink-mute)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="9" y1="13" x2="15" y2="13"/>
                  <line x1="9" y1="17" x2="15" y2="17"/>
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{doc.titre}</div>
                  {doc.url && doc.url !== '#'
                    ? <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none" }}>Ouvrir le PDF ↗</a>
                    : <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>Aucun fichier</span>
                  }
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button className="icon-btn" onClick={() => setEditing(doc)}><Icon name="edit" size={14}/></button>
                  <button className="icon-btn" onClick={() => deleteDoc(doc.id)}><Icon name="trash" size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Edit / Add document modal */}
      {editing && (
        <Modal title={editing.id ? 'Modifier le document' : 'Nouveau document'} onClose={() => setEditing(null)}>
          <DocForm item={editing} saisons={saisons} onSave={saveDoc} onCancel={() => setEditing(null)}/>
        </Modal>
      )}

      {/* Add saison modal */}
      {showAddSaison && (
        <Modal title="Nouvelle saison" onClose={() => { setShowAddSaison(false); setNewSaison('') }}>
          <div className="form">
            <div className="field">
              <label>Saison (ex : 2024-2025)</label>
              <input value={newSaison} onChange={e => setNewSaison(e.target.value)} placeholder="2025-2026" onKeyDown={e => e.key === 'Enter' && addSaison()}/>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => { setShowAddSaison(false); setNewSaison('') }}>Annuler</button>
              <button className="btn btn-primary" onClick={addSaison}>Créer</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function DocForm({ item, saisons, onSave, onCancel }) {
  const [f, setF] = useState({ id: item.id, saison: item.saison, titre: item.titre ?? '', url: item.url ?? '', ordre: item.ordre ?? 1 })
  const u = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="form">
      <div className="field">
        <label>Saison</label>
        <select value={f.saison} onChange={e => u('saison', e.target.value)}>
          {saisons.map(s => <option key={s} value={s}>{s}</option>)}
          {!saisons.includes(f.saison) && <option value={f.saison}>{f.saison}</option>}
        </select>
      </div>
      <div className="field">
        <label>Titre du document</label>
        <input value={f.titre} onChange={e => u('titre', e.target.value)} placeholder="Procès-verbal AG 2025"/>
      </div>
      <div className="field">
        <label>Fichier PDF</label>
        <PdfUpload
          value={f.url && f.url !== '#' ? f.url : null}
          onChange={url => u('url', url ?? '')}
          folder="ag"
        />
      </div>
      {/* URL manuelle en secours si pas de fichier uploadé */}
      {(!f.url || f.url === '#') && (
        <div className="field">
          <label style={{ color: 'var(--ink-mute)', fontSize: '0.82rem' }}>Ou URL externe</label>
          <input value={f.url === '#' ? '' : f.url} onChange={e => u('url', e.target.value)} placeholder="https://…/document.pdf"/>
        </div>
      )}
      <div className="field">
        <label>Ordre d'affichage</label>
        <input type="number" value={f.ordre} onChange={e => u('ordre', e.target.value)} min={1}/>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(f)}>Enregistrer</button>
      </div>
    </div>
  )
}
