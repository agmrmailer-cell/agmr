'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import PhotoUpload from '@/components/admin/PhotoUpload'
import HelpTip from '@/components/ui/HelpTip'
import { GENERIC_BLOCKS, genericType } from '@/lib/generic-blocks'

const BLOCK_META = {
  header:    { label: 'En-tête de page',          desc: 'Accroche, titre principal, chapeau' },
  intro:     { label: 'Introduction',              desc: "Présentation de la section gym, paragraphes" },
  programme: { label: 'Construire son programme',  desc: "Encadré avec les règles d'inscription" },
  prescri:   { label: "Prescri'Forme",             desc: 'Bloc sport sur ordonnance, lien vers la page' },
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
export default function AdminGymPageSection() {
  const [activeTab, setActiveTab]     = useState('blocs')
  const [blocks, setBlocks]           = useState([])
  const [disciplines, setDisciplines] = useState([])
  const [animateurs, setAnimateurs]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [editing, setEditing]         = useState(null)      // block
  const [editingDisc, setEditingDisc] = useState(null)
  const [editingAnim, setEditingAnim] = useState(null)
  const [showCatalogue, setShowCatalogue] = useState(false)
  const supabase = createClient()

  const load = async () => {
    const [bRes, dRes, aRes] = await Promise.all([
      supabase.from('gym_page_blocks').select('*').order('ordre'),
      supabase.from('gym_disciplines').select('*').order('ordre'),
      supabase.from('gym_animateurs').select('*').order('ordre'),
    ])
    if (!bRes.error) setBlocks(bRes.data)
    if (!dRes.error) setDisciplines(dRes.data)
    if (!aRes.error) setAnimateurs(aRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Block ops ────────────────────────────────────────────────
  const toggleBlockVisible = async (block_key, current) => {
    await supabase.from('gym_page_blocks').update({ visible: !current }).eq('block_key', block_key)
    load()
  }
  const saveBlock = async (block_key, content) => {
    await supabase.from('gym_page_blocks').update({ content }).eq('block_key', block_key)
    setEditing(null)
    load()
  }
  const moveBlock = async (idx, dir) => {
    const target = blocks[idx + dir]
    const current = blocks[idx]
    if (!target) return
    await supabase.from('gym_page_blocks').update({ ordre: target.ordre }).eq('id', current.id)
    await supabase.from('gym_page_blocks').update({ ordre: current.ordre }).eq('id', target.id)
    load()
  }
  const deleteBlock = async (block) => {
    if (!confirm(`Supprimer le bloc "${BLOCK_META[block.block_key]?.label ?? block.block_key}" ?`)) return
    await supabase.from('gym_page_blocks').delete().eq('id', block.id)
    load()
  }
  const addBlock = async (key) => {
    const maxOrdre = Math.max(0, ...blocks.map(b => b.ordre ?? 0))
    await supabase.from('gym_page_blocks').insert({ block_key: key, label: (genericType(key) ? (GENERIC_BLOCKS.find(g => g.type === genericType(key))?.label ?? key) : (BLOCK_META[key]?.label ?? key)), visible: true, content: {}, ordre: maxOrdre + 10 })
    setShowCatalogue(false)
    load()
  }
  const existingKeys = new Set(blocks.map(b => b.block_key))
  const catalogueItems = Object.entries(BLOCK_META).filter(([key]) => !existingKeys.has(key))

  // ── Discipline ops ───────────────────────────────────────────
  const saveDisc = async (data) => {
    if (data.id) {
      await supabase.from('gym_disciplines').update({ mark: data.mark, nom: data.nom, description: data.description }).eq('id', data.id)
    } else {
      const maxOrdre = Math.max(0, ...disciplines.map(d => d.ordre || 0))
      await supabase.from('gym_disciplines').insert({ mark: data.mark, nom: data.nom, description: data.description, ordre: maxOrdre + 1, visible: true })
    }
    setEditingDisc(null)
    load()
  }
  const toggleDiscVisible = async (id, current) => {
    await supabase.from('gym_disciplines').update({ visible: !current }).eq('id', id)
    load()
  }
  const deleteDisc = async (id) => {
    if (!confirm('Supprimer cette discipline ?')) return
    await supabase.from('gym_disciplines').delete().eq('id', id)
    load()
  }

  // ── Animateur ops ────────────────────────────────────────────
  const saveAnim = async (data) => {
    const payload = { nom: data.nom, role: data.role, disciplines: data.disciplines, photo_url: data.photo_url || null }
    if (data.id) {
      await supabase.from('gym_animateurs').update(payload).eq('id', data.id)
    } else {
      const maxOrdre = Math.max(0, ...animateurs.map(a => a.ordre || 0))
      await supabase.from('gym_animateurs').insert({ ...payload, ordre: maxOrdre + 1, visible: true })
    }
    setEditingAnim(null)
    load()
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
    ['blocs', 'Blocs de la page'],
    ['disciplines', `Disciplines (${disciplines.length})`],
    ['animateurs', `Animateurs (${animateurs.length})`],
  ]

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Page Gym <HelpTip text="Gérez le contenu de la page publique de la section Gym : les textes des blocs de présentation, la liste des disciplines proposées et l'équipe d'animateurs." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Contenu, disciplines et équipe d'animateurs</p>
        </div>
        <a className="btn btn-ghost btn-sm" href="/activites/gym" target="_blank" rel="noopener noreferrer">
          Voir la page →
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "1px solid var(--line)" }}>
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
        <>
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
                    <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>
                      {block.visible ? 'Visible' : 'Masqué'}
                    </span>
                    <button className={`switch ${block.visible ? 'on' : ''}`} onClick={() => toggleBlockVisible(block.block_key, block.visible)}/>
                    <button className="icon-btn" onClick={() => setEditing(block)}>
                      <Icon name="edit" size={14}/>
                    </button>
                    <button className="icon-btn" onClick={() => deleteBlock(block)} style={{ color: 'var(--red)' }}>
                      <Icon name="trash" size={14}/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Disciplines tab ── */}
      {activeTab === 'disciplines' && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setEditingDisc({ mark: '', nom: '', description: '' })}>
              <Icon name="plus" size={14}/> Ajouter une discipline <HelpTip text="Ajoute une nouvelle discipline à la liste (ex : Pilates, Yoga, Stretching). La lettre / marque est une abréviation affichée dans le planning pour identifier rapidement la discipline." position="bottom" />
            </button>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Marque</th><th>Nom</th><th>Description</th><th>Visible</th><th></th></tr>
            </thead>
            <tbody>
              {disciplines.map(d => (
                <tr key={d.id} style={{ opacity: d.visible ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: "inline-flex", width: 32, height: 32, justifyContent: "center", alignItems: "center", fontFamily: "var(--serif)", fontWeight: 600, fontSize: "0.95rem", background: "var(--bg-deep)", borderRadius: "var(--r-sm)", border: "1px solid var(--line)" }}>
                      {d.mark}
                    </div>
                  </td>
                  <td><strong>{d.nom}</strong></td>
                  <td className="muted" style={{ fontSize: "0.88rem", maxWidth: 300 }}>{d.description}</td>
                  <td>
                    <button className={`switch ${d.visible ? 'on' : ''}`} onClick={() => toggleDiscVisible(d.id, d.visible)}/>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button className="icon-btn" onClick={() => setEditingDisc(d)}><Icon name="edit" size={14}/></button>
                    <button className="icon-btn" onClick={() => deleteDisc(d.id)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* ── Animateurs tab ── */}
      {activeTab === 'animateurs' && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button className="btn btn-primary" onClick={() => setEditingAnim({ nom: '', role: '', disciplines: '', photo_url: '' })}>
              <Icon name="plus" size={14}/> Ajouter un animateur <HelpTip text="Ajoute un membre de l'équipe d'encadrement gym. Renseignez son nom, son titre et les cours qu'il anime. L'interrupteur Visible/Masqué permet de le retirer temporairement de la page publique." position="bottom" />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {animateurs.map(a => (
              <div key={a.id} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, opacity: a.visible ? 1 : 0.5 }}>
                {a.photo_url ? (
                  <img src={a.photo_url} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "50%", border: "1px solid var(--line)", flexShrink: 0 }}/>
                ) : (
                  <div style={{ width: 48, height: 48, background: "var(--bg-deep)", borderRadius: "50%", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-mute)", fontFamily: "var(--serif)", fontSize: "1.3rem", fontWeight: 600, flexShrink: 0 }}>
                    {a.nom?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{a.nom}</div>
                  <div className="muted" style={{ fontSize: "0.84rem" }}>{a.role}</div>
                  {a.disciplines && (
                    <div style={{ fontSize: "0.82rem", color: "var(--ink-mute)", marginTop: 2 }}>{a.disciplines}</div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)" }}>
                    {a.visible ? 'Visible' : 'Masqué'}
                  </span>
                  <button className={`switch ${a.visible ? 'on' : ''}`} onClick={() => toggleAnimVisible(a.id, a.visible)}/>
                  <button className="icon-btn" onClick={() => setEditingAnim(a)}><Icon name="edit" size={14}/></button>
                  <button className="icon-btn" onClick={() => deleteAnim(a.id)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
                </div>
              </div>
            ))}
            {animateurs.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: "var(--ink-mute)", fontSize: "0.92rem" }}>
                Aucun animateur — cliquez sur « Ajouter » pour en créer un.
              </div>
            )}
          </div>
        </>
      )}

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

      {/* ── Block edit modal ── */}
      {editing && (
        <Modal title={`Modifier — ${BLOCK_META[editing.block_key]?.label ?? editing.block_key}`} onClose={() => setEditing(null)}>
          <BlockForm block={editing} onSave={saveBlock} onCancel={() => setEditing(null)}/>
        </Modal>
      )}

      {/* ── Discipline modal ── */}
      {editingDisc && (
        <Modal title={editingDisc.id ? 'Modifier la discipline' : 'Nouvelle discipline'} onClose={() => setEditingDisc(null)}>
          <DiscForm disc={editingDisc} onSave={saveDisc} onCancel={() => setEditingDisc(null)}/>
        </Modal>
      )}

      {/* ── Animateur modal ── */}
      {editingAnim && (
        <Modal title={editingAnim.id ? "Modifier l'animateur" : 'Nouvel animateur'} onClose={() => setEditingAnim(null)}>
          <AnimForm anim={editingAnim} onSave={saveAnim} onCancel={() => setEditingAnim(null)} supabase={supabase}/>
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

  const itemsText = Array.isArray(c.items)
    ? c.items.join('\n')
    : (c.items_text ?? '3 cours de gym\n+ 2 cours de yoga / Qi Gong\n+ 2 cours de Pilates')

  return (
    <div className="form">

      {key === 'header' && <>
        <div className="field"><label>Accroche (eyebrow)</label>
          <input value={c.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)} placeholder="Activités · FFEPGV · Label Qualité Club Sport Santé"/>
        </div>
        <div className="field"><label>Titre H1</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="La Gym"/>
        </div>
        <div className="field"><label>Chapeau</label>
          <textarea rows={3} value={c.lede ?? ''} onChange={e => u('lede', e.target.value)} placeholder="43 heures de cours par semaine…"/>
        </div>
      </>}

      {key === 'intro' && <>
        <div className="field"><label>Titre de section</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="La Gymnastique Volontaire à Rambouillet"/>
        </div>
        <div className="field"><label>Premier paragraphe</label>
          <textarea rows={4} value={c.texte1 ?? ''} onChange={e => u('texte1', e.target.value)}/>
        </div>
        <div className="field"><label>Deuxième paragraphe</label>
          <textarea rows={4} value={c.texte2 ?? ''} onChange={e => u('texte2', e.target.value)}/>
        </div>
      </>}

      {key === 'programme' && <>
        <div className="field"><label>Titre</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Construisez votre propre programme"/>
        </div>
        <div className="field"><label>Texte d'introduction</label>
          <textarea rows={3} value={c.texte_intro ?? ''} onChange={e => u('texte_intro', e.target.value)}/>
        </div>
        <div className="field">
          <label>
            Règles de la liste{' '}
            <span style={{ fontWeight: 400, color: "var(--ink-mute)" }}>(une par ligne)</span>
          </label>
          <textarea rows={5} value={itemsText} onChange={e => u('items', e.target.value.split('\n').filter(l => l.trim()))}/>
        </div>
        <div className="field"><label>Note de bas de bloc</label>
          <input value={c.note ?? ''} onChange={e => u('note', e.target.value)} placeholder="Chaque cours couvre la saison complète…"/>
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

      {key === 'prescri' && <>
        <div className="field"><label>Titre</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)} placeholder="Prescri'Forme — sport sur ordonnance"/>
        </div>
        <div className="field"><label>Texte</label>
          <textarea rows={4} value={c.texte ?? ''} onChange={e => u('texte', e.target.value)}/>
        </div>
        <div className="row-2">
          <div className="field"><label>Bouton — texte</label>
            <input value={c.cta_texte ?? ''} onChange={e => u('cta_texte', e.target.value)}/>
          </div>
          <div className="field"><label>Bouton — lien</label>
            <input value={c.cta_lien ?? ''} onChange={e => u('cta_lien', e.target.value)}/>
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

// ── Discipline form ────────────────────────────────────────────
function DiscForm({ disc, onSave, onCancel }) {
  const [f, setF] = useState({ mark: disc.mark ?? '', nom: disc.nom ?? '', description: disc.description ?? '', id: disc.id })
  const u = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  return (
    <div className="form">
      <div className="row-2">
        <div className="field">
          <label>Lettre / marque</label>
          <input value={f.mark} onChange={e => u('mark', e.target.value)} maxLength={2} placeholder="G, P, Y…" style={{ fontFamily: "var(--serif)", fontSize: "1.1rem" }}/>
        </div>
        <div className="field">
          <label>Nom de la discipline</label>
          <input value={f.nom} onChange={e => u('nom', e.target.value)} placeholder="Pilates, Yoga…"/>
        </div>
      </div>
      <div className="field">
        <label>Description courte</label>
        <textarea rows={3} value={f.description} onChange={e => u('description', e.target.value)} placeholder="Renforcement musculaire profond, posture, respiration."/>
      </div>

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
        <button className="btn btn-primary" onClick={() => onSave(f)}>Enregistrer</button>
      </div>
    </div>
  )
}

// ── Animateur form ─────────────────────────────────────────────
function AnimForm({ anim, onSave, onCancel, supabase }) {
  const [f, setF] = useState({ nom: anim.nom ?? '', role: anim.role ?? '', disciplines: anim.disciplines ?? '', photo_url: anim.photo_url ?? '', id: anim.id })
  const u = (k, v) => setF(prev => ({ ...prev, [k]: v }))
  return (
    <div className="form">
      <div className="field">
        <label>Photo de profil</label>
        <PhotoUpload value={f.photo_url} onChange={url => u('photo_url', url)} supabase={supabase} folder="animateurs"/>
      </div>
      <div className="field">
        <label>Nom complet</label>
        <input value={f.nom} onChange={e => u('nom', e.target.value)} placeholder="Marie Dupont"/>
      </div>
      <div className="field">
        <label>Rôle / titre</label>
        <input value={f.role} onChange={e => u('role', e.target.value)} placeholder="Animatrice diplômée d'État"/>
      </div>
      <div className="field">
        <label>Disciplines enseignées</label>
        <input value={f.disciplines} onChange={e => u('disciplines', e.target.value)} placeholder="Pilates, Yoga, Stretching"/>
      </div>

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
        <button className="btn btn-primary" onClick={() => onSave(f)}>Enregistrer</button>
      </div>
    </div>
  )
}
