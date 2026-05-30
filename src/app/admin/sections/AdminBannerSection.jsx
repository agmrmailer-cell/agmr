'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import HelpTip from '@/components/ui/HelpTip'
import { createClient } from '@/lib/supabase-client'

const TYPE_LABELS = {
  info:    { label: 'Information',  color: 'var(--green)',  bg: 'var(--green-tint)',  border: 'var(--green-soft)' },
  warning: { label: 'Attention',    color: '#d97706',       bg: '#fff8e1',            border: '#fde68a' },
  urgent:  { label: 'Urgent',       color: '#dc2626',       bg: '#fff5f5',            border: '#fecaca' },
}

const BLANK = { message: '', type: 'info', lien: '', lien_texte: '' }

export default function AdminBannerSection() {
  const [banners, setBanners]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState(null)
  const supabase = createClient()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('site_banners').select('*').order('created_at', { ascending: false })
    setBanners(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const activeBanner = banners.find(b => b.active)

  const toggleActive = async (id, current) => {
    // Désactiver tous puis activer le sélectionné si pas déjà actif
    await supabase.from('site_banners').update({ active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
    if (!current) await supabase.from('site_banners').update({ active: true }).eq('id', id)
    load()
  }

  const deleteBanner = async (id) => {
    if (!confirm('Supprimer ce bandeau ?')) return
    await supabase.from('site_banners').delete().eq('id', id)
    load()
  }

  const save = async () => {
    if (!editing.message.trim()) return
    setSaving(true); setError(null)
    const payload = {
      message:    editing.message.trim(),
      type:       editing.type,
      lien:       editing.lien?.trim() || null,
      lien_texte: editing.lien_texte?.trim() || null,
      active:     editing.active ?? false,
    }
    if (editing.id) {
      const { error } = await supabase.from('site_banners').update(payload).eq('id', editing.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('site_banners').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }
    setSaving(false); setEditing(null); load()
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Bandeau d'information <HelpTip text="Un bandeau défilant s'affiche en haut de toutes les pages du site quand il est activé. Idéal pour les fermetures exceptionnelles, inscriptions ouvertes, événements importants." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>
            {activeBanner
              ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>● Bandeau actif — &laquo;{activeBanner.message.slice(0, 50)}{activeBanner.message.length > 50 ? '…' : ''}&raquo;</span>
              : <span style={{ color: 'var(--ink-mute)' }}>○ Aucun bandeau actif</span>
            }
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ ...BLANK })}>
          <Icon name="plus" size={15}/> Nouveau bandeau
        </button>
      </div>

      {/* Prévisualisation du bandeau actif */}
      {activeBanner && (
        <div style={{ marginBottom: 24, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: '0.72rem', padding: '6px 14px', background: 'var(--bg-deep)', color: 'var(--ink-mute)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Aperçu
          </div>
          <BannerPreview banner={activeBanner}/>
        </div>
      )}

      {/* Liste */}
      {loading && <div style={{ color: 'var(--ink-mute)', padding: '20px 0' }}>Chargement…</div>}

      {!loading && banners.length === 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 32, textAlign: 'center', color: 'var(--ink-mute)' }}>
          Aucun bandeau — cliquez sur « Nouveau bandeau » pour en créer un.
        </div>
      )}

      {!loading && banners.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {banners.map(b => {
            const t = TYPE_LABELS[b.type] ?? TYPE_LABELS.info
            return (
              <div key={b.id} style={{ background: 'var(--bg-card)', border: `1px solid ${b.active ? 'var(--green)' : 'var(--line)'}`, borderRadius: 'var(--r-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Toggle actif */}
                <button
                  className={`switch ${b.active ? 'on' : ''}`}
                  onClick={() => toggleActive(b.id, b.active)}
                  title={b.active ? 'Désactiver' : 'Activer sur le site'}
                  style={{ flexShrink: 0 }}
                />

                {/* Type badge */}
                <span style={{ flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: t.bg, color: t.color, border: `1px solid ${t.border}`, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {t.label}
                </span>

                {/* Message */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: b.active ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.message}
                  </div>
                  {b.lien && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--ink-mute)', marginTop: 2 }}>
                      Lien : {b.lien_texte ? `${b.lien_texte} → ` : ''}{b.lien}
                    </div>
                  )}
                </div>

                {/* Statut */}
                <span style={{ fontSize: '0.78rem', color: b.active ? 'var(--green)' : 'var(--ink-mute)', fontWeight: b.active ? 600 : 400, whiteSpace: 'nowrap' }}>
                  {b.active ? '● Actif' : '○ Inactif'}
                </span>

                {/* Actions */}
                <button className="icon-btn" onClick={() => setEditing({ ...b })} title="Modifier">
                  <Icon name="edit" size={14}/>
                </button>
                <button className="icon-btn" onClick={() => deleteBanner(b.id)} title="Supprimer" style={{ color: 'var(--red, #dc2626)' }}>
                  <Icon name="trash" size={14}/>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal édition */}
      {editing && (
        <div className="modal-back" onClick={() => setEditing(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing.id ? 'Modifier le bandeau' : 'Nouveau bandeau'}</h3>
              <button className="icon-btn" onClick={() => setEditing(null)}><Icon name="x" size={14}/></button>
            </div>
            <div className="modal-body">
              <div className="form">

                <div className="field">
                  <label>Type <HelpTip text="Information (vert) pour les annonces normales. Attention (orange) pour les avertissements. Urgent (rouge) pour les fermetures ou situations critiques." /></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {Object.entries(TYPE_LABELS).map(([key, t]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setEditing(e => ({ ...e, type: key }))}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                          background: editing.type === key ? t.bg : 'var(--bg-deep)',
                          border: `2px solid ${editing.type === key ? t.color : 'var(--line)'}`,
                          color: editing.type === key ? t.color : 'var(--ink-mute)',
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label>Message <HelpTip text="Texte affiché dans le bandeau défilant. Soyez concis — le texte défile en boucle." /></label>
                  <textarea
                    rows={3}
                    value={editing.message}
                    onChange={e => setEditing(ed => ({ ...ed, message: e.target.value }))}
                    placeholder="Les inscriptions pour la saison 2025-2026 sont ouvertes !"
                    autoFocus
                  />
                </div>

                <div className="row-2">
                  <div className="field">
                    <label>Lien (optionnel)</label>
                    <input
                      value={editing.lien ?? ''}
                      onChange={e => setEditing(ed => ({ ...ed, lien: e.target.value }))}
                      placeholder="/inscriptions"
                    />
                  </div>
                  <div className="field">
                    <label>Texte du lien</label>
                    <input
                      value={editing.lien_texte ?? ''}
                      onChange={e => setEditing(ed => ({ ...ed, lien_texte: e.target.value }))}
                      placeholder="S'inscrire"
                    />
                  </div>
                </div>

                {/* Aperçu live */}
                {editing.message.trim() && (
                  <div style={{ borderRadius: 'var(--r-sm)', overflow: 'hidden', border: '1px solid var(--line)' }}>
                    <div style={{ fontSize: '0.7rem', padding: '4px 10px', background: 'var(--bg-deep)', color: 'var(--ink-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Aperçu</div>
                    <BannerPreview banner={editing}/>
                  </div>
                )}

                {error && <p style={{ color: 'var(--red, #dc2626)', fontSize: '0.85rem' }}>{error}</p>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
                  <button className="btn btn-primary" onClick={save} disabled={saving || !editing.message.trim()}>
                    {saving ? 'Enregistrement…' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Composant prévisualisation (client, sans ticker CSS pour rester statique)
function BannerPreview({ banner }) {
  const t = TYPE_LABELS[banner.type] ?? TYPE_LABELS.info
  const label = banner.type === 'warning' ? '⚠ ATTENTION' : banner.type === 'urgent' ? '🔴 URGENT' : 'ℹ INFO'
  const STYLES = {
    info:    { bg: 'var(--green)',   text: '#fff' },
    warning: { bg: '#d97706',        text: '#fff' },
    urgent:  { bg: '#dc2626',        text: '#fff' },
  }
  const s = STYLES[banner.type] ?? STYLES.info
  return (
    <div style={{ background: s.bg, color: s.text, display: 'flex', alignItems: 'center', height: 38, overflow: 'hidden', fontSize: '0.85rem', fontFamily: 'var(--sans)' }}>
      <div style={{ flexShrink: 0, padding: '0 16px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(0,0,0,0.15)', height: '100%', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
        {label}
      </div>
      <div style={{ padding: '0 20px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
        {banner.message}
        {banner.lien && banner.lien_texte && <span style={{ marginLeft: 8, opacity: 0.85 }}>— {banner.lien_texte} →</span>}
      </div>
    </div>
  )
}
