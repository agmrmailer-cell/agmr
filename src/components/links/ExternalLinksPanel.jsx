'use client'
import Link from 'next/link'

const KIND_LABELS = {
  planning: 'Planning',
  payment: 'Paiement',
  album: 'Album',
  video: 'Video',
  document: 'Document',
  external: 'Lien',
}

function isInternalHref(url) {
  return url?.startsWith('/')
}

function LinkShell({ href, className, children }) {
  if (isInternalHref(href)) return <Link className={className} href={href}>{children}</Link>
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>
}

export default function ExternalLinksPanel({ links, title = 'Liens utiles', intro, compact = false }) {
  if (!links?.length) return null

  return (
    <div style={{
      marginTop: compact ? 18 : 32,
      padding: compact ? 18 : 24,
      background: 'var(--bg-elev)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: compact ? 'flex-start' : 'center', marginBottom: 16 }}>
        <div>
          <strong>{title}</strong>
          {intro && <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--ink-mute)' }}>{intro}</p>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {links.map(link => (
          <LinkShell key={link.id} href={link.url} className="btn btn-ghost btn-sm">
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, minWidth: 0 }}>
              <span style={{ fontWeight: 700 }}>{link.title}</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--ink-mute)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {KIND_LABELS[link.kind] ?? 'Lien'}
              </span>
              {link.description && <span style={{ fontSize: '0.8rem', color: 'var(--ink-mute)', fontWeight: 400 }}>{link.description}</span>}
            </span>
          </LinkShell>
        ))}
      </div>
    </div>
  )
}
