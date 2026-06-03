'use client'
import { useState, useEffect, useRef } from 'react'
import Icon from '@/components/ui/Icon'
import HelpTip from '@/components/ui/HelpTip'
import { createClient } from '@/lib/supabase-client'

const BACKUP_TABLES = [
  { group: 'Contenu du site',       tables: ['home_blocks', 'gym_page_blocks', 'rando_page_blocks', 'nordique_page_blocks', 'sante_page_blocks', 'asso_page_blocks'] },
  { group: 'Planning & activités',  tables: ['gym_courses', 'vacances_scolaires', 'rando_sorties', 'rando_jeudi_groupes', 'gym_disciplines', 'gym_animateurs'] },
  { group: 'Actualités & contenus', tables: ['actualites', 'sejours', 'galerie_photos', 'ag_documents'] },
  { group: 'Association',           tables: ['bureau', 'tarifs', 'site_stats'] },
  { group: 'Administration',        tables: ['admin_profiles', 'contact_messages', 'activity_log'] },
]
const ALL_TABLES = BACKUP_TABLES.flatMap(g => g.tables)

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Export manuel ───────────────────────────────────────────────────────────
function ExportCard({ lastBackup, setLastBackup }) {
  const [loading, setLoading]   = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError]       = useState(null)
  const supabase = createClient()

  const runBackup = async () => {
    setLoading(true); setError(null)
    setProgress({ done: 0, total: ALL_TABLES.length, current: '' })

    const backup = {
      meta: { version: '1.0', site: 'AGMR — Gym Marche Rambouillet', created_at: new Date().toISOString(), tables: ALL_TABLES.length, source: 'manual' },
      data: {},
    }

    let done = 0
    for (const table of ALL_TABLES) {
      setProgress({ done, total: ALL_TABLES.length, current: table })
      const { data, error } = await supabase.from(table).select('*')
      backup.data[table] = error ? [] : (data ?? [])
      done++
    }

    setProgress({ done, total: ALL_TABLES.length, current: 'Génération du fichier…' })

    const json     = JSON.stringify(backup, null, 2)
    const blob     = new Blob([json], { type: 'application/json' })
    const url      = URL.createObjectURL(blob)
    const date     = new Date().toISOString().slice(0, 10)
    const filename = `agmr-backup-${date}.json`
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    const now = new Date().toLocaleString('fr-FR')
    try { localStorage.setItem('agmr_last_backup', now) } catch {}
    setLastBackup(now)
    setProgress({ done, total: ALL_TABLES.length, current: `✓ ${filename} (${formatBytes(blob.size)})` })
    setLoading(false)
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--green-tint)', border: '1px solid var(--green-soft)', display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
          <Icon name="download" size={18}/>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>Export JSON manuel <HelpTip text="Un fichier JSON contient toutes les données du site (planning, actualités, tarifs…). Vous pouvez le conserver sur votre ordinateur ou une clé USB comme copie de sécurité." /></div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-mute)' }}>{ALL_TABLES.length} tables · téléchargement direct</div>
        </div>
      </div>

      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', marginBottom: 20, lineHeight: 1.6 }}>
        Exporte l'intégralité des données du site dans un fichier JSON téléchargeable localement.
      </p>

      {lastBackup && (
        <div style={{ fontSize: '0.8rem', color: 'var(--ink-mute)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="clock" size={13}/>
          Dernier export manuel : {lastBackup}
        </div>
      )}

      <button className="btn btn-primary" onClick={runBackup} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
        {loading ? <><Icon name="download" size={15}/> Export en cours…</> : <><Icon name="download" size={15}/> Télécharger la sauvegarde</>}
      </button>

      {error && <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--red)' }}>{error}</p>}

      {progress && (
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 5, background: 'var(--line)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${(progress.done / progress.total) * 100}%`, background: 'var(--green)', transition: 'width .3s', borderRadius: 99 }}/>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>
            {progress.done}/{progress.total} — <span style={{ fontFamily: 'monospace' }}>{progress.current}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sauvegardes automatiques ────────────────────────────────────────────────
function AutoBackupsCard({ onRestoreFromStorage }) {
  const [backups, setBackups]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [deleting, setDeleting]   = useState(null)
  const [error, setError]         = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    const res = await fetch('/api/admin/backups')
    if (!res.ok) { setError('Impossible de charger les sauvegardes'); setLoading(false); return }
    const { backups } = await res.json()
    setBackups(backups ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (name) => {
    if (!confirm(`Supprimer ${name} ?`)) return
    setDeleting(name)
    await fetch(`/api/admin/backups?name=${encodeURIComponent(name)}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-tint)', border: '1px solid var(--accent-soft)', display: 'grid', placeItems: 'center', color: 'var(--accent)' }}>
          <Icon name="clock" size={18}/>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>Sauvegardes automatiques <HelpTip text="Chaque nuit à 2h, le site enregistre automatiquement une copie de toutes ses données sur nos serveurs. Les 7 dernières sont conservées, les plus anciennes sont supprimées." position="bottom" /></div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-mute)' }}>Quotidiennes · 2h du matin · 7 conservées</div>
        </div>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '0.8rem' }} onClick={load}>
          <Icon name="refresh" size={13}/>
        </button>
      </div>

      {loading && <div style={{ fontSize: '0.85rem', color: 'var(--ink-mute)', textAlign: 'center', padding: '20px 0' }}>Chargement…</div>}
      {error   && <div style={{ fontSize: '0.85rem', color: 'var(--red)' }}>{error}</div>}

      {!loading && backups?.length === 0 && (
        <div style={{ fontSize: '0.85rem', color: 'var(--ink-mute)', textAlign: 'center', padding: '20px 0' }}>
          Aucune sauvegarde automatique pour l'instant.<br/>
          <span style={{ fontSize: '0.8rem' }}>La première sera créée cette nuit à 2h.</span>
        </div>
      )}

      {!loading && backups?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {backups.map(b => (
            <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-deep)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line-soft)' }}>
              <Icon name="file" size={14} style={{ color: 'var(--ink-mute)', flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-mute)' }}>{formatDate(b.created_at)} · {formatBytes(b.size)}</div>
              </div>
              {b.url && (
                <a href={b.url} download={b.name} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.8rem' }} title="Télécharger">
                  <Icon name="download" size={13}/>
                </a>
              )}
              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--green)' }} onClick={() => onRestoreFromStorage(b.name)} title="Restaurer">
                <Icon name="refresh" size={13}/>
              </button>
              <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--red)' }} onClick={() => handleDelete(b.name)} disabled={deleting === b.name} title="Supprimer">
                <Icon name="trash" size={13}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Restauration ────────────────────────────────────────────────────────────
function RestoreCard({ storagePath, onClear }) {
  const fileRef                   = useRef(null)
  const [backupData, setBackupData] = useState(null)
  const [backupMeta, setBackupMeta] = useState(null)
  const [selected, setSelected]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [dragOver, setDragOver]   = useState(false)

  // Pré-remplir depuis Storage
  useEffect(() => {
    if (!storagePath) return
    setBackupData(null); setBackupMeta({ name: storagePath, source: 'storage' })
    setSelected(ALL_TABLES); setResults(null); setError(null)
  }, [storagePath])

  const parseFile = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        setBackupMeta(parsed.meta ?? {})
        setBackupData(parsed.data)
        setSelected(Object.keys(parsed.data).filter(t => ALL_TABLES.includes(t)))
        setResults(null); setError(null)
        if (onClear) onClear()
      } catch {
        setError('Fichier JSON invalide ou corrompu.')
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  const toggleTable = (t) => setSelected(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t])
  const toggleAll   = () => setSelected(s => s.length === ALL_TABLES.length ? [] : [...ALL_TABLES])

  const runRestore = async () => {
    if (!confirm(`Restaurer ${selected.length} table(s) ? Les données actuelles seront remplacées.`)) return
    setLoading(true); setError(null); setResults(null)

    const body = storagePath && !backupData
      ? { storagePath, tables: selected }
      : { data: backupData, tables: selected }

    const res = await fetch('/api/admin/backups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Erreur serveur'); setLoading(false); return }
    setResults(json.results)
    setLoading(false)
  }

  const hasSource = backupData || storagePath

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--orange-tint, #fff3e0)', border: '1px solid var(--orange-soft, #ffcc80)', display: 'grid', placeItems: 'center', color: 'var(--orange, #f57c00)' }}>
          <Icon name="refresh" size={18}/>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>Restauration <HelpTip text="Restaurer permet de remettre le site dans l'état d'une sauvegarde précédente. Utile si des données ont été supprimées par erreur. Attention : cela remplace les données actuelles." position="bottom" /></div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-mute)' }}>Depuis un fichier ou une sauvegarde automatique</div>
        </div>
        {hasSource && (
          <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '4px 10px' }} onClick={() => { setBackupData(null); setBackupMeta(null); setResults(null); setError(null); if (onClear) onClear() }}>
            Effacer
          </button>
        )}
      </div>

      {/* Source */}
      {!hasSource && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--line)'}`, borderRadius: 'var(--r-sm)', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color .2s', background: dragOver ? 'var(--accent-tint)' : 'transparent', marginBottom: 20 }}
        >
          <Icon name="upload" size={24} style={{ color: 'var(--ink-mute)', marginBottom: 8 }}/>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>Déposer un fichier JSON</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-mute)' }}>ou cliquer pour sélectionner · agmr-backup-*.json</div>
          <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={e => e.target.files[0] && parseFile(e.target.files[0])}/>
        </div>
      )}

      {storagePath && !backupData && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--accent-tint)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--r-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="clock" size={14}/>
          Restauration depuis : <code style={{ fontFamily: 'monospace' }}>{storagePath}</code>
        </div>
      )}

      {backupMeta && backupData && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--green-tint)', border: '1px solid var(--green-soft)', borderRadius: 'var(--r-sm)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="check" size={14} style={{ color: 'var(--green)' }}/>
          Fichier chargé · {backupMeta.tables} tables · {formatDate(backupMeta.created_at)}
        </div>
      )}

      {/* Sélection des tables */}
      {hasSource && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tables à restaurer</div>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '2px 8px' }} onClick={toggleAll}>
              {selected.length === ALL_TABLES.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 16px', marginBottom: 20 }}>
            {BACKUP_TABLES.map(({ group, tables }) => (
              <div key={group}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 6 }}>{group}</div>
                {tables.map(t => (
                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer', padding: '2px 0' }}>
                    <input type="checkbox" checked={selected.includes(t)} onChange={() => toggleTable(t)} style={{ accentColor: 'var(--accent)' }}/>
                    <code>{t}</code>
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 14px', background: 'var(--red-tint, #fff5f5)', border: '1px solid var(--red-soft, #ffcccc)', borderRadius: 'var(--r-sm)', fontSize: '0.84rem', color: 'var(--ink-soft)', marginBottom: 16, display: 'flex', gap: 8 }}>
            <Icon name="warning" size={15} style={{ flexShrink: 0, color: 'var(--red, #e53e3e)', marginTop: 1 }}/>
            <span><strong>Attention :</strong> la restauration <strong>remplace</strong> toutes les données des tables sélectionnées. Cette action est irréversible sans une autre sauvegarde.</span>
          </div>

          <button className="btn btn-primary" onClick={runRestore} disabled={loading || selected.length === 0} style={{ width: '100%', justifyContent: 'center', background: 'var(--red, #e53e3e)', borderColor: 'var(--red, #e53e3e)' }}>
            {loading ? 'Restauration en cours…' : `Restaurer ${selected.length} table${selected.length > 1 ? 's' : ''}`}
          </button>

          {error && <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'var(--red)' }}>{error}</p>}

          {results && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>Résultats</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(results).map(([table, res]) => (
                  <div key={table} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem' }}>
                    <Icon name={res.error ? 'x' : 'check'} size={13} style={{ color: res.error ? 'var(--red)' : 'var(--green)', flexShrink: 0 }}/>
                    <code>{table}</code>
                    <span style={{ color: 'var(--ink-mute)' }}>
                      {res.error ? res.error : res.skipped ? 'ignorée' : `${res.restored} ligne${res.restored !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function AdminBackupSection() {
  const [lastBackup, setLastBackup] = useState(() => {
    try { return localStorage.getItem('agmr_last_backup') } catch { return null }
  })
  const [restorePath, setRestorePath] = useState(null)

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Sauvegarde <HelpTip text="Cette section vous permet de protéger les données du site. Il est conseillé de faire un export manuel avant toute modification importante." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>Export, sauvegardes automatiques et restauration</p>
        </div>
      </div>

      {/* Ligne 1 : Export + Automatique */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <ExportCard lastBackup={lastBackup} setLastBackup={setLastBackup}/>
        <AutoBackupsCard onRestoreFromStorage={(path) => setRestorePath(path)}/>
      </div>

      {/* Ligne 2 : Restauration (pleine largeur) */}
      <RestoreCard storagePath={restorePath} onClear={() => setRestorePath(null)}/>

      {/* Détail des tables */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden', marginTop: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line-soft)', fontWeight: 700, fontSize: '0.9rem' }}>
          Contenu des sauvegardes
        </div>
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 24px' }}>
          {BACKUP_TABLES.map(({ group, tables }) => (
            <div key={group}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-mute)', marginBottom: 8 }}>{group}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {tables.map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }}/>
                    <code style={{ fontSize: '0.82rem' }}>{t}</code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note images */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--accent-tint)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--r-sm)', fontSize: '0.84rem', color: 'var(--ink-soft)', display: 'flex', gap: 10 }}>
        <Icon name="info" size={15}/>
        <span>
          <strong>Images :</strong> hébergées sur Cloudinary (galerie) et Supabase Storage (actualités, séjours). Les URLs sont incluses dans l'export. Les fichiers images sont sauvegardés automatiquement par ces services.
        </span>
      </div>
    </>
  )
}
