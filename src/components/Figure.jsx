// ─────────────────────────────────────────────────────────────────────────────
// <Figure /> — the ONLY way to render a number in Opportunities / Vision Lab.
//
// Takes an Entry (see src/lib/entrySchema.js) and renders:
//   • the formatted value + unit
//   • a confidence badge (HIGH / MED / LOW)
//   • hover tooltip with source + sourceUrl + notes + lastUpdated
//   • "Needs data" placeholder when the Entry isn't filled in yet
//
// Why a component and not a string helper: the reviewer must be able to
// click any number and see where it came from. A string can't do that.
//
// Usage:
//   import entry from '../data/vision/koel_fy25_actuals.json' assert { type: 'json' }
//   <Figure entry={entry.powerGenRevenue} />
//   <Figure entry={entry.unitVolume} inline />   // inline variant — smaller
//   <Figure entry={entry.share} size="large" />  // hero variant — for headlines
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react'
import { CONFIDENCE_STYLES, formatValue, isReady } from '../lib/entrySchema'

export default function Figure({ entry, inline = false, size = 'default', showBadge = true }) {
  const [showTip, setShowTip] = useState(false)
  const [tipPos,  setTipPos]  = useState({ x: 0, y: 0 })
  const wrapRef = useRef(null)

  // Not ready → render a visible "Needs data" pill so it's obvious.
  if (!isReady(entry)) {
    return (
      <span style={{
        display: inline ? 'inline-block' : 'inline-flex',
        alignItems: 'center', gap: 6,
        padding: inline ? '1px 6px' : '2px 8px',
        fontSize: size === 'large' ? '0.85rem' : '0.72rem',
        fontWeight: 600,
        color: '#DC2626',
        background: 'rgba(220,38,38,0.06)',
        border: '1px dashed rgba(220,38,38,0.4)',
        borderRadius: 6,
        fontStyle: 'italic',
      }}>
        Needs data
      </span>
    )
  }

  const conf  = CONFIDENCE_STYLES[entry.confidence] || CONFIDENCE_STYLES.low
  const valueStr = formatValue(entry)

  // Sizing tokens
  const fontSize = size === 'large' ? '1.4rem'
                  : size === 'small' ? '0.82rem'
                  : inline ? '0.88rem'
                  : '1rem'
  const fontWeight = size === 'large' ? 800 : 700

  const handleEnter = (e) => {
    setTipPos({ x: e.clientX, y: e.clientY })
    setShowTip(true)
  }
  const handleMove = (e) => setTipPos({ x: e.clientX, y: e.clientY })
  const handleLeave = () => setShowTip(false)

  return (
    <>
      <span
        ref={wrapRef}
        onMouseEnter={handleEnter}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{
          display: inline ? 'inline' : 'inline-flex',
          alignItems: 'baseline',
          gap: 6,
          cursor: 'help',
          borderBottom: '1px dotted rgba(30,45,61,0.25)',
          lineHeight: 1.2,
        }}
      >
        <span style={{ fontSize, fontWeight, color: 'var(--slate)' }}>
          {valueStr}
          {entry.unit && (
            <span style={{
              fontSize: size === 'large' ? '0.8rem' : '0.72rem',
              fontWeight: 500,
              color: 'var(--gray)',
              marginLeft: 3,
            }}>
              {entry.unit}
            </span>
          )}
        </span>

        {showBadge && !inline && (
          <span style={{
            display: 'inline-block',
            fontSize: '0.58rem',
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: conf.fg,
            background: conf.bg,
            padding: '1px 5px',
            borderRadius: 99,
            lineHeight: 1.4,
          }}>
            {conf.label}
          </span>
        )}
      </span>

      {showTip && (
        <div style={{
          position: 'fixed',
          left: tipPos.x + 14,
          top:  tipPos.y + 14,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderLeft: `3px solid ${conf.fg}`,
          borderRadius: 8,
          padding: '10px 14px',
          maxWidth: 320,
          zIndex: 9999,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          pointerEvents: 'none',
          fontSize: '0.74rem',
          lineHeight: 1.5,
          color: 'var(--gray)',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--slate)', marginBottom: 4 }}>
            {valueStr} {entry.unit}
          </div>
          <div style={{ color: 'var(--slate)', marginBottom: 4 }}>
            <strong>Source:</strong> {entry.source}
          </div>
          {entry.sourceUrl && (
            <div style={{ color: conf.fg, fontSize: '0.68rem', marginBottom: 4, wordBreak: 'break-all' }}>
              {entry.sourceUrl}
            </div>
          )}
          {entry.notes && (
            <div style={{ color: 'var(--gray)', fontSize: '0.7rem', marginBottom: 4 }}>
              {entry.notes}
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 4,
            fontSize: '0.66rem',
          }}>
            <span style={{ color: conf.fg, fontWeight: 700 }}>
              Confidence: {conf.label}
            </span>
            {entry.lastUpdated && (
              <span style={{ color: 'var(--muted)' }}>
                Updated {entry.lastUpdated}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  )
}
