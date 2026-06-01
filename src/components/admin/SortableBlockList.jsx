'use client'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Item draggable ────────────────────────────────────────────
export function SortableBlockItem({ id, children }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity:   isDragging ? 0.5 : 1,
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.18)' : 'none',
        borderRadius: 'var(--r-md)',
        position: 'relative',
        zIndex: isDragging ? 10 : 'auto',
      }}
    >
      {/* Poignée de déplacement */}
      <div
        {...attributes}
        {...listeners}
        title="Glisser pour réordonner"
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 32, cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isDragging ? 'var(--green)' : 'var(--ink-mute)',
          borderRadius: 'var(--r-md) 0 0 var(--r-md)',
          transition: 'color .15s',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
          <circle cx="4" cy="4"  r="1.5"/>
          <circle cx="4" cy="10" r="1.5"/>
          <circle cx="4" cy="16" r="1.5"/>
          <circle cx="10" cy="4"  r="1.5"/>
          <circle cx="10" cy="10" r="1.5"/>
          <circle cx="10" cy="16" r="1.5"/>
        </svg>
      </div>
      {/* Contenu du bloc avec padding-left pour la poignée */}
      <div style={{ paddingLeft: 32 }}>
        {children}
      </div>
    </div>
  )
}

// ── Liste sortable ────────────────────────────────────────────
export default function SortableBlockList({ blocks, onReorder, renderBlock }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex(b => b.id === active.id)
    const newIndex = blocks.findIndex(b => b.id === over.id)
    const newBlocks = arrayMove(blocks, oldIndex, newIndex)
    onReorder(newBlocks)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {blocks.map((block, idx) => (
            <SortableBlockItem key={block.id} id={block.id}>
              {renderBlock(block, idx, blocks.length)}
            </SortableBlockItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
