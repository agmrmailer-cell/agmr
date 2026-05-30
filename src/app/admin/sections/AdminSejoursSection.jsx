'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import ImageUpload from '@/components/ui/ImageUpload'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'
import HelpTip from '@/components/ui/HelpTip'

const IMG_OPTIONS = {
  a: 'linear-gradient(135deg, #c4956a 0%, #8b5e3c 100%)',
  b: 'linear-gradient(135deg, #6aadbc 0%, #3a7d8c 100%)',
  c: 'linear-gradient(135deg, #c4a96a 0%, #8b7040 100%)',
  d: 'linear-gradient(135deg, #7a9e7e 0%, #4a6e4e 100%)',
  e: 'linear-gradient(135deg, #c47a8c 0%, #8c4a5c 100%)',
  f: 'linear-gradient(135deg, #9b8ec4 0%, #6b5e94 100%)',
}

const IMG_LABELS = { a: 'Terre chaude', b: 'Bleu mer', c: 'Or doux', d: 'Forêt', e: 'Crépuscule', f: 'Lavande' }

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default function AdminSejoursSection() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const supabase = createClient()

  const load = async () => {
    const { data, error } = await supabase
      .from('sejours')
      .select('*')
      .order('created_at')
    if (!error) setItems(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async (f) => {
    const payload = {
      titre:       f.titre,
      dates:       f.dates,
      transport:   f.transport || null,
      statut:      f.statut ?? 'ouvert',
      description: f.description || null,
      img:         f.img ?? 'a',
      image_url:   f.image_url || null,
    }
    if (f.id) {
      await supabase.from('sejours').update(payload).eq('id', f.id)
      await logActivity(supabase, { message: `Séjour modifié — ${f.titre}`, section: 'sejours', action: 'update' })
    } else {
      await supabase.from('sejours').insert(payload)
      await logActivity(supabase, { message: `Nouveau séjour — ${f.titre}`, section: 'sejours', action: 'create' })
    }
    setEditing(null); load()
  }

  const del = async (id) => {
    if (!confirm('Supprimer ce séjour ?')) return
    const sejour = items.find(i => i.id === id)
    await supabase.from('sejours').delete().eq('id', id)
    await logActivity(supabase, { message: `Séjour supprimé — ${sejour?.titre ?? ''}`, section: 'sejours', action: 'delete' })
    load()
  }

  const setStatut = async (id, statut) => {
    const sejour = items.find(i => i.id === id)
    await supabase.from('sejours').update({ statut }).eq('id', id)
    const label = statut === 'complet' ? 'marqué complet' : statut === 'ouvert' ? 'rouvert' : 'terminé'
    await logActivity(supabase, { message: `Séjour ${label} — ${sejour?.titre ?? ''}`, section: 'sejours', action: 'update' })
    load()
  }

  const blank = { titre: '', dates: '', transport: '', statut: 'ouvert', description: '', img: 'a', image_url: null }

  if (loading) return <div style={{ padding: 40, color: 'var(--ink-mute)' }}>Chargement…</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Séjours</h1>
          <p className="muted" style={{ margin: 0 }}>
            {items.length} séjour{items.length > 1 ? 's' : ''} · {items.filter(s => s.statut === 'ouvert').length} ouvert{items.filter(s => s.statut === 'ouvert').length !== 1 ? 's' : ''}
            {' — '}<strong style={{ color: 'var(--green)' }}>données Supabase</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-ghost btn-sm" href="/actualites/sejours" target="_blank" rel="noopener noreferrer">
            Voir la page →
          </a>
          <button className="btn btn-primary" onClick={() => setEditing(blank)}>
            <Icon name="plus" size={16}/> Nouveau séjour
          </button>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 48 }}></th>
            <th>Séjour</th>
            <th>Dates</th>
            <th>Transport</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id}>
              {/* Vignette */}
              <td style={{ padding: '8px 12px' }}>
                {s.image_url
                  ? <img src={s.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, display: 'block' }}/>
                  : <div style={{ width: 40, height: 40, borderRadius: 4, background: IMG_OPTIONS[s.img] ?? IMG_OPTIONS.a, flexShrink: 0 }}/>
                }
              </td>
              {/* Titre */}
              <td>
                <strong>{s.titre}</strong>
                {s.description && (
                  <div className="muted" style={{ fontSize: '0.82rem', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.description}
                  </div>
                )}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>{s.dates}</td>
              <td>{s.transport}</td>
              <td>
                {s.statut === 'ouvert'  && <span className="badge badge-ok">Ouverte</span>}
                {s.statut === 'complet' && <span className="badge badge-full">Complet</span>}
                {s.statut === 'passe'   && <span className="badge" style={{ background: 'var(--bg-deep)', color: 'var(--ink-mute)' }}>Terminé</span>}
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                {s.statut === 'ouvert' && (
                  <button className="btn btn-sm btn-ghost" style={{ marginRight: 4 }} onClick={() => setStatut(s.id, 'complet')}>Complet</button>
                )}
                {(s.statut === 'complet' || s.statut === 'passe') && (
                  <button className="btn btn-sm btn-ghost" style={{ marginRight: 4 }} onClick={() => setStatut(s.id, 'ouvert')}>Rouvrir</button>
                )}
                <button className="btn btn-sm btn-ghost" style={{ color: 'var(--accent)', marginRight: 4 }} onClick={() => setStatut(s.id, 'passe')}>Terminer</button>
                <button className="icon-btn" onClick={() => setEditing(s)}><Icon name="edit" size={14}/></button>
                <button className="icon-btn" onClick={() => del(s.id)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-mute)', padding: 48 }}>
                Aucun séjour — <button className="btn btn-ghost btn-sm" onClick={() => setEditing(blank)}>Créer le premier</button>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.id ? 'Modifier le séjour' : 'Nouveau séjour'} onClose={() => setEditing(null)}>
          <SejourForm item={editing} onSave={save} onCancel={() => setEditing(null)}/>
        </Modal>
      )}
    </>
  )
}

