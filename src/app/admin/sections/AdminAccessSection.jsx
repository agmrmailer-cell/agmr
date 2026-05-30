'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import { createClient } from '@/lib/supabase-client'
import HelpTip from '@/components/ui/HelpTip'

// Toutes les sections disponibles — id = clé utilisée dans le sidebar
export const ALL_SECTIONS = [
  { id: 'home',          label: 'Page principale',    group: 'Activités' },
  { id: 'gym-page',      label: 'Page Gym',           group: 'Activités' },
  { id: 'gym',           label: 'Planning Gym',       group: 'Activités' },
  { id: 'rando-page',    label: 'Page Randonnée',     group: 'Activités' },
  { id: 'rando',         label: 'Planning Rando',     group: 'Activités' },
  { id: 'nordique-page', label: 'Marche nordique',    group: 'Activités' },
  { id: 'sante-page',    label: 'Santé par le sport', group: 'Activités' },
  { id: 'sejours',       label: 'Séjours',            group: 'Contenus' },
  { id: 'actu',          label: 'Actualités',         group: 'Contenus' },
  { id: 'galerie',       label: 'Galerie',            group: 'Contenus' },
  { id: 'asso-page',     label: 'Présentation asso',  group: 'Association' },
  { id: 'comite',        label: 'Comité directeur',   group: 'Association' },
  { id: 'ag',            label: 'Assemblée générale', group: 'Association' },
  { id: 'tarifs',        label: 'Tarifs',             group: 'Association' },
]

const GROUPS = ['Activités', 'Contenus', 'Association']

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

