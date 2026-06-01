'use client'
import { useState, useEffect } from 'react'

const SIZES   = [15, 16, 17, 18, 19, 20, 22]   // px — 18 est la valeur par défaut
const DEFAULT = 18
const KEY     = 'agmr_font_size'

function applySize(px) {
  document.documentElement.style.setProperty('--base-size', `${px}px`)
}

export default function FontSizeWidget() {
  const [size, setSize] = useState(DEFAULT)
  const [open, setOpen] = useState(false)

  // Restaurer la taille sauvegardée au montage
  useEffect(() => {
    try {
      const saved = parseInt(localStorage.getItem(KEY), 10)
      if (saved && SIZES.includes(saved)) {
        setSize(saved)
        applySize(saved)
      }
    } catch {}
  }, [])

  const change = (delta) => {
    const idx     = SIZES.indexOf(size)
    const nextIdx = Math.max(0, Math.min(SIZES.length - 1, idx + delta))
    const next    = SIZES[nextIdx]
    setSize(next)
    applySize(next)
    try { localStorage.setItem(KEY, String(next)) } catch {}
  }

  const reset = () => {
    setSize(DEFAULT)
    applySize(DEFAULT)
    try { localStorage.setItem(KEY, String(DEFAULT)) } catch {}
  }

  const idx       = SIZES.indexOf(size)
  const canDown   = idx > 0
  const canUp     = idx < SIZES.length - 1
  const isDefault = size === DEFAULT

  return (
    <div
      style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Panneau étendu */}
      {open && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          background: '#fff', border: '1px solid var(--line)',
          borderRadius: 99, padding: '5px 8px',
          boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
        }}>
          <button
            onClick={() => change(-1)}
            disabled={!canDown}
            title="Réduire la taille du texte"
            style={btnStyle(canDown)}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--sans)' }}>A</span>
            <span style={{ fontSize: '0.55rem', lineHeight: 1, marginTop: 1 }}>−</span>
          </button>

          {!isDefault && (
            <button onClick={reset} title="Taille par défaut" style={{ ...btnStyle(true), padding: '5px 10px', fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--sans)' }}>
              ↺
            </button>
          )}

          <button
            onClick={() => change(+1)}
            disabled={!canUp}
            title="Agrandir la taille du texte"
            style={btnStyle(canUp)}
          >
            <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--sans)' }}>A</span>
            <span style={{ fontSize: '0.65rem', lineHeight: 1, marginTop: 1 }}>+</span>
          </button>
        </div>
      )}

      {/* Bouton déclencheur */}
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setOpen(true)}
        title="Taille du texte"
        aria-label="Modifier la taille du texte"
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: open ? 'var(--green)' : '#fff',
          border: '1px solid var(--line)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          cursor: 'pointer', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: open ? '#fff' : 'var(--ink)',
          transition: 'all .2s', gap: 0, padding: 0,
          ...(size !== DEFAULT ? { borderColor: 'var(--green)', boxShadow: '0 0 0 2px var(--green-soft)' } : {}),
        }}
      >
        <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--sans)', lineHeight: 1 }}>A</span>
        <span style={{ fontSize: '0.45rem', lineHeight: 1 }}>▲▼</span>
      </button>
    </div>
  )
}

function btnStyle(enabled) {
  return {
    background: 'none', border: 'none', cursor: enabled ? 'pointer' : 'not-allowed',
    opacity: enabled ? 1 : 0.35, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '5px 8px',
    color: 'var(--ink)', borderRadius: 6, transition: 'background .15s', lineHeight: 1,
    gap: 0,
  }
}
