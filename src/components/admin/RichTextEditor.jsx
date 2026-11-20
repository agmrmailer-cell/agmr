'use client'
import { useEffect, useRef } from 'react'
import { useEditor, useEditorState, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { plainTextToHtml } from '@/lib/rich-text'

const BUTTONS = [
  { key: 'bold',        label: 'G',   title: 'Gras (Ctrl+B)',        style: { fontWeight: 800 },              run: c => c.toggleBold() },
  { key: 'italic',      label: 'I',   title: 'Italique (Ctrl+I)',    style: { fontStyle: 'italic' },          run: c => c.toggleItalic() },
  { key: 'underline',   label: 'S',   title: 'Souligné (Ctrl+U)',    style: { textDecoration: 'underline' },  run: c => c.toggleUnderline() },
  { key: 'strike',      label: 'B',   title: 'Barré',                style: { textDecoration: 'line-through' }, run: c => c.toggleStrike() },
  { sep: true },
  { key: 'h2',          label: 'T1',  title: 'Titre',                active: e => e.isActive('heading', { level: 2 }), run: c => c.toggleHeading({ level: 2 }) },
  { key: 'h3',          label: 'T2',  title: 'Sous-titre',           active: e => e.isActive('heading', { level: 3 }), run: c => c.toggleHeading({ level: 3 }) },
  { sep: true },
  { key: 'bulletList',  label: '•',   title: 'Liste à puces',        run: c => c.toggleBulletList() },
  { key: 'orderedList', label: '1.',  title: 'Liste numérotée',      run: c => c.toggleOrderedList() },
  { key: 'blockquote',  label: '“',   title: 'Citation',             run: c => c.toggleBlockquote() },
  { sep: true },
  { key: 'link',        label: '🔗',  title: 'Lien',                 custom: 'link' },
  { key: 'clear',       label: '⌫',   title: 'Effacer la mise en forme', run: c => c.unsetAllMarks().clearNodes(), noActive: true },
  { sep: true },
  { key: 'undo',        label: '↶',   title: 'Annuler (Ctrl+Z)',     run: c => c.undo(), noActive: true },
  { key: 'redo',        label: '↷',   title: 'Rétablir (Ctrl+Y)',    run: c => c.redo(), noActive: true },
]

const SIMPLE_KEYS = new Set(['bold', 'italic', 'underline', 'link', 'clear', 'undo', 'redo'])

// `simple` : barre d'outils réduite (gras, italique, souligné, lien) pour les textes courts
// `inherit` : reprend la typographie du site (édition visuelle sur la page)
export default function RichTextEditor({ value, onChange, onBlur, minHeight = 120, simple = false, inherit = false, autoFocus = false }) {
  // Les callbacks changent à chaque rendu : on garde toujours la dernière version
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)
  useEffect(() => { onChangeRef.current = onChange; onBlurRef.current = onBlur })
  const lastValue = useRef(value ?? '')

  const buttons = simple
    ? BUTTONS.filter((b, i, arr) => b.sep ? (arr[i - 1] && SIMPLE_KEYS.has(arr[i - 1].key)) : SIMPLE_KEYS.has(b.key))
    : BUTTONS

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
    ],
    content: plainTextToHtml(value ?? ''),
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: { class: inherit ? 'rte-content rte-inherit' : 'rte-content' },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML()
      lastValue.current = html
      onChangeRef.current?.(html)
    },
    onBlur: () => { onBlurRef.current?.() },
  })

  // Valeur modifiée de l'extérieur (réinitialisation, suppression d'un élément de liste…)
  useEffect(() => {
    if (!editor || (value ?? '') === lastValue.current) return
    lastValue.current = value ?? ''
    editor.commands.setContent(plainTextToHtml(value ?? ''), { emitUpdate: false })
  }, [editor, value])

  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return {}
      const s = {}
      for (const b of BUTTONS) {
        if (b.sep || b.noActive) continue
        s[b.key] = b.active ? b.active(editor) : editor.isActive(b.key)
      }
      s.canUndo = editor.can().undo()
      s.canRedo = editor.can().redo()
      return s
    },
  }) ?? {}

  const setLink = () => {
    if (!editor) return
    const previous = editor.getAttributes('link').href ?? ''
    const url = window.prompt('Adresse du lien (laisser vide pour retirer le lien)', previous || 'https://')
    if (url === null) return
    const chain = editor.chain().focus().extendMarkRange('link')
    if (url.trim() === '' || url.trim() === 'https://') chain.unsetLink().run()
    else chain.setLink({ href: url.trim() }).run()
  }

  return (
    <div className={inherit ? 'rte rte-inline' : 'rte'}>
      <div className="rte-toolbar" role="toolbar" aria-label="Mise en forme">
        {buttons.map((b, i) => b.sep
          ? <span key={`sep-${i}`} className="rte-sep"/>
          : (
            <button
              key={b.key}
              type="button"
              title={b.title}
              aria-label={b.title}
              aria-pressed={!!state[b.key]}
              className={`rte-btn${state[b.key] ? ' is-active' : ''}`}
              style={b.style}
              disabled={!editor || (b.key === 'undo' && !state.canUndo) || (b.key === 'redo' && !state.canRedo)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => {
                if (!editor) return
                if (b.custom === 'link') return setLink()
                b.run(editor.chain().focus()).run()
              }}
            >
              {b.label}
            </button>
          ))}
      </div>
      <EditorContent editor={editor} style={{ '--rte-min-height': `${minHeight}px` }}/>
    </div>
  )
}
