'use client'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { genericType } from '@/lib/generic-blocks'

// Champs de formulaire des blocs génériques (texte libre, citation, appel à l'action, encadré),
// communs à toutes les pages. `c` : contenu du bloc, `u(champ, valeur)` : mise à jour.
export default function GenericBlockFields({ blockKey, c, u }) {
  const type = genericType(blockKey)
  if (!type) return null

  return (
    <>
      {type === 'texte' && <>
        <div className="field"><label>Titre</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
        </div>
        <div className="field"><label>Texte</label>
          <RichTextEditor value={c.texte ?? ''} onChange={v => u('texte', v)} minHeight={140}/>
        </div>
      </>}
      {type === 'citation' && <>
        <div className="field"><label>Citation</label>
          <RichTextEditor simple value={c.citation ?? ''} onChange={v => u('citation', v)} minHeight={70}/>
        </div>
        <div className="field"><label>Auteur</label>
          <input value={c.auteur ?? ''} onChange={e => u('auteur', e.target.value)}/>
        </div>
        <div className="field"><label>Rôle</label>
          <input value={c.role ?? ''} onChange={e => u('role', e.target.value)}/>
        </div>
      </>}
      {type === 'cta' && <>
        <div className="field"><label>Titre</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
        </div>
        <div className="field"><label>Texte</label>
          <RichTextEditor value={c.texte ?? ''} onChange={v => u('texte', v)} minHeight={84}/>
        </div>
        <div className="field"><label>Texte du bouton</label>
          <input value={c.bouton ?? ''} onChange={e => u('bouton', e.target.value)} placeholder="En savoir plus"/>
        </div>
        <div className="field"><label>Lien du bouton</label>
          <input value={c.lien ?? ''} onChange={e => u('lien', e.target.value)} placeholder="/planning/randonnee"/>
        </div>
      </>}
      {type === 'alerte' && <>
        <div className="field"><label>Titre (optionnel)</label>
          <input value={c.titre ?? ''} onChange={e => u('titre', e.target.value)}/>
        </div>
        <div className="field"><label>Texte</label>
          <RichTextEditor value={c.texte ?? ''} onChange={v => u('texte', v)} minHeight={112}/>
        </div>
      </>}
    </>
  )
}
