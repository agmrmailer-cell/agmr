'use client'
import { useMemo, useRef, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { saveEditable } from '@/lib/editable-save'
import { isHtml, toInlineHtml, unwrapSingleParagraph } from '@/lib/rich-text'

// L'éditeur n'est chargé qu'au premier clic (jamais pour les visiteurs)
const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), {
  ssr: false,
  loading: () => <div className="editable-loading">Chargement de l&apos;éditeur…</div>,
})

const PLACEHOLDER = 'Cliquez pour ajouter un texte'

function notify(message, type = 'ok') {
  window.dispatchEvent(new CustomEvent('agmr-edit-toast', { detail: { message, type } }))
}

// Rendu d'un contenu riche (déjà nettoyé) avec les props de l'élément éditable
function RichDisplay({ html, as: Tag, inline, className, style, ...rest }) {
  if (!html) return <Tag className={className} style={style} {...rest}><span className="editable-placeholder">{PLACEHOLDER}</span></Tag>
  if (!isHtml(html)) {
    const T = inline ? 'span' : Tag
    return <T className={className} style={style} {...rest}>{html}</T>
  }
  if (inline) return <span className={className} style={style} {...rest} dangerouslySetInnerHTML={{ __html: toInlineHtml(html) }}/>
  const single = unwrapSingleParagraph(html)
  if (single !== null) return <Tag className={className} style={style} {...rest} dangerouslySetInnerHTML={{ __html: single }}/>
  return <div className={['rich-text', className].filter(Boolean).join(' ')} style={style} {...rest} dangerouslySetInnerHTML={{ __html: html }}/>
}

export default function EditableField({ src, html, plain = false, as = 'p', inline = false, simple = false, className, style, label }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(html ?? '')
  const [saving, setSaving] = useState(false)
  // Valeur affichée (mise à jour tout de suite après l'enregistrement, avant le rafraîchissement serveur)
  const [shown, setShown] = useState(html ?? '')
  const [prevHtml, setPrevHtml] = useState(html ?? '')
  const [version, setVersion] = useState(0)
  if ((html ?? '') !== prevHtml) { setPrevHtml(html ?? ''); setShown(html ?? '') }
  const [, startTransition] = useTransition()
  const plainRef = useRef(null)
  const cancelledRef = useRef(false)
  const cls = ['editable', className].filter(Boolean).join(' ')
  const title = label ? `Modifier : ${label}` : 'Cliquer pour modifier'

  const save = async (value) => {
    if (value === shown) { setEditing(false); setVersion(v => v + 1); return }
    setSaving(true)
    try {
      await saveEditable(supabase, src, value)
      notify('Modification enregistrée')
      setShown(value)
      setEditing(false)
      setVersion(v => v + 1)
      startTransition(() => router.refresh())
    } catch (e) {
      notify(e.message, 'error')
    }
    setSaving(false)
  }

  const start = (e) => {
    // Empêche les liens parents (cartes cliquables…) de naviguer en mode édition
    e.preventDefault()
    e.stopPropagation()
    if (editing) return
    setDraft(shown)
    cancelledRef.current = false
    setEditing(true)
    if (plain) {
      requestAnimationFrame(() => {
        const el = plainRef.current
        if (!el) return
        el.focus()
        const range = document.createRange()
        range.selectNodeContents(el)
        range.collapse(false)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      })
    }
  }

  // ── Texte simple : édition directe dans l'élément ──
  if (plain) {
    return (
      <span
        key={version}
        ref={plainRef}
        className={`${cls}${editing ? ' is-editing' : ''}${saving ? ' is-saving' : ''}`}
        style={style}
        title={editing ? 'Entrée pour enregistrer · Échap pour annuler' : title}
        contentEditable={editing ? 'plaintext-only' : false}
        suppressContentEditableWarning
        onClick={start}
        onKeyDown={e => {
          if (!editing) return
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
          if (e.key === 'Escape') { cancelledRef.current = true; setEditing(false); setVersion(v => v + 1) }
        }}
        onBlur={e => { if (editing && !saving && !cancelledRef.current) save(e.currentTarget.textContent.trim()) }}
      >
        {shown || (editing ? '' : <span className="editable-placeholder">{PLACEHOLDER}</span>)}
      </span>
    )
  }

  // ── Texte riche : éditeur WYSIWYG à la place du contenu ──
  if (editing) {
    return (
      <div className="editable-panel" onClick={e => e.stopPropagation()}>
        <div className={className} style={style}>
          <RichTextEditor value={draft} onChange={setDraft} simple={simple || inline} inherit autoFocus minHeight={40}/>
        </div>
        <div className="editable-actions">
          {label && <span className="editable-actions-label">{label}</span>}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} disabled={saving}>Annuler</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => save(draft)} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    )
  }

  return <RichDisplay html={shown} as={as} inline={inline} className={cls} style={style} onClick={start} title={title}/>
}
