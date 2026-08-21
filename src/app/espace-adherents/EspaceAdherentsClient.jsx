'use client'
import { useState } from 'react'
import AGMRLogo from '@/components/ui/AGMRLogo'
import Icon from '@/components/ui/Icon'
import ExternalLinksPanel from '@/components/links/ExternalLinksPanel'

export default function EspaceAdherentsClient() {
  const [code, setCode] = useState('')
  const [links, setLinks] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch('/api/espace-adherents/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok || json.ok === false) {
      setError(json.error ?? 'Acces impossible')
      setLinks(null)
      return
    }
    setLinks(json.links ?? [])
  }

  if (links) {
    return (
      <div className="container-narrow" style={{ padding: '48px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: '0.74rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 6, fontWeight: 600 }}>
              Espace adherents
            </div>
            <h1 style={{ margin: 0 }}>Ressources reservees</h1>
          </div>
          <button className="btn btn-ghost" onClick={() => { setLinks(null); setCode('') }}>
            <Icon name="lock" size={14}/> Verrouiller
          </button>
        </div>
        <ExternalLinksPanel
          links={links}
          title="Liens adherents"
          intro="Albums photos, videos, documents et ressources partagees avec les membres."
        />
        {links.length === 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 28, textAlign: 'center', color: 'var(--ink-mute)' }}>
            Aucun lien reserve n&apos;est publie pour le moment.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <AGMRLogo size={52}/>
        <div style={{ fontSize: '0.74rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 6, fontWeight: 600, marginTop: 24 }}>
          Espace adherents
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Acces reserve</h2>
        <p style={{ color: 'var(--ink-mute)', marginBottom: 24, fontSize: '0.96rem' }}>
          Mot de passe communique lors de l&apos;inscription.
        </p>
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label>Mot de passe</label>
            <input type="password" value={code} onChange={e => setCode(e.target.value)} placeholder="••••••••"/>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} disabled={loading || !code.trim()}>
            <Icon name="lock" size={15}/> {loading ? 'Verification...' : 'Acceder'}
          </button>
          {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', marginTop: 12 }}>{error}</p>}
        </form>
      </div>
    </div>
  )
}
