'use client'
import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'
import ExternalLinksPanel from '@/components/links/ExternalLinksPanel'
import { fetchMembersLinks, getStoredCode, storeCode } from '@/lib/members-access'

// Planning rando réservé aux adhérents (mot de passe adhérents) :
// les liens ne sont jamais envoyés au navigateur sans le bon mot de passe.
export default function PlanningRandoClient({ title, intro, loginTitle, loginText, emptyText }) {
  const [code, setCode] = useState('')
  const [links, setLinks] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const stored = getStoredCode()
    if (!stored) return
    fetchMembersLinks(stored, 'planning-rando')
      .then(setLinks)
      .catch(() => storeCode(''))
  }, [])

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      setLinks(await fetchMembersLinks(code, 'planning-rando'))
      storeCode(code)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  if (links) {
    return (
      <section className="section">
        <div className="container">
          <ExternalLinksPanel links={links} title={title} intro={intro}/>
          {links.length === 0 && (
            <div style={{ marginTop: 16, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 28, textAlign: 'center', color: 'var(--ink-mute)' }}>
              {emptyText}
            </div>
          )}
          <div style={{ marginTop: 18 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setLinks(null); setCode(''); storeCode('') }}>
              <Icon name="lock" size={14}/> Verrouiller
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="container-narrow">
        <div style={{ maxWidth: 460, margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '32px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Icon name="lock" size={18}/>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{loginTitle}</h2>
          </div>
          {loginText}
          <form className="form" onSubmit={submit} style={{ marginTop: 18 }}>
            <div className="field">
              <label>Mot de passe adhérents</label>
              <input type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="••••••••" autoComplete="current-password"/>
            </div>
            <button className="btn btn-primary" disabled={loading || !code.trim()}>
              {loading ? 'Vérification…' : 'Voir le planning'}
            </button>
            {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
          </form>
        </div>
      </div>
    </section>
  )
}
