import Link from 'next/link'
import { genericType } from '@/lib/generic-blocks'
import RichText from '@/components/ui/RichText'

export default function GenericBlockRenderer({ block }) {
  const c = block.content ?? {}
  const type = genericType(block.block_key)

  switch (type) {
    case 'texte':
      return (
        <div style={{ marginTop: 32 }}>
          {c.titre && <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', marginBottom: 14 }}>{c.titre}</h3>}
          <RichText value={c.texte} style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}/>
        </div>
      )

    case 'citation':
      return (
        <div className="quote" style={{ padding: '48px 0 24px', marginTop: 32 }}>
          <div className="quote-body" style={{ padding: 0 }}>
            <div className="quote-text" style={{ fontSize: '1.7rem' }}>
              « <RichText inline value={c.citation} fallback={'…'}/> »
            </div>
            <div className="quote-attr">
              <div className="quote-avatar">{(c.auteur ?? 'A').charAt(0).toUpperCase()}</div>
              <div className="quote-attr-text">
                <span className="quote-attr-name">{c.auteur ?? 'Auteur'}</span>
                <span className="quote-attr-role">{c.role ?? ''}</span>
              </div>
            </div>
          </div>
        </div>
      )

    case 'cta':
      return (
        <div style={{ marginTop: 32, padding: 32, background: 'var(--accent-tint)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          {c.titre && <h3 style={{ marginBottom: 10 }}>{c.titre}</h3>}
          <RichText value={c.texte} style={{ color: 'var(--ink-soft)', marginBottom: 20 }}/>
          {c.lien && (
            <Link className="btn btn-primary" href={c.lien}>
              {c.bouton ?? 'En savoir plus'}
            </Link>
          )}
        </div>
      )

    case 'alerte':
      return (
        <div style={{ marginTop: 24, background: 'var(--accent-tint)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--r-md)', padding: 20, fontSize: '0.96rem' }}>
          {c.titre && <strong>{c.titre} </strong>}
          <RichText inline value={c.texte}/>
        </div>
      )

    default:
      return null
  }
}
