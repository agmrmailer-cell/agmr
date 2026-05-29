'use client'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Icon from '@/components/ui/Icon'
import { monthFR, monthFRFull } from '@/utils/format'

const DAYS    = ["lundi","mardi","mercredi","jeudi","vendredi","samedi"]
const HOUR_PX = 64
const START_H = 8
const END_H   = 21
const HOURS   = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
const GRID_H  = (END_H - START_H) * HOUR_PX
const TIME_W  = 52   // px

function toMin(t)        { const [h, m] = t.split(':').map(Number); return h * 60 + m }
function slotTop(s)      { return (toMin(s) - START_H * 60) * (HOUR_PX / 60) }
function slotHeight(s,e) { return (toMin(e) - toMin(s)) * (HOUR_PX / 60) }

// ── Recurrence helpers ─────────────────────────────────────────
const DAY_IDX = { lundi:0, mardi:1, mercredi:2, jeudi:3, vendredi:4, samedi:5 }

function getMonday(date) {
  const d = new Date(date); const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); d.setHours(0,0,0,0); return d
}
function getDayInWeek(monday, jourFR) {
  const d = new Date(monday); d.setDate(d.getDate() + (DAY_IDX[jourFR] ?? 0)); return d
}
function nthWeekdayOfMonth(date) { return Math.ceil(date.getDate() / 7) }
function isLastWeekdayOfMonth(date) {
  const next = new Date(date); next.setDate(next.getDate() + 7)
  return next.getMonth() !== date.getMonth()
}

function isActiveForWeek(course, monday) {
  const rec = course.recurrence ?? { type: 'weekly' }
  switch (rec.type) {
    case 'biweekly': {
      if (!rec.refDate) return true
      const ref  = getMonday(new Date(rec.refDate))
      const diff = Math.round((monday - ref) / (7 * 864e5))
      return diff % 2 === 0
    }
    case 'monthly_nth': {
      const d = getDayInWeek(monday, course.jour)
      return nthWeekdayOfMonth(d) === rec.weekOfMonth
    }
    case 'monthly_last': {
      return isLastWeekdayOfMonth(getDayInWeek(monday, course.jour))
    }
    case 'custom': {
      if (!rec.refDate || !rec.interval) return true
      const ref  = getMonday(new Date(rec.refDate))
      const diff = Math.round((monday - ref) / (7 * 864e5))
      return diff % rec.interval === 0
    }
    default: return true   // 'weekly'
  }
}

function recurrenceLabel(rec, jour) {
  if (!rec || rec.type === 'weekly') return null
  const ORD = ['1er','2e','3e','4e']
  switch (rec.type) {
    case 'biweekly':     return '1 semaine sur 2'
    case 'monthly_nth':  return `${ORD[rec.weekOfMonth - 1] ?? rec.weekOfMonth + 'e'} ${jour} du mois`
    case 'monthly_last': return `Dernier ${jour} du mois`
    case 'custom':       return `1 semaine sur ${rec.interval}`
    default: return null
  }
}

// ── Vacation helpers ───────────────────────────────────────────
function getVacationForDay(date, vacances) {
  // Noon local time avoids timezone edge cases
  const d = new Date(date); d.setHours(12, 0, 0, 0)
  return vacances.find(v => {
    const s = new Date(v.dateDebut + 'T00:00:00')
    const e = new Date(v.dateFin   + 'T23:59:59')
    return d >= s && d <= e
  }) ?? null
}

function recurrenceBadge(rec) {
  if (!rec || rec.type === 'weekly') return null
  switch (rec.type) {
    case 'biweekly':     return '½'
    case 'monthly_nth':  return `M${rec.weekOfMonth}`
    case 'monthly_last': return 'ML'
    case 'custom':       return `1/${rec.interval}`
    default: return null
  }
}

/**
 * Greedy column-packing: assigns each slot a _col index and _numCols total
 * so overlapping events are laid out side-by-side instead of stacked.
 */
