'use client'
import { useEffect, useMemo, useState } from 'react'
import HelpTip from '@/components/ui/HelpTip'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'
import { SITE_TEXT_PAGES, mergeSiteTexts } from '@/lib/site-texts'

function PageForm({ page, rows, onSaved, supabase }) {
  const [values, setValues] = useState(() => mergeSiteTexts(page.id, rows))
  const [saving, setSaving] = useState(false)
  const [resets, setResets] = useState({})
  const [message, setMessage] = useState(null)
  const u = (key, value) => { setValues(prev => ({ ...prev, [key]: value })); setMessage(null) }

  const save = async () => {
    setSaving(true); setMessage(null)
    const payload = page.fields.map(f => ({
      key: `${page.id}.${f.key}`,
      value: values[f.key] ?? '',
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('site_texts').upsert(payload, { onConflict: 'key' })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      await logActivity(supabase, { message: `Textes modifiés - ${page.label}`, section: 'site-texts', action: 'update' })
      setMessage({ type: 'ok', text: 'Modifications enregistrées.' })
      onSaved(payload)
    }
    setSaving(false)
  }

  const reset = (field) => {
    u(field.key, field.default)
    setResets(prev => ({ ...prev, [field.key]: (prev[field.key] ?? 0) + 1 }))
  }

  return (
    <div className="form">
      {page.fields.map(field => (
        <div className="field" key={field.key}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
            <span>{field.label}</span>
            {values[field.key] !== field.default && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.74rem' }} onClick={() => reset(field)}>
                Texte d&apos;origine
              </button>
            )}
          </label>
          {field.type === 'rich'
            ? <RichTextEditor
                key={`${page.id}.${field.key}.${resets[field.key] ?? 0}`}
                value={values[field.key] ?? ''}
                onChange={v => u(field.key, v)}
                minHeight={field.minHeight ?? 90}
              />
            : <input value={values[field.key] ?? ''} onChange={e => u(field.key, e.target.value)}/>}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, position: 'sticky', bottom: 0, background: 'var(--bg)', padding: '12px 0' }}>
        {message && (
          <span style={{ fontSize: '0.88rem', color: message.type === 'error' ? 'var(--red)' : 'var(--green, var(--ink-soft))' }}>
            {message.text}
          </span>
        )}
        <button className="btn btn-primary" disabled={saving} onClick={save}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

export default function AdminSiteTextsSection() {
  const supabase = useMemo(() => createClient(), [])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pageId, setPageId] = useState(SITE_TEXT_PAGES[0].id)

  useEffect(() => {
    let ignore = false
    supabase.from('site_texts').select('key, value').then(({ data, error: loadError }) => {
      if (ignore) return
      if (loadError) setError(loadError.message)
      else setRows(data ?? [])
      setLoading(false)
    })
    return () => { ignore = true }
  }, [supabase])

  const page = SITE_TEXT_PAGES.find(p => p.id === pageId)

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Textes du site <HelpTip text="Modifiez ici les textes des pages qui n'ont pas de section dédiée (contact, inscriptions, mentions légales, pied de page…). Le bouton « Texte d'origine » restaure le texte par défaut." position="right"/></h1>
          <p className="muted" style={{ margin: 0 }}>Éditeur visuel · les modifications sont visibles immédiatement sur le site</p>
        </div>
        <a className="btn btn-ghost btn-sm" href={page.href} target="_blank" rel="noopener noreferrer">Voir la page →</a>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', marginBottom: 14, fontSize: '0.88rem' }}>
          {error}
          {/site_texts|relation|schema/i.test(error) && <> — la table <code>site_texts</code> doit être créée dans Supabase (fichier <code>supabase/site_texts.sql</code>).</>}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) 1fr', gap: 24, alignItems: 'start' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 16 }}>
          {SITE_TEXT_PAGES.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPageId(p.id)}
              className="btn btn-ghost btn-sm"
              style={{
                justifyContent: 'flex-start', textAlign: 'left',
                background: p.id === pageId ? 'var(--accent-tint)' : undefined,
                color: p.id === pageId ? 'var(--accent)' : undefined,
                fontWeight: p.id === pageId ? 700 : 500,
              }}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '22px 24px 0' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: 18 }}>{page.label}</h2>
          {loading
            ? <div style={{ padding: 20, color: 'var(--ink-mute)' }}>Chargement...</div>
            : <PageForm key={page.id} page={page} rows={rows} supabase={supabase} onSaved={saved => setRows(prev => [...prev.filter(r => !saved.some(s => s.key === r.key)), ...saved])}/>}
        </div>
      </div>
    </>
  )
}
