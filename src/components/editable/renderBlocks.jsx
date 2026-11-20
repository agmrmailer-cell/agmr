import BlockControls from './BlockControls'

// Rend une liste de blocs de page. Pour les visiteurs : identique à blocks.map(render).
// En mode édition : les blocs masqués sont aussi affichés (grisés) et chaque bloc reçoit
// une barre d'outils (monter, descendre, masquer/afficher, supprimer).
//
// opts : { table, editMode, movable = true, deletable = true, frame = key => true }
export function renderBlocks(opts, blocks, render) {
  const { table, editMode, movable = true, deletable = true, frame = () => true } = opts
  if (!editMode) return blocks.map(render)

  const rendered = blocks
    .map(b => ({ b, el: render({ ...b, visible: true }) }))
    .filter(x => x.el)
  const full = blocks.map(b => ({ id: b.id ?? null, key: b.block_key }))
  const seq = rendered.filter(x => frame(x.b.block_key)).map(x => x.b.block_key)

  return rendered.map(({ b, el }) => frame(b.block_key)
    ? (
      <BlockControls
        key={`frame-${b.block_key}`}
        table={table}
        id={b.id ?? null}
        blockKey={b.block_key}
        label={b.label}
        visible={b.visible !== false}
        full={full}
        seq={seq}
        movable={movable}
        deletable={deletable}
      >
        {el}
      </BlockControls>
    )
    : el)
}