function layoutSlots(slots) {
  if (!slots.length) return []
  const sorted = [...slots].sort((a, b) => toMin(a.heureDebut) - toMin(b.heureDebut))
  const colEnds = []  // colEnds[i] = minute when column i is free

  const placed = sorted.map(s => {
    const start = toMin(s.heureDebut)
    const end   = toMin(s.heureFin)
    let col = colEnds.findIndex(e => e <= start)
    if (col === -1) { col = colEnds.length; colEnds.push(end) }
    else            { colEnds[col] = end }
    return { ...s, _col: col }
  })

  // _numCols = max column index among concurrent events + 1
  return placed.map(s => {
    const start = toMin(s.heureDebut)
    const end   = toMin(s.heureFin)
    const maxCol = placed.reduce((m, o) => {
      if (toMin(o.heureDebut) < end && toMin(o.heureFin) > start) return Math.max(m, o._col)
      return m
    }, 0)
    return { ...s, _numCols: maxCol + 1 }
  })
}

// ── PDF export ─────────────────────────────────────────────────
function exportPDF(courses, weekLabel) {
  const byDay = DAYS.map(day => ({
    day,
    slots: courses.filter(c => c.jour === day).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
  }))
  const rows = byDay.flatMap(({ day, slots }) =>
    slots.map(s => `<tr><td class="cap">${day}</td><td>${s.heureDebut} – ${s.heureFin}</td><td>${s.discipline}${s.complet ? ' [COMPLET]' : ''}</td><td>${s.animateur}</td><td>${s.salle}</td></tr>`)
  ).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Planning Gym — AGMR</title>
<style>
  body{font-family:Georgia,serif;padding:32px;color:#1a1a1a}
  h1{font-size:1.5rem;margin:0 0 4px}
  .sub{font-family:Arial,sans-serif;font-size:0.78rem;color:#666;margin-bottom:24px}
  table{width:100%;border-collapse:collapse}
  th{background:#1e3528;color:#fff;padding:9px 14px;text-align:left;font-family:Arial,sans-serif;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.1em}
  td{padding:9px 14px;border-bottom:1px solid #e8e4dc;font-size:0.88rem}
  tr:nth-child(even) td{background:#f9f7f3}
  .cap{text-transform:capitalize}
</style></head><body>
<h1>Planning Gym — AGMR</h1>
<div class="sub">Semaine du ${weekLabel} · Exporté le ${new Date().toLocaleDateString('fr-FR')}</div>
<table>
<thead><tr><th>Jour</th><th>Horaire</th><th>Discipline</th><th>Animateur</th><th>Salle</th></tr></thead>
<tbody>${rows}</tbody>
</table></body></html>`
  const w = window.open('', '_blank', 'width=920,height=680')
  w.document.write(html); w.document.close(); w.print()
}

// ── Discipline dropdown ────────────────────────────────────────
function DiscDropdown({ disciplines, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const toggle = (d) => { const n = new Set(selected); n.has(d) ? n.delete(d) : n.add(d); onChange(n) }
  const allSel = selected.size === 0
  const label  = allSel ? 'Toutes les disciplines' : selected.size === 1 ? [...selected][0] : `${selected.size} disciplines`
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 200, justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="filter" size={14}/>{label}
        </span>
        {!allSel && <span style={{ background: "var(--accent)", color: "#fff", borderRadius: "99px", fontSize: "0.72rem", padding: "1px 7px", fontWeight: 700 }}>{selected.size}</span>}
        <Icon name={open ? "chevronUp" : "chevronDown"} size={12}/>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50, background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", boxShadow: "var(--sh-md)", minWidth: 240, padding: "8px 0" }}>
          <button onClick={() => onChange(new Set())}
            style={{ width: "100%", padding: "8px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.88rem", color: allSel ? "var(--accent)" : "var(--ink-mute)", fontWeight: allSel ? 600 : 400, borderBottom: "1px solid var(--line-soft)", marginBottom: 4 }}>
            Toutes les disciplines
          </button>
          {disciplines.map(d => (
            <label key={d}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 16px", cursor: "pointer", fontSize: "0.92rem", color: "var(--ink-soft)" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elev)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <input type="checkbox" checked={selected.has(d)} onChange={() => toggle(d)}
                style={{ accentColor: "var(--accent)", width: 15, height: 15, cursor: "pointer" }}/>
              {d}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Fullscreen landscape helper ────────────────────────────────
function usePlanningFullscreen() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(async () => {
    setIsOpen(true)
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
      if (screen.orientation?.lock) {
        await screen.orientation.lock('landscape').catch(() => {})
      }
    } catch {}
    document.body.style.overflow = 'hidden'
  }, [])

  const close = useCallback(async () => {
    setIsOpen(false)
    document.body.style.overflow = ''
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      if (screen.orientation?.unlock) screen.orientation.unlock()
    } catch {}
  }, [])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  return { isOpen, open, close }
}

// ── Main ───────────────────────────────────────────────────────
export default function PlanningGymClient({ courses, vacances = [] }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selected, setSelected]     = useState(new Set())
  const [clickedId, setClickedId]   = useState(null)
  const fullscreen = usePlanningFullscreen()

  const monday = useMemo(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1 - day) + weekOffset * 7
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }, [weekOffset])

  const weekLabel = useMemo(() => {
    const end = new Date(monday)
    end.setDate(end.getDate() + 5)
    return `${monday.getDate()} ${monthFRFull(monday.getMonth())} — ${end.getDate()} ${monthFRFull(end.getMonth())} ${end.getFullYear()}`
  }, [monday])

  const todayStr    = useMemo(() => new Date().toDateString(), [])
  // Only disciplines that actually exist in the data
  const disciplines = useMemo(() => [...new Set(courses.map(c => c.discipline))].sort(), [courses])
  const visible     = useMemo(() => {
    const base = selected.size === 0 ? courses : courses.filter(c => selected.has(c.discipline))
    return base.filter(c => isActiveForWeek(c, monday))
  }, [courses, selected, monday])

  // Precompute layout per day (side-by-side overlap resolution)
  const laidByDay = useMemo(() => {
    const out = {}
    DAYS.forEach(day => { out[day] = layoutSlots(visible.filter(c => c.jour === day)) })
    return out
  }, [visible])

  // ── Shared grid content (toolbar + grid + info) ──────────────
  const planningContent = (isFullscreen = false) => (
    <>
      {/* ── Toolbar ── */}
      <div className="planning-toolbar" style={isFullscreen ? { marginBottom: 12 } : undefined}>
          <div className="week-nav">
            <button className="icon-btn" onClick={() => setWeekOffset(weekOffset - 1)}><Icon name="chevronLeft" size={16}/></button>
            <button className="icon-btn" onClick={() => setWeekOffset(weekOffset + 1)}><Icon name="chevronRight" size={16}/></button>
          </div>
          <div className="planning-week">Semaine du {weekLabel}</div>
          {weekOffset !== 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)}>Aujourd'hui</button>
          )}
          <DiscDropdown disciplines={disciplines} selected={selected} onChange={setSelected}/>
          <button className="btn btn-ghost btn-sm" onClick={() => exportPDF(visible, weekLabel)}>
            <Icon name="download" size={14}/> PDF
          </button>
        </div>

        {/* ── Bannière vacances si la semaine est concernée ── */}
        {(() => {
          const vacNames = [...new Set(
            DAYS.map((_, di) => {
              const d = new Date(monday); d.setDate(d.getDate() + di)
              return getVacationForDay(d, vacances)?.nom
            }).filter(Boolean)
          )]
          return vacNames.length > 0 ? (
            <div style={{ margin: '12px 0 0', padding: '10px 16px', background: '#fef9ec', border: '1px solid #f0d060', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: '#7a6010' }}>
              <span style={{ fontSize: '1rem' }}>🏖️</span>
              <span><strong>Vacances scolaires</strong> — {vacNames.join(' · ')} · Pas de cours cette semaine.</span>
            </div>
          ) : null
        })()}

        {/* ── Calendar grid ── */}
        <div className="planning-time-grid" style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--bg-card)', marginTop: 20 }}>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: `${TIME_W}px repeat(6, 1fr)`, borderBottom: '2px solid var(--line)', background: 'var(--bg-deep)' }}>
            <div/>
            {DAYS.map((day, di) => {
              const date = new Date(monday)
              date.setDate(date.getDate() + di)
              const isToday   = date.toDateString() === todayStr
              const vacation  = getVacationForDay(date, vacances)
              return (
                <div key={day} style={{ padding: '10px 6px', textAlign: 'center', borderLeft: '1px solid var(--line)', background: vacation ? 'rgba(0,0,0,0.03)' : 'transparent' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: vacation ? 'var(--ink-mute)' : isToday ? 'var(--accent)' : 'var(--ink-mute)', fontWeight: 600, marginBottom: 4, opacity: vacation ? 0.5 : 1 }}>
                    {day}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: vacation ? 'transparent' : isToday ? 'var(--accent)' : 'transparent', color: vacation ? 'var(--ink-mute)' : isToday ? '#fff' : 'var(--ink)', fontSize: '0.9rem', fontWeight: isToday ? 700 : 400, opacity: vacation ? 0.45 : 1 }}>
                    {date.getDate()}
                  </div>
                  {vacation && (
                    <div style={{ fontSize: '0.58rem', marginTop: 4, color: '#8a7020', background: '#fef9ec', borderRadius: 3, padding: '1px 4px', display: 'inline-block' }}>
                      vacances
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Scrollable body */}
          <div style={{ display: 'flex', overflowY: 'auto', maxHeight: 680 }}>

            {/* Time labels */}
            <div style={{ width: TIME_W, flexShrink: 0, borderRight: '1px solid var(--line)', background: 'var(--bg-deep)' }}>
              {HOURS.map((h, i) => (
                <div key={h} style={{ height: HOUR_PX, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 10 }}>
                  <span style={{ fontSize: '0.66rem', color: 'var(--ink-mute)', marginTop: i === 0 ? 4 : -8, fontVariantNumeric: 'tabular-nums' }}>
                    {h}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns + hour lines */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', position: 'relative' }}>

              {/* Hour lines */}
              {HOURS.map((_, i) => (
                <div key={`hl-${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * HOUR_PX, borderTop: `1px solid rgba(0,0,0,${i === 0 ? 0.12 : 0.06})`, zIndex: 1, pointerEvents: 'none' }}/>
              ))}
              {/* Half-hour lines */}
              {HOURS.map((_, i) => (
                <div key={`hh-${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * HOUR_PX + HOUR_PX / 2, borderTop: '1px dashed rgba(0,0,0,0.04)', zIndex: 1, pointerEvents: 'none' }}/>
              ))}

              {/* Day columns */}
              {DAYS.map((day, di) => {
                const date    = new Date(monday)
                date.setDate(date.getDate() + di)
                const isToday  = date.toDateString() === todayStr
                const vacation = getVacationForDay(date, vacances)
                const laid     = vacation ? [] : (laidByDay[day] ?? [])

                return (
                  <div key={day}
                    onClick={() => setClickedId(null)}
                    style={{
                      position: 'relative',
                      height: GRID_H,
                      borderLeft: di > 0 ? '1px solid var(--line)' : 'none',
                      background: vacation
                        ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.018) 8px, rgba(0,0,0,0.018) 16px)'
                        : isToday ? 'rgba(52,90,60,0.025)' : 'transparent',
                      overflow: 'visible',
                      zIndex: laid.some(s => s.id === clickedId) ? 10 : 'auto',
                    }}>

                    {/* Overlay vacances */}
                    {vacation && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, pointerEvents: 'none', zIndex: 3 }}>
                        <span style={{ fontSize: '1.4rem', opacity: 0.4 }}>🏖️</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--ink-mute)', opacity: 0.6, textAlign: 'center', lineHeight: 1.4, padding: '0 4px' }}>
                          {vacation.nom}
                        </span>
                      </div>
                    )}

                    {laid.map(s => {
                      const top   = slotTop(s.heureDebut)
                      const baseH = Math.max(slotHeight(s.heureDebut, s.heureFin), 18)
                      const isHov = clickedId === s.id
                      const pct   = 100 / s._numCols
                      const GAP   = 2   // px between side-by-side cards

                      return (
                        <div key={s.id}
                          className={`gym-slot disc-${s.disc}${s.complet ? ' complet' : ''}`}
                          style={{
                            position: 'absolute',
                            top,
                            // Clic : expand to full column width
                            left:   isHov ? GAP : `calc(${s._col * pct}% + ${GAP}px)`,
                            width:  isHov ? `calc(100% - ${GAP * 2}px)` : `calc(${pct}% - ${GAP * 2}px)`,
                            height: isHov ? 'auto' : baseH,
                            minHeight: baseH,
                            zIndex:   isHov ? 30 : 2 + s._col,
                            overflow: 'hidden',
                            padding:  isHov ? '8px 10px' : (baseH < 30 ? '2px 5px' : '4px 7px'),
                            cursor:   'pointer',
                            transition: 'left 0.12s ease, width 0.12s ease',
                            boxShadow: isHov ? '0 4px 16px rgba(0,0,0,0.18)' : 'none',
                          }}
                          onClick={(e) => { e.stopPropagation(); setClickedId(isHov ? null : s.id) }}
                        >
                          {/* Heure */}
                          {(isHov || baseH >= 22) && (
                            <div style={{ fontSize: '0.62rem', fontWeight: 700, lineHeight: 1, opacity: 0.75, marginBottom: 1, whiteSpace: 'nowrap' }}>
                              {isHov ? `${s.heureDebut} – ${s.heureFin}` : s.heureDebut}
                            </div>
                          )}
                          {/* Discipline */}
                          <div style={{ fontSize: isHov ? '0.88rem' : (s._numCols > 1 ? '0.68rem' : '0.78rem'), fontWeight: 600, lineHeight: 1.25, whiteSpace: isHov ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.discipline}
                            {!isHov && recurrenceBadge(s.recurrence) && (
                              <span style={{ marginLeft: 4, fontSize: '0.58rem', fontWeight: 700, opacity: 0.7, verticalAlign: 'middle' }}>
                                {recurrenceBadge(s.recurrence)}
                              </span>
                            )}
                          </div>
                          {/* Badges */}
                          {(isHov ? true : (s.complet || s.tag)) && (s.complet || s.tag) && (
                            <div style={{ marginTop: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                              {s.complet       && <span className="slot-badge badge-complet" style={{ fontSize: '0.58rem' }}>Complet</span>}
                              {s.tag==='nouveau'&& <span className="slot-badge badge-nouveau" style={{ fontSize: '0.58rem' }}>Nouveau</span>}
                              {s.tag==='apa'   && <span className="slot-badge badge-apa"     style={{ fontSize: '0.58rem' }}>APA</span>}
                            </div>
                          )}
                          {/* Animateur (hover ou hauteur suffisante) */}
                          {(isHov || baseH >= 48) && (
                            <div className="gym-slot-meta" style={{ fontSize: '0.67rem', marginTop: isHov ? 5 : 2, whiteSpace: isHov ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.animateur}
                            </div>
                          )}
                          {/* Salle */}
                          {(isHov || baseH >= 64) && (
                            <div className="gym-slot-meta" style={{ fontSize: '0.64rem', whiteSpace: isHov ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.salle}
                            </div>
                          )}
                          {/* Niveau (click uniquement) */}
                          {isHov && s.niveau && s.niveau !== 'tous' && (
                            <div className="gym-slot-meta" style={{ fontSize: '0.64rem', marginTop: 2, fontStyle: 'italic' }}>
                              Niveau : {s.niveau}
                            </div>
                          )}
                          {/* Récurrence (click uniquement) */}
                          {isHov && recurrenceLabel(s.recurrence, s.jour) && (
                            <div className="gym-slot-meta" style={{ fontSize: '0.64rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ opacity: 0.6 }}>↻</span> {recurrenceLabel(s.recurrence, s.jour)}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Info cards ── */}
        <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 24 }}>
            <h4 style={{ marginBottom: 12 }}>Les 5 salles</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, fontSize: "0.92rem", color: "var(--ink-soft)" }}>
              <li><strong>La Ruche</strong> — La Clairière</li>
              <li><strong>Catherine de Vivonne</strong></li>
              <li><strong>Dreyfus</strong> — Stationnement salle Patenôtre (disque obligatoire)</li>
              <li><strong>Gymnase du Bel-Air</strong></li>
              <li><strong>Maison des Associations</strong></li>
            </ul>
          </div>
          <div style={{ background: "var(--accent-tint)", border: "1px solid var(--accent-soft)", borderRadius: "var(--r-md)", padding: 24 }}>
            <h4 style={{ marginBottom: 10 }}>Rappel</h4>
            <p style={{ margin: 0, fontSize: "0.94rem", color: "var(--ink-soft)" }}>
              Il n'y a <strong>pas de cours pendant les vacances scolaires</strong>.
              Des stages spécifiques sont régulièrement organisés.
            </p>
          </div>
        </div>

        {/* ── Légende ── */}
        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--ink-mute)' }}>
          <span><span className="slot-badge badge-complet">C</span> Complet — inscription non disponible</span>
          <span><span className="slot-badge badge-nouveau">N</span> Nouveau cours cette saison</span>
          <span><span className="slot-badge badge-apa">APA</span> Activité Physique Adaptée (sur ordonnance)</span>
        </div>

      </div>
    </section>
  )
}
