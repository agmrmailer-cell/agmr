import { getEditMode } from '@/lib/edit-mode'
import ImageEditButtonClient from './ImageEditButtonClient'
import { canEditSrc } from '@/lib/permissions'

// À placer DANS le conteneur d'une image (fond CSS ou <img>) : en mode édition, affiche
// « Changer l'image » par-dessus. Pour les visiteurs : ne rend rien.
export default async function ImageEditButton({ src, value, aspect, folder, position, removable }) {
  if (!src || !canEditSrc(await getEditMode(), src)) return null
  return <ImageEditButtonClient src={src} hasImage={!!value} aspect={aspect} folder={folder} position={position} removable={removable}/>
}