export default function AdminAccessSection() {
  const [admins, setAdmins]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [adding, setAdding]   = useState(false)
  const supabase = createClient()

  const load = async () => {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .order('created_at')
    if (!error) setAdmins(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const [resetTarget, setResetTarget] = useState(null) // { email, id }
  const [inviting, setInviting]       = useState(false)

  const saveAdmin = async (data) => {
    if (data.id) {
      // Modification simple du profil existant (pas de réinvitation)
      await supabase.from('admin_profiles').update({
        display_name: data.display_name.trim() || null,
        role:         data.role,
        permissions:  data.role === 'super_admin' ? [] : data.permissions,
      }).eq('id', data.id)
      setEditing(null); load()
    } else {
      // Nouvel admin : invitation via API route (Auth + profil en une fois)
      setInviting(true)
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      setInviting(false)
      if (!res.ok) { alert('Erreur : ' + (json.error ?? 'Inconnue')); return }
      setAdding(false); load()
    }
  }

  const resetPassword = async (targetEmail, newPassword) => {
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail, newPassword }),
    })
    const json = await res.json()
    if (!res.ok) { alert('Erreur : ' + (json.error ?? 'Inconnue')); return false }
    return true
  }

  const deleteAdmin = async (id, email, role) => {
    if (!confirm(`Supprimer le compte de ${email} ?\n\nCette action supprime l'accès admin ET le compte de connexion.`)) return
    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail: email }),
    })
    const json = await res.json()
    if (!res.ok) { alert('Erreur : ' + (json.error ?? 'Inconnue')); return }
    load()
  }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Gestion des accès</h1>
          <p className="muted" style={{ margin: 0 }}>Administrateurs et leurs permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(true)}>
          <Icon name="plus" size={14}/> Ajouter un admin
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {admins.map(a => (
          <div key={a.id} style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
            {/* Avatar */}
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: a.role === 'super_admin' ? "var(--accent)" : "var(--bg-deep)", border: "1px solid var(--line)", display: "grid", placeItems: "center", flexShrink: 0, color: a.role === 'super_admin' ? "#fff" : "var(--ink-mute)", fontFamily: "var(--serif)", fontSize: "1rem", fontWeight: 700 }}>
              {(a.display_name || a.email).charAt(0).toUpperCase()}
            </div>
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                {a.display_name || a.email}
                <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: a.role === 'super_admin' ? "rgba(184,69,31,0.12)" : "var(--bg-deep)", color: a.role === 'super_admin' ? "var(--accent)" : "var(--ink-mute)", border: `1px solid ${a.role === 'super_admin' ? "var(--accent)" : "var(--line)"}` }}>
                  {a.role === 'super_admin' ? 'Super admin' : 'Admin'}
                </span>
              </div>
              <div className="muted" style={{ fontSize: "0.84rem", marginTop: 2 }}>{a.email}</div>
              {a.role === 'admin' && (
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {a.permissions.length === 0
                    ? <span style={{ fontSize: "0.78rem", color: "var(--accent)" }}>Aucune permission</span>
                    : a.permissions.map(p => {
                        const sec = ALL_SECTIONS.find(s => s.id === p)
                        return <span key={p} style={{ fontSize: "0.74rem", padding: "2px 7px", background: "var(--bg-deep)", border: "1px solid var(--line)", borderRadius: 99, color: "var(--ink-soft)" }}>{sec?.label ?? p}</span>
                      })
                  }
                </div>
              )}
              {a.role === 'super_admin' && (
                <div style={{ marginTop: 4, fontSize: "0.78rem", color: "var(--ink-mute)" }}>Accès complet à toutes les sections</div>
              )}
            </div>
            {/* Actions */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
              {a.role !== 'super_admin' && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setResetTarget({ email: a.email, name: a.display_name || a.email })}
                  title="Réinitialiser le mot de passe"
                >
                  <Icon name="lock" size={13}/> Mot de passe
                </button>
              )}
              <button className="icon-btn" onClick={() => setEditing(a)}><Icon name="edit" size={14}/></button>
              <button className="icon-btn" onClick={() => deleteAdmin(a.id, a.email, a.role)} style={{ color: "var(--accent)" }}><Icon name="trash" size={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div style={{ marginTop: 24, padding: "16px 20px", background: "var(--bg-deep)", borderRadius: "var(--r-sm)", fontSize: "0.86rem", color: "var(--ink-soft)", border: "1px solid var(--line)", lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 8 }}>
        <div><strong style={{ color: "var(--ink)" }}>Créer un compte</strong> — renseignez l'email, le nom, le rôle et les permissions, puis générez ou saisissez un mot de passe temporaire. Copiez-le et communiquez-le à la personne. Elle se connecte directement sur <code style={{ background: "var(--bg-card)", padding: "1px 5px", borderRadius: 3 }}>/admin</code>.</div>
        <div><strong style={{ color: "var(--ink)" }}>Réinitialiser un mot de passe</strong> — bouton « Mot de passe » sur chaque ligne (non disponible pour les super admins).</div>
        <div><strong style={{ color: "var(--ink)" }}>Supprimer un compte</strong> — supprime à la fois l'accès admin et le compte de connexion. Les super admins ne peuvent pas se supprimer mutuellement.</div>
        <div><strong style={{ color: "var(--ink)" }}>Rôles</strong> — <em>Super admin</em> : accès complet à tout le back-office. <em>Admin classique</em> : accès limité aux sections cochées uniquement.</div>
      </div>

      {/* Modal reset mot de passe */}
      {resetTarget && (
        <Modal
          title={`Mot de passe — ${resetTarget.name}`}
          onClose={() => setResetTarget(null)}
        >
          <ResetPasswordForm
            target={resetTarget}
            onSave={async (pwd) => {
              const ok = await resetPassword(resetTarget.email, pwd)
              if (ok) { alert('Mot de passe modifié avec succès.'); setResetTarget(null) }
            }}
            onCancel={() => setResetTarget(null)}
          />
        </Modal>
      )}

      {/* Modal édition */}
      {(editing || adding) && (
        <Modal
          title={editing ? `Modifier — ${editing.display_name || editing.email}` : 'Nouvel administrateur'}
          onClose={() => { setEditing(null); setAdding(false) }}
        >
          <AdminForm
            item={editing ?? { email: '', display_name: '', role: 'admin', permissions: [] }}
            onSave={saveAdmin}
            onCancel={() => { setEditing(null); setAdding(false) }}
          />
        </Modal>
      )}
    </>
  )
}