function SejourForm({ item, onSave, onCancel }) {
  const [f, setF] = useState({ ...item })
  const u = (k, v) => setF(p => ({ ...p, [k]: v }))

  // Aperçu : image réelle si disponible, sinon dégradé
  const preview = f.image_url
    ? <img src={f.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
    : null

  return (
    <div className="form">
      <ImageUpload
        label="Photo du séjour"
        value={f.image_url}
        onChange={url => u('image_url', url)}
        folder="sejours"
        height={180}
      />

      {/* Couleur de secours (visible si pas d'image) */}
      {!f.image_url && (
        <div className="field">
          <label>Couleur de la carte <span style={{ fontWeight: 400, color: 'var(--ink-mute)' }}>(si pas de photo)</span></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {Object.entries(IMG_OPTIONS).map(([key, grad]) => (
              <button key={key} type="button" title={IMG_LABELS[key]} onClick={() => u('img', key)}
                style={{ width: 28, height: 28, borderRadius: 6, background: grad, border: 'none', cursor: 'pointer', boxShadow: f.img === key ? '0 0 0 2px var(--bg-card), 0 0 0 4px var(--ink)' : '0 0 0 1px rgba(0,0,0,0.15)', transition: 'box-shadow 0.1s' }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label>Titre du séjour</label>
        <input value={f.titre} onChange={e => u('titre', e.target.value)} placeholder="Bretagne — Côte de granit rose"/>
      </div>
      <div className="row-2">
        <div className="field">
          <label>Dates</label>
          <input value={f.dates} onChange={e => u('dates', e.target.value)} placeholder="14 – 21 mai 2026"/>
        </div>
        <div className="field">
          <label>Transport</label>
          <input value={f.transport} onChange={e => u('transport', e.target.value)} placeholder="Car, Covoiturage, Train…"/>
        </div>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea rows={3} value={f.description} onChange={e => u('description', e.target.value)} placeholder="Programme, hébergement, tarifs…"/>
      </div>
      <div className="field">
        <label>Statut</label>
        <select value={f.statut} onChange={e => u('statut', e.target.value)}>
          <option value="ouvert">Inscriptions ouvertes</option>
          <option value="complet">Complet</option>
          <option value="passe">Terminé</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" disabled={!f.titre || !f.dates} onClick={() => onSave(f)}>
          Enregistrer
        </button>
      </div>
    </div>
  )
}
