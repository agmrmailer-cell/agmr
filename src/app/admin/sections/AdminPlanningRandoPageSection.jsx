'use client'
import { useEffect, useMemo, useState } from 'react'
import Icon from '@/components/ui/Icon'
import HelpTip from '@/components/ui/HelpTip'
import { createClient } from '@/lib/supabase-client'
import { siteTextPage } from '@/lib/site-texts'
import { PageForm } from './AdminSiteTextsSection'
import { frenchError } from '@/lib/errors'

// Planning Rando : la page publique est protégée par le mot de passe adhérents.
// Les plannings eux-mêmes sont des liens (Google Docs / Sheets…) gérés dans « Liens », zone « Planning rando ».
export default function AdminPlanningRandoPageSection({ onOpenLinks }) {
  const supabase = useMemo(() => createClient(), [])
  const page = siteTextPage('planning-rando')
  const [rows, setRows] = useState(null)
  const [links, setLinks] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.from('site_texts').select('key, value').like('key', 'planning-rando.%').then(({ data, error: e }) => {
      if (e) setError(frenchError(e))
      setRows(data ?? [])
    })
    supabase.from('external_links').select('id, title, url, active').contains('zones', ['planning-rando']).order('ordre')
      .then(({ data }) => setLinks(data ?? []))
  }, [supabase])

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Planning Rando <HelpTip text="La page publique Planning Rando n'est visible qu'avec le mot de passe adhérents. Ajoutez vos plannings (Google Docs, Sheets…) comme liens dans la zone « Planning rando »." position="right"/></h1>
          <p className="muted" style={{ margin: 0 }}>Page réservée aux adhérents · plannings sous forme de liens</p>
        </div>
        <a className="btn btn-ghost btn-sm" href="/planning/randonnee" target="_blank" rel="noopener noreferrer">Voir la page →</a>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>1. Les plannings affichés</h2>
          <button className="btn btn-primary btn-sm" onClick={onOpenLinks}><Icon name="plus" size={14}/> Ajouter / modifier un planning</button>
        </div>
        {links === null ? (
          <div className="muted">Chargement…</div>
        ) : links.length === 0 ? (
          <div className="muted" style={{ fontSize: '0.92rem' }}>
            Aucun planning pour l&apos;instant. Cliquez sur « Ajouter / modifier un planning », collez le lien du document
            et cochez la zone <strong>Planning rando</strong>.
          </div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.92rem' }}>
            {links.map(l => (
              <li key={l.id} style={{ marginBottom: 4 }}>
                <a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>
                {!l.active && <span className="muted"> · désactivé (non affiché)</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '20px 24px 0' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 14 }}>2. Les textes de la page</h2>
        {error && (
          <div style={{ color: 'var(--red)', marginBottom: 14, fontSize: '0.88rem' }}>
            {error} — la table <code>site_texts</code> doit être créée dans Supabase (fichier <code>supabase/site_texts.sql</code>).
          </div>
        )}
        {rows === null
          ? <div className="muted" style={{ paddingBottom: 20 }}>Chargement…</div>
          : <PageForm page={page} rows={rows} supabase={supabase} onSaved={saved => setRows(prev => [...prev.filter(r => !saved.some(s => s.key === r.key)), ...saved])}/>}
      </div>
    </>
  )
}
