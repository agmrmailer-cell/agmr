'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import PhotoUpload from '@/components/admin/PhotoUpload'
import HelpTip from '@/components/ui/HelpTip'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default function AdminComiteSection() {
  const [activeTab, setActiveTab]   = useState('bureau')
  const [bureau, setBureau]         = useState([])
  const [animateurs, setAnimateurs] = useState([])
  const [loading, setLoading]       = useState(true)
  const [editingB, setEditingB]     = useState(null)
  const [editingA, setEditingA]     = useState(null)
  const supabase = createClient()

  const load = async () => {
    const [bRes, aRes] = await Promise.all([
      supabase.from('bureau').select('*').order('ordre'),
      supabase.from('gym_animateurs').select('*').order('ordre'),
    ])
    if (!bRes.error) setBureau(bRes.data)
    if (!aRes.error) setAnimateurs(aRes.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Bureau ops
  const saveBureau = async (data) => {
    const payload = { nom: data.nom, role: data.role, groupe: data.groupe || 'Membres du bureau', photo_url: data.photo_url || null }
    if (data.id) {
      await supabase.from('bureau').update(payload).eq('id', data.id)
    } else {
      const maxOrdre = Math.max(0, ...bureau.map(b => b.ordre || 0))
      await supabase.from('bureau').insert({ ...payload, ordre: maxOrdre + 1 })
    }
    setEditingB(null); load()
  }
  const deleteBureau = async (id) => {
    if (!confirm('Supprimer ce membre ?')) return
    await supabase.from('bureau').delete().eq('id', id)
    load()
  }

  // Animateur ops
  const saveAnim = async (data) => {
    const payload = { nom: data.nom, role: data.role, disciplines: data.disciplines, photo_url: data.photo_url || null }
    if (data.id) {
      await supabase.from('gym_animateurs').update(payload).eq('id', data.id)
    } else {
      const maxOrdre = Math.max(0, ...animateurs.map(a => a.ordre || 0))
      await supabase.from('gym_animateurs').insert({ ...payload, ordre: maxOrdre + 1, visible: true })
    }
    setEditingA(null); load()
  }
  const toggleAnimVisible = async (id, current) => {
    await supabase.from('gym_animateurs').update({ visible: !current }).eq('id', id)
    load()
  }
  const deleteAnim = async (id) => {
    if (!confirm('Supprimer cet animateur ?')) return
    await supabase.from('gym_animateurs').delete().eq('id', id)
    load()
  }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  const tabs = [
    ['bureau',    `Bureau (${bureau.length})`],
    ['animateurs',`Animateurs (${animateurs.length})`],
  ]

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Comité directeur <HelpTip text="Gérez les membres du bureau de l'association et les animateurs de la section gym. Ces informations apparaissent sur la page publique du comité directeur." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Bureau et animateurs</p>
        </div>
        <a className="btn btn-ghost btn-sm" href="/association/comite-directeur" target="_blank" rel="noopener noreferrer">Voir la page →</a>
      </div>

      <div style={{ display: "flex", marginBottom: 28, borderBottom: "1px solid var(--line)" }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: activeTab === id ? "2px solid var(--accent)" : "2px solid transparent", color: activeTab === id ? "var(--ink)" : "var(--ink-mute)", cursor: "pointer", fontFamily: "var(--sans)", fontSize: "0.92rem", fontWeight: activeTab === id ? 600 : 400, marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Bureau ── */}
      {activeTab === 'bureau' && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setEditingB({ nom: '', role: '', groupe: 'Membres du bureau', photo_url: '' })}>
              <Icon name="plus" size={14}/> Ajouter un membre <HelpTip text="Ajoute une personne au bureau de l'association. Renseignez son nom, son rôle (ex : Président, Trésorière) et son groupe (Bureau exécutif, Membres du bureau…). La photo est optionnelle." position="bottom" />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bureau.map(b => (
              <div key={b.id} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                {b.photo_url ? (
                  <img src={b.photo_url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "50%", border: "1px solid var(--line)", flexShrink: 0 }}/>
                ) : (
                  <div style={{ width: 44, height: 44, background: "var(--bg-deep)", borderRadius: "50%", border: "1px solid var(--line)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontSize: "1.1rem", fontWeight: 600, color: "var(--ink-mute)", flexShrink: 0 }}>
                    {b.nom?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{b.nom}</div>
                  <div className="muted" style={{ fontSize: "0.84rem" }}>{b.role}</div>
                  <div style={{ fontSize: "0.76rem", color: "var(--ink-mute)", marginTop: 2 }}>{b.groupe}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="icon-btn" onClick={() => setEditingB(b)}><Icon name="edit" size={14}/></button>
                  <button className="icon-btn" onClick={() => deleteBureau(b.id)}><Icon name="trash" size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Animateurs ── */}
      {activeTab === 'animateurs' && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setEditingA({ nom: '', role: '', disciplines: '', photo_url: '' })}>
              <Icon name="plus" size={14}/> Ajouter un animateur <HelpTip text="Ajoute un animateur à la liste de l'équipe gym. Renseignez son nom, son titre et les disciplines qu'il enseigne (ex : Pilates, Yoga). L'interrupteur Visible/Masqué permet de le cacher temporairement." position="bottom" />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {animateurs.map(a => (
              <div key={a.id} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, opacity: a.visible ? 1 : 0.5 }}>
                {a.photo_url ? (
                  <img src={a.photo_url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "50%", border: "1px solid var(--line)", flexShrink: 0 }}/>
                ) : (
                  <div style={{ width: 44, height: 44, background: "var(--bg-deep)", borderRadius: "50%", border: "1px solid var(--line)", display: "grid", placeItems: "center", fontFamily: "var(--serif)", fontSize: "1.1rem", fontWeight: 600, color: "var(--ink-mute)", flexShrink: 0 }}>
                    {a.nom?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{a.nom}</div>
                  <div className="muted" style={{ fontSize: "0.84rem" }}>{a.role}</div>
                  {a.disciplines && <div style={{ fontSize: "0.82rem", color: "var(--ink-mute)", marginTop: 2 }}>{a.disciplines}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>{a.visible ? 'Visible' : 'Masqué'}</span>
                  <button className={`switch ${a.visible ? 'on' : ''}`} onClick={() => toggleAnimVisible(a.id, a.visible)}/>
                  <button className="icon-btn" onClick={() => setEditingA(a)}><Icon name="edit" size={14}/></button>
                  <button className="icon-btn" onClick={() => deleteAnim(a.id)}><Icon name="trash" size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editingB && (
        <Modal title={editingB.id ? 'Modifier le membre' : 'Nouveau membre'} onClose={() => setEditingB(null)}>
          <BureauForm item={editingB} onSave={saveBureau} onCancel={() => setEditingB(null)} supabase={supabase}/>
        </Modal>
      )}
      {editingA && (
        <Modal title={editingA.id ? "Modifier l'animateur" : 'Nouvel animateur'} onClose={() => setEditingA(null)}>
          <AnimForm item={editingA} onSave={saveAnim} onCancel={() => setEditingA(null)} supabase={supabase}/>
        </Modal>
      )}
    </>
  )
}

const GROUPES_BUREAU = ['Bureau exécutif', 'Responsables d\'activités', 'Membres du bureau']

function BureauForm({ item, onSave, onCancel, supabase }) {
  const [f, setF] = useState({ nom: item.nom ?? '', role: item.role ?? '', groupe: item.groupe ?? 'Membres du bureau', photo_url: item.photo_url ?? '', id: item.id })
  const u = (k, v) => setF(p => ({ ...p, [k]: v }))
  return (
    <div className="form">
      <div className="field"><label>Photo</label><PhotoUpload value={f.photo_url} onChange={v => u('photo_url', v)} supabase={supabase} folder="bureau"/></div>
      <div className="field"><label>Nom complet</label><input value={f.nom} onChange={e => u('nom', e.target.value)} placeholder="Prénom NOM"/></div>
      <div className="row-2">
        <div className="field">
          <label>Groupe</label>
          <select value={f.groupe} onChange={e => u('groupe', e.target.value)}>
            {GROUPES_BUREAU.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="field"><label>Rôle / fonction</label><input value={f.role} onChange={e => u('role', e.target.value)} placeholder="Président"/></div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(f)}>Enregistrer</button>
      </div>
    </div>
  )
}

function AnimForm({ item, onSave, onCancel, supabase }) {
  const [f, setF] = useState({ nom: item.nom ?? '', role: item.role ?? '', disciplines: item.disciplines ?? '', photo_url: item.photo_url ?? '', id: item.id })
  const u = (k, v) => setF(p => ({ ...p, [k]: v }))
  return (
    <div className="form">
      <div className="field"><label>Photo</label><PhotoUpload value={f.photo_url} onChange={v => u('photo_url', v)} supabase={supabase} folder="animateurs"/></div>
      <div className="field"><label>Nom complet</label><input value={f.nom} onChange={e => u('nom', e.target.value)}/></div>
      <div className="field"><label>Rôle / titre</label><input value={f.role} onChange={e => u('role', e.target.value)} placeholder="Animatrice diplômée d'État"/></div>
      <div className="field"><label>Disciplines</label><input value={f.disciplines} onChange={e => u('disciplines', e.target.value)} placeholder="Pilates, Yoga…"/></div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={() => onSave(f)}>Enregistrer</button>
      </div>
    </div>
  )
}
