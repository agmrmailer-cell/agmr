'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '@/components/ui/Icon'
import HelpTip from '@/components/ui/HelpTip'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'

const DEFAULT_BLOCKS = [
  {
    block_key: 'header',
    label: 'En-tête de page',
    ordre: 10,
    content: {
      crumb: 'Accueil / Planning / Rando & Nordique',
      eyebrow: 'Planning · Saison 2025-2026',
      title: 'Planning Rando & Nordique',
      lede: 'Calendrier des sorties randonnée et des séances de marche nordique.',
    },
  },
  {
    block_key: 'links',
    label: 'Bloc des liens',
    ordre: 20,
    content: {
      title: 'Plannings complets en ligne',
      intro: 'Calendriers, documents et ressources externes pour la saison en cours.',
    },
  },
]

function blockDefaults(key) {
  return DEFAULT_BLOCKS.find(block => block.block_key === key)
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

function BlockForm({ block, onSave, onCancel, saving }) {
  const defaults = blockDefaults(block.block_key)
  const [content, setContent] = useState({ ...(defaults?.content ?? {}), ...(block.content ?? {}) })
  const u = (key, value) => setContent(prev => ({ ...prev, [key]: value }))

  return (
    <div className="form">
      {block.block_key === 'header' && (
        <>
          <div className="field">
            <label>Fil d&apos;Ariane</label>
            <input value={content.crumb ?? ''} onChange={e => u('crumb', e.target.value)}/>
          </div>
          <div className="field">
            <label>Accroche</label>
            <input value={content.eyebrow ?? ''} onChange={e => u('eyebrow', e.target.value)}/>
          </div>
          <div className="field">
            <label>Titre principal</label>
            <input value={content.title ?? ''} onChange={e => u('title', e.target.value)}/>
          </div>
          <div className="field">
            <label>Chapeau</label>
            <textarea rows={3} value={content.lede ?? ''} onChange={e => u('lede', e.target.value)}/>
          </div>
        </>
      )}

      {block.block_key === 'links' && (
        <>
          <div className="field">
            <label>Titre du bloc</label>
            <input value={content.title ?? ''} onChange={e => u('title', e.target.value)}/>
          </div>
          <div className="field">
            <label>Texte d&apos;introduction</label>
            <textarea rows={3} value={content.intro ?? ''} onChange={e => u('intro', e.target.value)}/>
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" disabled={saving} onClick={() => onSave(block, content)}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default function AdminPlanningRandoPageSection({ onOpenLinks }) {
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const supabase = useMemo(() => createClient(), [])

  const normalizedBlocks = useMemo(() => {
    return DEFAULT_BLOCKS.map(defaultBlock => {
      const existing = blocks.find(block => block.block_key === defaultBlock.block_key)
      return {
        ...defaultBlock,
        ...(existing ?? {}),
        content: { ...defaultBlock.content, ...(existing?.content ?? {}) },
      }
    })
  }, [blocks])

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('planning_rando_page_blocks')
      .select('*')
      .order('ordre')
    if (loadError) setError(loadError.message)
    else setBlocks(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let ignore = false
    supabase
      .from('planning_rando_page_blocks')
      .select('*')
      .order('ordre')
      .then(({ data, error: loadError }) => {
        if (ignore) return
        if (loadError) setError(loadError.message)
        else setBlocks(data ?? [])
        setLoading(false)
      })
    return () => { ignore = true }
  }, [supabase])

  const ensureRows = async () => {
    setSaving(true); setError(null)
    const rows = DEFAULT_BLOCKS.map(block => ({
      block_key: block.block_key,
      label: block.label,
      ordre: block.ordre,
      content: block.content,
    }))
    const { error: upsertError } = await supabase
      .from('planning_rando_page_blocks')
      .upsert(rows, { onConflict: 'block_key', ignoreDuplicates: true })
    if (upsertError) setError(upsertError.message)
    setSaving(false)
    load()
  }

  const saveBlock = async (block, content) => {
    setSaving(true); setError(null)
    const payload = {
      block_key: block.block_key,
      label: block.label,
      ordre: block.ordre,
      content,
    }
    const { error: saveError } = block.id
      ? await supabase.from('planning_rando_page_blocks').update({ content }).eq('id', block.id)
      : await supabase.from('planning_rando_page_blocks').insert(payload)

    if (saveError) {
      setError(saveError.message)
      setSaving(false)
      return
    }

    await logActivity(supabase, {
      message: `Page planning rando modifiée - ${block.label}`,
      section: 'planning-rando-page',
      action: 'update',
    })
    setSaving(false)
    setEditing(null)
    load()
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--ink-mute)' }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Planning Rando <HelpTip text="Cette section pilote les textes de la page publique Planning Rando. Les liens Spreadsheet s'ajoutent dans la section Liens avec la zone Planning rando." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Page publique · liens Spreadsheet administrables</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="btn btn-ghost btn-sm" href="/planning/randonnee" target="_blank" rel="noopener noreferrer">
            Voir la page →
          </a>
          <button className="btn btn-primary" onClick={onOpenLinks}>
            <Icon name="plus" size={15}/> Gerer les liens
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', marginBottom: 14, fontSize: '0.88rem' }}>
          {error}
          <button className="btn btn-ghost btn-sm" onClick={ensureRows} disabled={saving} style={{ marginLeft: 12 }}>
            Initialiser la page
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {normalizedBlocks.map(block => (
          <div key={block.block_key} style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '18px 22px', display: 'flex', gap: 18, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{block.label}</div>
              {block.block_key === 'header' && (
                <div className="muted" style={{ fontSize: '0.88rem' }}>
                  {block.content.eyebrow} · {block.content.title}
                </div>
              )}
              {block.block_key === 'links' && (
                <div className="muted" style={{ fontSize: '0.88rem' }}>
                  {block.content.title} · {block.content.intro}
                </div>
              )}
            </div>
            <button className="icon-btn" onClick={() => setEditing(block)} title="Modifier">
              <Icon name="edit" size={14}/>
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, padding: '14px 18px', background: 'var(--accent-tint)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--r-sm)', fontSize: '0.86rem', color: 'var(--ink-soft)' }}>
        Pour afficher les Spreadsheets sur la page, creez des liens dans <strong>Liens</strong> avec la zone <strong>Planning rando</strong>.
      </div>

      {editing && (
        <Modal title={`Modifier - ${editing.label}`} onClose={() => setEditing(null)}>
          <BlockForm block={editing} onSave={saveBlock} onCancel={() => setEditing(null)} saving={saving}/>
        </Modal>
      )}
    </>
  )
}
