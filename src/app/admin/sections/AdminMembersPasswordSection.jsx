'use client'
import { useEffect, useMemo, useState } from 'react'
import Icon from '@/components/ui/Icon'
import HelpTip from '@/components/ui/HelpTip'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'

const KEY = 'members_password'

export default function AdminMembersPasswordSection() {
  const supabase = useMemo(() => createClient(), [])
  const [current, setCurrent] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [show, setShow] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('site_settings').select('value, updated_at').eq('key', KEY).maybeSingle().then(({ data, error }) => {
      if (error) setMessage({ type: 'error', text: `${error.message} — exécutez le fichier supabase/mise_a_jour_novembre_2026.sql dans Supabase.` })
      setCurrent(data?.value ?? '')
      setUpdatedAt(data?.updated_at ?? null)
      setLoading(false)
    })
  }, [supabase])

  const save = async () => {
    const next = value.trim()
    if (next.length < 6) { setMessage({ type: 'error', text: 'Choisissez au moins 6 caractères.' }); return }
    setSaving(true); setMessage(null)
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date().toISOString()
    const { error } = await supabase.from('site_settings').upsert(
      { key: KEY, value: next, updated_at: now, updated_by: user?.email ?? null },
      { onConflict: 'key' },
    )
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      await logActivity(supabase, { message: 'Mot de passe adhérents modifié', section: 'members-password', action: 'update' })
      setCurrent(next); setUpdatedAt(now); setValue(''); setShow(true)
      setMessage({ type: 'ok', text: 'Nouveau mot de passe enregistré. Il est actif immédiatement.' })
    }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="admin-head">
        <div>
          <h1>Mot de passe adhérents <HelpTip text="Ce mot de passe donne accès à l'Espace adhérents et au Planning Rando. Communiquez-le aux adhérents lors de l'inscription." position="right"/></h1>
          <p className="muted" style={{ margin: 0 }}>Espace adhérents · Planning Rando</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '22px 24px', marginBottom: 18 }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Mot de passe actuel</h2>
        {loading ? <div className="muted">Chargement…</div> : current ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <code style={{ fontSize: '1.1rem', padding: '8px 14px', background: 'var(--bg-elev)', borderRadius: 'var(--r-sm)', letterSpacing: show ? 'normal' : '0.2em' }}>
              {show ? current : '•'.repeat(Math.max(8, current.length))}
            </code>
            <button className="btn btn-ghost btn-sm" onClick={() => setShow(v => !v)}>{show ? 'Masquer' : 'Afficher'}</button>
            {updatedAt && <span className="muted" style={{ fontSize: '0.84rem' }}>Modifié le {new Date(updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
          </div>
        ) : (
          <div className="muted" style={{ fontSize: '0.92rem' }}>
            Aucun mot de passe défini ici. Si un mot de passe avait été configuré sur Vercel, il reste valable tant que vous n&apos;en définissez pas un nouveau.
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '22px 24px' }}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 12 }}>{current ? 'Changer le mot de passe' : 'Définir le mot de passe'}</h2>
        <div className="form">
          <div className="field">
            <label>Nouveau mot de passe</label>
            <input value={value} onChange={e => { setValue(e.target.value); setMessage(null) }} placeholder="Ex. Rambouillet2026" autoComplete="off"/>
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--ink-mute)', lineHeight: 1.5 }}>
            <Icon name="info" size={13}/> Les majuscules comptent. Dès l&apos;enregistrement, l&apos;ancien mot de passe ne fonctionne plus :
            pensez à prévenir les adhérents.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-primary" disabled={saving || !value.trim()} onClick={save}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {message && (
              <span style={{ fontSize: '0.88rem', color: message.type === 'error' ? 'var(--red)' : 'var(--green, var(--ink-soft))' }}>{message.text}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
