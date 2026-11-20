'use client'
import { logActivity } from './activity'

function setPath(obj, path, value) {
  const keys = path.split('.')
  const root = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) }
  let cur = root
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    const next = cur[k]
    cur[k] = Array.isArray(next) ? [...next] : { ...(next ?? {}) }
    cur = cur[k]
  }
  cur[keys[keys.length - 1]] = value
  return root
}

// Enregistre une valeur éditée sur le site, selon son descripteur (voir editable-src.js)
export async function saveEditable(supabase, src, value) {
  let error = null

  if (src.kind === 'text') {
    ({ error } = await supabase
      .from('site_texts')
      .upsert({ key: src.key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' }))
  } else if (src.kind === 'block') {
    const { data, error: readError } = await supabase
      .from(src.table)
      .select('id, content')
      .eq('block_key', src.blockKey)
      .maybeSingle()
    if (readError) error = readError
    else if (!data) error = { message: "Ce bloc n'existe pas encore en base : enregistrez-le une première fois depuis l'admin." }
    else {
      const content = setPath(data.content ?? {}, src.field, value)
      ;({ error } = await supabase.from(src.table).update({ content }).eq('id', data.id))
    }
  } else if (src.kind === 'row') {
    ({ error } = await supabase.from(src.table).update({ [src.field]: value }).eq('id', src.id))
  } else {
    error = { message: 'Emplacement inconnu' }
  }

  if (error) throw new Error(error.message)

  const where = src.kind === 'text' ? src.key : src.kind === 'block' ? `${src.table} / ${src.blockKey} / ${src.field}` : `${src.table} / ${src.field}`
  await logActivity(supabase, { message: `Édition visuelle - ${where}`, section: 'edition-visuelle', action: 'update' })
}
