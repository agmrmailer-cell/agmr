import Link from 'next/link'
import { genericType } from '@/lib/generic-blocks'
import Editable from '@/components/editable/Editable'
import { blockSrc } from '@/lib/editable-src'
import { getEditMode } from '@/lib/edit-mode'
import { canEditTable } from '@/lib/permissions'

// `table` : table Supabase du bloc, pour l'édition visuelle sur le site
export default async function GenericBlockRenderer({ block, table }) {
  const edit = table ? canEditTable(await getEditMode(), table) : false
  const c = block.content ?? {}
  const type = genericType(block.block_key)
  const src = field => (table ? blockSrc(table, block.block_key, field) : null)

  switch (type) {
    case 'texte':
      return (
        <div style={{ marginTop: 32 }}>
          {(c.titre || edit) && (
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', marginBottom: 14 }}>
              <Editable plain src={src('titre')} value={c.titre} label="Titre"/>
            </h3>
          )}
          <Editable src={src('texte')} value={c.texte} style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }} label="Texte"/>
        </div>
      )

    case 'citation':
      return (
        <div className="quote" style={{ padding: '48px 0 24px', marginTop: 32 }}>
          <div className="quote-body" style={{ padding: 0 }}>
            <div className="quote-text" style={{ fontSize: '1.7rem' }}>
              « <Editable inline src={src('citation')} value={c.citation} fallback="…" label="Citation"/> »
            </div>
            <div className="quote-attr">
              <div className="quote-avatar">{(c.auteur ?? 'A').charAt(0).toUpperCase()}</div>
              <div className="quote-attr-text">
                <span className="quote-attr-name"><Editable plain src={src('auteur')} value={c.auteur} fallback="Auteur" label="Auteur"/></span>
                <span className="quote-attr-role"><Editable plain src={src('role')} value={c.role} label="Rôle"/></span>
              </div>
            </div>
          </div>
        </div>
      )

    case 'cta':
      return (
        <div style={{ marginTop: 32, padding: 32, background: 'var(--accent-tint)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          {(c.titre || edit) && <h3 style={{ marginBottom: 10 }}><Editable plain src={src('titre')} value={c.titre} label="Titre"/></h3>}
          <Editable src={src('texte')} value={c.texte} style={{ color: 'var(--ink-soft)', marginBottom: 20 }} label="Texte"/>
          {c.lien && (
            <Link className="btn btn-primary" href={c.lien}>
              <Editable plain src={src('bouton')} value={c.bouton} fallback="En savoir plus" label="Texte du bouton"/>
            </Link>
          )}
        </div>
      )

    case 'alerte':
      return (
        <div style={{ marginTop: 24, background: 'var(--accent-tint)', border: '1px solid var(--accent-soft)', borderRadius: 'var(--r-md)', padding: 20, fontSize: '0.96rem' }}>
          {(c.titre || edit) && <strong><Editable plain src={src('titre')} value={c.titre} label="Titre"/> </strong>}
          <Editable inline src={src('texte')} value={c.texte} label="Texte"/>
        </div>
      )

    default:
      return null
  }
}