/** Génère un mot de passe temporaire lisible : Mot-XXXX-#### */
function genPassword() {
  const words = ['Agmr','Gym','Rando','Marche','Sport','Club','Equipe']
  const word   = words[Math.floor(Math.random() * words.length)]
  const chars  = 'abcdefghjkmnpqrstuvwxyz'
  const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const num    = String(Math.floor(Math.random() * 900) + 100)
  return `${word}-${suffix}${num}!`
}

function AdminForm({ item, onSave, onCancel }) {
  const isNew = !item.id
  const [f, setF] = useState({
    id:           item.id,
    email:        item.email,
    display_name: item.display_name ?? '',
    role:         item.role,
    permissions:  Array.isArray(item.permissions) ? [...item.permissions] : [],
    password:     isNew ? genPassword() : '',
  })
  const [copied, setCopied] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const copyPwd = () => {
    navigator.clipboard.writeText(f.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const togglePerm = (id) => {
    setF(p => ({
      ...p,
      permissions: p.permissions.includes(id)
        ? p.permissions.filter(x => x !== id)
        : [...p.permissions, id],
    }))
  }

  const toggleGroup = (group) => {
    const ids = ALL_SECTIONS.filter(s => s.group === group).map(s => s.id)
    const allOn = ids.every(id => f.permissions.includes(id))
    setF(p => ({
      ...p,
      permissions: allOn
        ? p.permissions.filter(x => !ids.includes(x))
        : [...new Set([...p.permissions, ...ids])],
    }))
  }

  return (
    <div className="form">
      <div className="row-2">
        <div className="field">
          <label>Email (compte Supabase Auth)</label>
          <input
            value={f.email}
            onChange={e => setF(p => ({ ...p, email: e.target.value }))}
            placeholder="prenom.nom@email.com"
            disabled={!!item.id}
            style={item.id ? { opacity: 0.6 } : {}}
          />
        </div>
        <div className="field">
          <label>Nom affiché (optionnel)</label>
          <input value={f.display_name} onChange={e => setF(p => ({ ...p, display_name: e.target.value }))} placeholder="Marie Dupont"/>
        </div>
      </div>

      <div className="field">
        <label>Rôle</label>
        <select value={f.role} onChange={e => setF(p => ({ ...p, role: e.target.value }))}>
          <option value="admin">Admin classique (permissions limitées)</option>
          <option value="super_admin">Super admin (accès complet)</option>
        </select>
      </div>

      {/* Mot de passe temporaire — seulement à la création */}
      {isNew && (
        <div className="field">
          <label>Mot de passe temporaire</label>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type={showPwd ? "text" : "password"}
                value={f.password}
                onChange={e => setF(p => ({ ...p, password: e.target.value }))}
                style={{ width: "100%", fontFamily: "monospace", paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowPwd(s => !s)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-mute)", fontSize: "0.8rem" }}>
                {showPwd
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF(p => ({ ...p, password: genPassword() }))}
              title="Générer un nouveau mot de passe">
              ↺ Générer
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={copyPwd}
              style={{ minWidth: 80, color: copied ? "var(--green)" : undefined }}>
              {copied ? '✓ Copié !' : '⎘ Copier'}
            </button>
          </div>
          <span style={{ fontSize: "0.78rem", color: "var(--ink-mute)", marginTop: 4 }}>
            Communiquez ce mot de passe à la personne — elle pourra le modifier depuis ses paramètres.
          </span>
        </div>
      )}

      {f.role === 'admin' && (
        <div style={{ marginTop: 4 }}>
          <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 14, color: "var(--ink-soft)" }}>
            Permissions — sections accessibles
          </div>

          {GROUPS.map(group => {
            const sections = ALL_SECTIONS.filter(s => s.group === group)
            const allOn = sections.every(s => f.permissions.includes(s.id))
            const someOn = sections.some(s => f.permissions.includes(s.id))
            return (
              <div key={group} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-mute)" }}>{group}</span>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group)}
                    style={{ fontSize: "0.76rem", padding: "2px 8px", border: "1px solid var(--line)", borderRadius: 99, background: "none", cursor: "pointer", color: "var(--ink-mute)" }}
                  >
                    {allOn ? 'Tout décocher' : someOn ? 'Tout cocher' : 'Tout cocher'}
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {sections.map(s => (
                    <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", cursor: "pointer", background: f.permissions.includes(s.id) ? "rgba(var(--accent-rgb, 184,69,31),0.06)" : "var(--bg-deep)", fontSize: "0.88rem" }}>
                      <input
                        type="checkbox"
                        checked={f.permissions.includes(s.id)}
                        onChange={() => togglePerm(s.id)}
                        style={{ accentColor: "var(--accent)" }}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {f.role === 'super_admin' && (
        <div style={{ padding: "12px 16px", background: "rgba(184,69,31,0.06)", border: "1px solid rgba(184,69,31,0.25)", borderRadius: "var(--r-sm)", fontSize: "0.86rem", color: "var(--ink-soft)" }}>
          Le super admin a accès à l'intégralité de l'administration, y compris cette section de gestion des accès.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button
          className="btn btn-primary"
          onClick={() => onSave(f)}
          disabled={!f.email.trim() || (isNew && f.password.length < 8)}
        >
          {item.id ? 'Enregistrer' : 'Créer le compte'}
        </button>
      </div>
    </div>
  )
}

function ResetPasswordForm({ target, onSave, onCancel }) {
  const [pwd, setPwd]       = useState('')
  const [pwd2, setPwd2]     = useState('')
  const [show, setShow]     = useState(false)
  const [saving, setSaving] = useState(false)

  const valid = pwd.length >= 8 && pwd === pwd2

  const submit = async () => {
    if (!valid) return
    setSaving(true)
    await onSave(pwd)
    setSaving(false)
  }

  return (
    <div className="form">
      <div style={{ padding: "10px 14px", background: "var(--bg-deep)", borderRadius: "var(--r-sm)", fontSize: "0.86rem", color: "var(--ink-mute)", marginBottom: 4 }}>
        Définissez un nouveau mot de passe pour <strong style={{ color: "var(--ink)" }}>{target.email}</strong>.
        La personne pourra le modifier ensuite depuis ses paramètres.
      </div>
      <div className="field">
        <label>Nouveau mot de passe</label>
        <div style={{ position: "relative" }}>
          <input
            type={show ? "text" : "password"}
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            placeholder="8 caractères minimum"
            style={{ paddingRight: 40 }}
          />
          <button type="button" onClick={() => setShow(s => !s)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--ink-mute)", fontSize: "0.8rem" }}>
            {show
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>
        {pwd.length > 0 && pwd.length < 8 && (
          <span style={{ fontSize: "0.78rem", color: "var(--accent)" }}>Trop court — 8 caractères minimum</span>
        )}
      </div>
      <div className="field">
        <label>Confirmer le mot de passe</label>
        <input
          type={show ? "text" : "password"}
          value={pwd2}
          onChange={e => setPwd2(e.target.value)}
          placeholder="Répéter le mot de passe"
        />
        {pwd2.length > 0 && pwd !== pwd2 && (
          <span style={{ fontSize: "0.78rem", color: "var(--accent)" }}>Les mots de passe ne correspondent pas</span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
        <button className="btn btn-primary" onClick={submit} disabled={!valid || saving}>
          {saving ? 'Modification…' : 'Modifier le mot de passe'}
        </button>
      </div>
    </div>
  )
}
