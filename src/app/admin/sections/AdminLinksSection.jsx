'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '@/components/ui/Icon'
import HelpTip from '@/components/ui/HelpTip'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'

const KIND_LABELS = {
  planning: 'Planning',
  payment: 'Paiement',
  album: 'Album photo',
  video: 'Video',
  document: 'Document',
  external: 'Lien externe',
}

const ZONES = [
  { id: 'planning-rando', label: 'Planning rando' },
  { id: 'home-rando-sante', label: 'Accueil - Rando-Sante' },
  { id: 'actualites', label: 'Actualites' },
  { id: 'espace-adherents', label: 'Espace adherents' },
  { id: 'inscriptions', label: 'Inscriptions / paiement' },
]

const BLANK = {
  title: '',
  url: '',
  description: '',
  kind: 'external',
  zones: ['planning-rando'],
  active: true,
  members_only: false,
  ordre: 0,
  starts_at: '',
  ends_at: '',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function isoToLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localToISO(local) {
  if (!local) return null
  return new Date(local).toISOString()
}

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function zoneLabel(id) {
  return ZONES.find(zone => zone.id === id)?.label ?? id
}

function LinkForm({ item, onSave, onCancel, saving }) {
  const [f, setF] = useState({
    ...item,
    starts_at: isoToLocal(item.starts_at),
    ends_at: isoToLocal(item.ends_at),
  })
  const u = (key, value) => setF(prev => ({ ...prev, [key]: value }))
  const toggleZone = (id) => {
    setF(prev => ({
      ...prev,
      zones: prev.zones.includes(id)
        ? prev.zones.filter(zone => zone !== id)
        : [...prev.zones, id],
    }))
  }

  return (
    <div className="form">
      <div className="row-2">
        <div className="field">
          <label>Titre <HelpTip text="Nom affiche sur le site. Exemple : Planning rando du jeudi, Paiement HelloAsso, Album photos AG." /></label>
          <input value={f.title} onChange={e => u('title', e.target.value)} autoFocus/>
        </div>
        <div className="field">
          <label>Type</label>
          <select value={f.kind} onChange={e => u('kind', e.target.value)}>
            {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>

      <div className="field">
        <label>URL</label>
        <input value={f.url} onChange={e => u('url', e.target.value)} placeholder="https://... ou /inscriptions"/>
      </div>

      <div className="field">
        <label>Description courte</label>
        <textarea rows={3} value={f.description ?? ''} onChange={e => u('description', e.target.value)} placeholder="Optionnel - contexte affiche sous le lien"/>
      </div>

      <div className="field">
        <label>Zones d&apos;affichage</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ZONES.map(zone => (
            <label key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', cursor: 'pointer', background: f.zones.includes(zone.id) ? 'rgba(184,69,31,0.06)' : 'var(--bg-deep)', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={f.zones.includes(zone.id)} onChange={() => toggleZone(zone.id)} style={{ accentColor: 'var(--accent)' }}/>
              {zone.label}
            </label>
          ))}
        </div>
      </div>

      <div className="row-3">
        <div className="field">
          <label>Ordre</label>
          <input type="number" value={f.ordre ?? 0} onChange={e => u('ordre', Number(e.target.value) || 0)}/>
        </div>
        <div className="field">
          <label>Debut d&apos;affichage</label>
          <input type="datetime-local" value={f.starts_at ?? ''} onChange={e => u('starts_at', e.target.value)}/>
        </div>
        <div className="field">
          <label>Fin d&apos;affichage</label>
          <input type="datetime-local" value={f.ends_at ?? ''} onChange={e => u('ends_at', e.target.value)}/>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={f.active} onChange={e => u('active', e.target.checked)} style={{ accentColor: 'var(--accent)' }}/>
          Actif
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={f.members_only} onChange={e => u('members_only', e.target.checked)} style={{ accentColor: 'var(--accent)' }}/>
          Reserve adherents
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" disabled={saving || !f.title.trim() || !f.url.trim() || f.zones.length === 0} onClick={() => onSave({
          ...f,
          title: f.title.trim(),
          url: f.url.trim(),
          description: f.description?.trim() || null,
          starts_at: localToISO(f.starts_at),
          ends_at: localToISO(f.ends_at),
        })}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default function AdminLinksSection() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)
  const supabase = useMemo(() => createClient(), [])

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('external_links')
      .select('*')
      .order('ordre')
      .order('created_at', { ascending: false })
    if (loadError) setError(loadError.message)
    else setLinks(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let ignore = false
    supabase
      .from('external_links')
      .select('*')
      .order('ordre')
      .order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => {
        if (ignore) return
        if (loadError) setError(loadError.message)
        else setLinks(data ?? [])
        setLoading(false)
      })
    return () => { ignore = true }
  }, [supabase])

  const filtered = links.filter(link => filter === 'all' || link.zones?.includes(filter))

  const save = async (item) => {
    setSaving(true); setError(null)
    const payload = {
      title: item.title,
      url: item.url,
      description: item.description,
      kind: item.kind,
      zones: item.zones,
      active: item.active,
      members_only: item.members_only,
      ordre: item.ordre,
      starts_at: item.starts_at,
      ends_at: item.ends_at,
    }
    const request = item.id
      ? supabase.from('external_links').update(payload).eq('id', item.id)
      : supabase.from('external_links').insert(payload)
    const { error: saveError } = await request
    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }
    await logActivity(supabase, {
      message: `${item.id ? 'Lien modifie' : 'Lien cree'} - ${item.title}`,
      section: 'links',
      action: item.id ? 'update' : 'create',
    })
    setSaving(false)
    setEditing(null)
    load()
  }

  const del = async (item) => {
    if (!confirm(`Supprimer le lien "${item.title}" ?`)) return
    const { error: deleteError } = await supabase.from('external_links').delete().eq('id', item.id)
    if (deleteError) { setError(deleteError.message); return }
    await logActivity(supabase, { message: `Lien supprime - ${item.title}`, section: 'links', action: 'delete' })
    load()
  }

  const toggleActive = async (item) => {
    const { error: updateError } = await supabase.from('external_links').update({ active: !item.active }).eq('id', item.id)
    if (updateError) { setError(updateError.message); return }
    load()
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--ink-mute)' }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Liens <HelpTip text="Centralise les liens externes ou internes affiches sur le site : plannings Google Sheets, paiement HelloAsso, albums, videos, documents et liens reserves aux adherents." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>{links.length} liens - affichage par zone</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(BLANK)}>
          <Icon name="plus" size={16}/> Nouveau lien
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Toutes les zones</button>
        {ZONES.map(zone => (
          <button key={zone.id} className={`chip ${filter === zone.id ? 'active' : ''}`} onClick={() => setFilter(zone.id)}>
            {zone.label}
          </button>
        ))}
      </div>

      {error && <div style={{ color: 'var(--red)', marginBottom: 12, fontSize: '0.88rem' }}>{error}</div>}

      <table className="tbl">
        <thead>
          <tr>
            <th>Ordre</th>
            <th>Lien</th>
            <th>Type</th>
            <th>Zones</th>
            <th>Validite</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(link => (
            <tr key={link.id} style={{ opacity: link.active ? 1 : 0.55 }}>
              <td>{link.ordre ?? 0}</td>
              <td>
                <strong>{link.title}</strong>
                <div className="muted" style={{ fontSize: '0.8rem', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</div>
                {link.description && <div className="muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>{link.description}</div>}
              </td>
              <td>{KIND_LABELS[link.kind] ?? link.kind}</td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(link.zones ?? []).map(zone => <span key={zone} className="rando-tag">{zoneLabel(zone)}</span>)}
                </div>
              </td>
              <td className="muted" style={{ fontSize: '0.82rem' }}>
                {link.starts_at ? `Du ${formatDate(link.starts_at)}` : 'Sans debut'}<br/>
                {link.ends_at ? `au ${formatDate(link.ends_at)}` : 'sans fin'}
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className={`badge ${link.active ? 'badge-ok' : 'badge-cancel'}`}>{link.active ? 'Actif' : 'Inactif'}</span>
                  {link.members_only && <span className="badge badge-full">Adherents</span>}
                </div>
              </td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button className="btn btn-sm btn-ghost" onClick={() => toggleActive(link)}>{link.active ? 'Masquer' : 'Afficher'}</button>
                <button className="icon-btn" onClick={() => setEditing(link)} style={{ marginLeft: 4 }}><Icon name="edit" size={14}/></button>
                <button className="icon-btn" onClick={() => del(link)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 28, textAlign: 'center', color: 'var(--ink-mute)', marginTop: 16 }}>
          Aucun lien pour cette zone.
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Modifier le lien' : 'Nouveau lien'} onClose={() => setEditing(null)}>
          <LinkForm item={editing} onSave={save} onCancel={() => setEditing(null)} saving={saving}/>
        </Modal>
      )}
    </>
  )
}
