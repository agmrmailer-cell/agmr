'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'
import ImageUpload from '@/components/ui/ImageUpload'
import { createClient } from '@/lib/supabase-client'
import { logActivity } from '@/lib/activity'
import { formatDateFR, catLabel } from '@/utils/format'
import HelpTip from '@/components/ui/HelpTip'

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={14}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default function AdminActuSection() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const supabase = createClient()

  const load = async () => {
    const { data, error } = await supabase
      .from('actualites')
      .select('*')
      .order('date', { ascending: false })
    if (!error) setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async (item) => {
    const payload = {
      cat:       item.cat,
      date:      item.date,
      title:     item.title,
      excerpt:   item.excerpt,
      image_url: item.image_url || null,
    }
    if (item.id) {
      await supabase.from('actualites').update(payload).eq('id', item.id)
      await logActivity(supabase, { message: `Article modifié — ${item.title}`, section: 'actu', action: 'update' })
    } else {
      await supabase.from('actualites').insert(payload)
      await logActivity(supabase, { message: `Nouvel article publié — ${item.title}`, section: 'actu', action: 'create' })
    }
    setEditing(null)
    load()
  }

  const del = async (id) => {
    if (!confirm("Supprimer cet article ?")) return
    const article = items.find(i => i.id === id)
    await supabase.from('actualites').delete().eq('id', id)
    await logActivity(supabase, { message: `Article supprimé — ${article?.title ?? ''}`, section: 'actu', action: 'delete' })
    load()
  }

  const blank = { cat: "asso", date: new Date().toISOString().slice(0,10), title: "", excerpt: "", image_url: null }

  if (loading) return <div style={{ padding: 40, color: "var(--ink-mute)" }}>Chargement...</div>

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Actualités <HelpTip text="Gérez ici les articles qui apparaissent dans la section Actualités du site. Vous pouvez créer, modifier ou supprimer des articles. Chaque article est visible immédiatement sur le site après enregistrement." position="right" /></h1>
          <p className="muted" style={{ margin: 0 }}>{items.length} articles — <strong style={{ color: "var(--green)" }}>données Supabase</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(blank)}>
          <Icon name="plus" size={16}/> Nouvel article <HelpTip text="Ouvre le formulaire pour rédiger un nouvel article. Renseignez la catégorie, la date, le titre et le contenu. Vous pouvez aussi ajouter une photo d'illustration." position="bottom" />
        </button>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th style={{ width: 48 }}></th>
            <th>Date</th>
            <th>Catégorie</th>
            <th>Titre</th>
            <th>Extrait</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map(n => (
            <tr key={n.id}>
              {/* Vignette */}
              <td style={{ padding: '8px 12px' }}>
                {n.image_url
                  ? <img src={n.image_url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, display: 'block' }}/>
                  : <div style={{ width: 40, height: 40, borderRadius: 4, background: 'var(--bg-deep)', display: 'grid', placeItems: 'center', fontSize: '1rem' }}>📰</div>
                }
              </td>
              <td style={{ whiteSpace: "nowrap" }}>{formatDateFR(n.date)}</td>
              <td><span className={`news-cat news-cat-${n.cat}`}>{catLabel(n.cat)}</span></td>
              <td><strong>{n.title}</strong></td>
              <td className="muted" style={{ fontSize: "0.88rem", maxWidth: 240 }}>{n.excerpt?.slice(0, 60)}…</td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="icon-btn" onClick={() => setEditing(n)}><Icon name="edit" size={14}/></button>
                <button className="icon-btn" onClick={() => del(n.id)} style={{ marginLeft: 4 }}><Icon name="trash" size={14}/></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <Modal title={editing.id ? "Modifier l'article" : "Nouvel article"} onClose={() => setEditing(null)}>
          <div className="form">
            <div className="row-2">
              <div className="field">
                <label>Catégorie <HelpTip text="Choisissez le thème principal de l'article. Il sera affiché sous forme de badge coloré à côté du titre sur le site." position="right" /></label>
                <select value={editing.cat} onChange={e => setEditing({ ...editing, cat: e.target.value })}>
                  {["gym","rando","nordique","asso","event"].map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Date <HelpTip text="La date de publication de l'article. Les articles sont triés du plus récent au plus ancien sur le site." position="top" /></label>
                <input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })}/>
              </div>
            </div>
            <div className="field">
              <label>Titre <HelpTip text="Le titre apparaît en gras sur la liste des actualités et sur la page de l'article. Soyez clair et accrocheur." position="right" /></label>
              <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}/>
            </div>
            <div className="field">
              <label>Contenu <HelpTip text="Le texte de l'article. Rédigez ici l'intégralité du contenu que les visiteurs liront. Pas de mise en forme spéciale, juste du texte." position="right" /></label>
              <textarea rows={5} value={editing.excerpt} onChange={e => setEditing({ ...editing, excerpt: e.target.value })}/>
            </div>
            <ImageUpload
              label="Image d'illustration — format 16:9 (bloc principal de la home)"
              value={editing.image_url}
              onChange={url => setEditing({ ...editing, image_url: url })}
              folder="actualites"
              height={160}
              defaultAspect={16 / 9}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Annuler</button>
              <button className="btn btn-primary" disabled={!editing.title} onClick={() => save(editing)}>Publier</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
