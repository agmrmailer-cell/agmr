'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'

const BLOCK_META = {
  header:     { label: 'En-tête de page',         desc: 'Accroche, titre principal, chapeau' },
  intro:      { label: 'Introduction',             desc: "Texte d'intro et encadré important (fiche santé)" },
  jeudi:      { label: 'Randonnées du jeudi',      desc: 'Titre, texte intro et note sous le tableau des groupes' },
  dimanche:   { label: 'Randonnées du dimanche',   desc: 'Titre et deux paragraphes' },
  sejours:    { label: 'Sorties & séjours',        desc: 'Titre, texte et lien vers la page séjours' },
  temoignage: { label: 'Témoignage',               desc: 'Citation, nom et rôle de l\'adhérent' },
  sante:      { label: 'Rando-Santé',              desc: 'Bloc vert en bas de page, lien vers la page santé' },
}

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

// ── Main component ─────────────────────────────────────────────
export default function AdminRandoPageSection() {
  const [activeTab, setActiveTab]   = useState('blocs')
  const [blocks, setBlocks]         = useState([])
  const [groupes, setGroupes]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [editing, setEditing]       = useState(null)   // block
  const [editingGroupe, setEditingGroupe] = useState(null)
  const supabase = createClient()

  const load = async () => {
    const [bRes, gRes] = await Promise.all([
      supabase.from('rando_page_blocks').select('*').order('ordre'),
      supabase.from('rando_jeudi_groupes').select('*').order('ordre'),
    ])
    if (!bRes.error) setBlocks(bRes.data)
    if (!gRes.error) setGroupes(gRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Block ops ────────────────────────────────────────────────
  const toggleBlockVisible = async (block_key, current) => {
    await supabase.from('rando_page_blocks').update({ visible: !current }).eq('block_key', block_key)
    load()
  }
  const saveBlock = async (block_key, content) => {
    await supabase.from('rando_page_blocks').update({ content }).eq('block_key', block_key)
    setEditing(null)
    load()
  }

  // ── Groupe ops ───────────────────────────────────────────────
  const saveGroupe = async (data) => {
    const payload = { groupe: data.groupe, distance: data.distance, retour: data.retour, rdv: data.rdv }
    if (data.id) {
      await supabase.from('rando_jeudi_groupes').update(payload).eq('id', data.id)
    } else {
      const maxOrdre = Math.max(0, ...groupes.map(g => g.ordre || 0))
      await supabase.from('rando_jeudi_groupes').insert({ ...payload, ordre: maxOrdre + 1 })
    }
    setEditingGroupe(null)
    load()
  }
  const deleteGroupe = async (id) => {
    if (!confirm('Supprimer ce groupe ?')) return
    await supabase.from('rando_jeudi_groupes').delete().eq('id', id)
    load()
  }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  const tabs = [
    ['blocs',   'Blocs de la page'],
    ['groupes', `Groupes du jeudi (${groupes.length})`],
  ]

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Page Randonnée</h1>
          <p className="muted" style={{ margin: 0 }}>Contenu, groupes du jeudi</p>
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

      {/* ── Blocs tab ── */}
      {activeTab === 'blocs' && (
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
                  <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>
                    {block.visible ? 'Visible' : 'Masqué'}
                  </span>
                  <button className={`switch ${block.visible ? 'on' : ''}`} onClick={() => toggleBlockVisible(block.block_key, block.visible)}/>
                  <button className="icon-btn" onClick={() => setEditing(block)}>
                    <Icon name="edit" size={14}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Groupes du jeudi tab ── */}
      {activeTab === 'groupes' && (
        <>
          <div style={{ marginBottom: 14, padding: "10px 16px", background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", fontSize: "0.88rem", color: "var(--ink-mute)" }}>
            Ces groupes apparaissent dans le tableau de la section « Randonnées du jeudi ». L'ordre est celui de la saisie (modifiable via le champ Ordre).
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setEditingGroupe({ groupe: '', distance: '', retour: '', rdv: '' })}>
              <Icon name="plus" size={14}/> Ajouter un groupe
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

      {/* ── Block edit modal ── */}
      {editing && (
        <Modal title={`Modifier — ${BLOCK_META[editing.block_key]?.label ?? editing.block_key}`} onClose={() => setEditing(null)}>
          <BlockForm block={editing} onSave={saveBlock} onCancel={() => setEditing(null)}/>
        </Modal>
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

// ── Block form ─────────────────────────────────────────────────
function BlockForm({ block, onSave, onCancel }) {
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

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
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
