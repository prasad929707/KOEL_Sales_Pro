// ─────────────────────────────────────────────────────────────────────────────
// SEGMENTS MODULE — Phase 4 Cheat Sheets
//
// Left: segment tile grid
// Right: full cheat sheet for selected segment
//
// Data source: src/data/segmentData.js
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { SEGMENT_DATA, SEGMENT_LIST } from '../data/segmentData'

// ── Sub-components ────────────────────────────────────────────────────────────

function Tag({ children, color = 'teal' }) {
  const styles = {
    teal:  { bg: 'var(--teal-light)',   text: 'var(--teal)' },
    red:   { bg: 'rgba(239,68,68,0.08)', text: '#dc2626' },
    amber: { bg: 'rgba(245,158,11,0.1)', text: '#92400e' },
    slate: { bg: 'var(--off-white)',     text: 'var(--gray)', border: '1px solid var(--border)' },
  }
  const s = styles[color] || styles.teal
  return (
    <span style={{
      display: 'inline-block',
      background: s.bg, color: s.text,
      border: s.border || 'none',
      fontSize: '0.68rem', fontWeight: 700,
      padding: '2px 9px', borderRadius: 99,
      letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  )
}

function SectionHead({ children }) {
  return (
    <div style={{
      fontSize: '0.6rem', fontWeight: 800, color: 'var(--teal)',
      textTransform: 'uppercase', letterSpacing: '0.12em',
      marginBottom: 10, marginTop: 22,
      paddingBottom: 5, borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

function BulletRow({ icon, text, sub }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: '0.875rem', flexShrink: 0, marginTop: 1, lineHeight: 1 }}>{icon || '→'}</span>
      <div>
        <div style={{ fontSize: '0.82rem', color: 'var(--slate)', lineHeight: 1.5 }}>{text}</div>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Cheat sheet renderer ──────────────────────────────────────────────────────

function CheatSheet({ segId }) {
  const seg = SEGMENT_DATA[segId]
  if (!seg) return null
  const cs = seg.cheatSheet
  const pi = seg.pitchIntel

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{seg.icon}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--slate)' }}>{seg.label}</h2>
          <div style={{ fontSize: '0.78rem', color: 'var(--gray)', marginTop: 3 }}>{cs.summary}</div>
        </div>
        {!seg.fieldVerified && (
          <span style={{ marginLeft: 'auto', background: 'rgba(245,158,11,0.1)', color: '#92400e', fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, flexShrink: 0 }}>
            ⚠ Awaiting field verification
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* LEFT COLUMN */}
        <div>

          {/* Buyer profile */}
          <SectionHead>Buyer Profile</SectionHead>
          <div style={{ background: 'var(--off-white)', borderRadius: 8, padding: '12px 14px', marginBottom: 4 }}>
            {[
              { label: 'Decision maker', val: cs.buyerProfile?.decisionMaker },
              { label: 'Technical influencer', val: cs.buyerProfile?.technicalInfluencer },
              { label: 'Procurement route', val: cs.buyerProfile?.procurementRoute },
              { label: 'Catch early at', val: cs.buyerProfile?.earlyInfluencePoint },
            ].filter(r => r.val).map(r => (
              <div key={r.label} style={{ marginBottom: 7 }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate)', lineHeight: 1.5 }}>{r.val}</div>
              </div>
            ))}
          </div>

          {/* Sizing */}
          <SectionHead>Sizing Guide</SectionHead>
          {cs.sizing?.kvaRange && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <Tag color="teal">{cs.sizing.kvaRange.min} kVA min</Tag>
              <Tag color="slate">Typical: {cs.sizing.kvaRange.typical} kVA</Tag>
              <Tag color="slate">{cs.sizing.kvaRange.max} kVA max</Tag>
            </div>
          )}
          {(cs.sizing?.byBedCount || cs.sizing?.byPlantSize || cs.sizing?.byDcType || cs.sizing?.byBedCount) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
              {(cs.sizing.byBedCount || cs.sizing.byPlantSize || cs.sizing.byDcType || []).map((row, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--teal)', flexShrink: 0, minWidth: 90 }}>
                    {row.kva}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--slate)' }}>
                      {row.beds || row.type}
                    </div>
                    {row.notes && <div style={{ fontSize: '0.68rem', color: 'var(--gray)', marginTop: 2, lineHeight: 1.4 }}>{row.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {cs.sizing?.redundancy && (
            <div style={{ fontSize: '0.78rem', color: 'var(--slate)', background: 'var(--teal-light)', borderRadius: 7, padding: '7px 11px', marginBottom: 6, lineHeight: 1.5 }}>
              <strong>Redundancy:</strong> {cs.sizing.redundancy}
            </div>
          )}
          {cs.sizing?.criticalNote && (
            <div style={{ fontSize: '0.75rem', color: '#7f1d1d', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderLeft: '3px solid rgba(239,68,68,0.4)', borderRadius: '0 7px 7px 0', padding: '7px 11px', lineHeight: 1.55 }}>
              ⚠ {cs.sizing.criticalNote}
            </div>
          )}

          {/* Load note */}
          {pi.loadNote && (
            <>
              <SectionHead>Load Note</SectionHead>
              <div style={{ fontSize: '0.8rem', color: 'var(--slate)', lineHeight: 1.6, borderLeft: '3px solid var(--teal)', paddingLeft: 10 }}>
                {pi.loadNote}
              </div>
            </>
          )}

          {/* Lead triggers */}
          {cs.leadTriggers?.length > 0 && (
            <>
              <SectionHead>Lead Triggers</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cs.leadTriggers.map((lt, i) => (
                  <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px' }}>
                    <div style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 2 }}>
                      🎯 {lt.trigger}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--gray)', lineHeight: 1.4 }}>
                      Source: {lt.source}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Seasonality */}
          {cs.seasonality && (
            <>
              <SectionHead>Seasonality</SectionHead>
              <div style={{ fontSize: '0.79rem', color: 'var(--gray)', lineHeight: 1.6 }}>{cs.seasonality}</div>
            </>
          )}

          {/* Competitor watch */}
          {cs.competitorWatch && (
            <>
              <SectionHead>Competitor Watch</SectionHead>
              <div style={{ fontSize: '0.79rem', color: 'var(--gray)', lineHeight: 1.6 }}>{cs.competitorWatch}</div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>

          {/* Pain points */}
          {cs.painPoints?.length > 0 && (
            <>
              <SectionHead>Pain Points</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cs.painPoints.map((pp, i) => (
                  <details key={i} style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 8, overflow: 'hidden' }}>
                    <summary style={{
                      padding: '9px 13px', cursor: 'pointer', listStyle: 'none',
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                      fontSize: '0.8rem', fontWeight: 700, color: '#991b1b', lineHeight: 1.4,
                    }}>
                      <span style={{ flexShrink: 0 }}>⚠</span>
                      <span>{pp.headline}</span>
                    </summary>
                    <div style={{ padding: '0 13px 12px', borderTop: '1px solid rgba(239,68,68,0.1)' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--slate)', lineHeight: 1.6, margin: '8px 0 6px' }}>{pp.detail}</p>
                      {pp.salesAngle && (
                        <div style={{ background: 'var(--teal-light)', borderLeft: '3px solid var(--teal)', padding: '7px 10px', borderRadius: '0 6px 6px 0', fontSize: '0.76rem', color: 'var(--teal-dark)', lineHeight: 1.5 }}>
                          <strong>Sales angle:</strong> {pp.salesAngle}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </>
          )}

          {/* Talking points */}
          {cs.talkingPoints?.length > 0 && (
            <>
              <SectionHead>Talking Points That Land</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cs.talkingPoints.map((tp, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'white', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px' }}>
                    <span style={{ color: 'var(--teal)', fontWeight: 800, flexShrink: 0, fontSize: '0.85rem', marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate)', lineHeight: 1.55 }}>{tp}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Objections */}
          {cs.objections?.length > 0 && (
            <>
              <SectionHead>Common Objections + Counters</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cs.objections.map((obj, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '8px 13px', background: 'var(--off-white)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate)', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <span style={{ color: '#dc2626', flexShrink: 0 }}>✗</span>
                      <span>{obj.objection}</span>
                    </div>
                    <div style={{ padding: '8px 13px 10px', fontSize: '0.78rem', color: 'var(--slate)', lineHeight: 1.6, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--teal)', flexShrink: 0, fontWeight: 800 }}>→</span>
                      <span>{obj.counter}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Proof points */}
          {cs.proofPoints?.length > 0 && (
            <>
              <SectionHead>Proof Points</SectionHead>
              {cs.proofPoints.map((pp, i) => (
                <BulletRow key={i} icon="✅" text={pp} />
              ))}
            </>
          )}

          {/* KOEL value statement */}
          <SectionHead>KOEL Value Statement</SectionHead>
          <div style={{ background: 'var(--teal-light)', borderLeft: '3px solid var(--teal)', padding: '10px 14px', borderRadius: '0 8px 8px 0', fontSize: '0.82rem', color: 'var(--teal-dark)', lineHeight: 1.65 }}>
            {pi.koelValue}
          </div>

          {/* References */}
          {pi.references?.length > 0 && (
            <>
              <SectionHead>Reference Accounts</SectionHead>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {pi.references.map((ref, i) => (
                  <div key={i} style={{ fontSize: '0.79rem', color: 'var(--slate)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--teal)', flexShrink: 0 }}>◆</span>
                    {ref}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SegmentsPlaceholder() {
  const [active, setActive] = useState('healthcare')

  return (
    <div className="page-content" style={{ background: 'var(--off-white)', minHeight: '100vh' }}>
      <div className="container--wide">

        <div style={{ paddingTop: 'var(--s8)', marginBottom: 'var(--s5)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            Phase 3 · Segment Intelligence
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--slate)' }}>Segment Cheat Sheets</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--gray)', fontSize: '0.875rem' }}>
            Buyer profiles, sizing norms, talking points, objection handling, and lead triggers — for every segment KOEL sells into.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--s5)', alignItems: 'start' }}>

          {/* Segment selector */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 80 }}>
            {SEGMENT_LIST.map(id => {
              const seg = SEGMENT_DATA[id]
              if (!seg) return null
              const isActive = active === id
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    background: isActive ? 'var(--teal-light)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--teal)' : '3px solid transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    transition: 'background 150ms',
                  }}
                >
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{seg.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--teal-dark)' : 'var(--slate)' }}>
                      {seg.label}
                    </div>
                    {!seg.fieldVerified && (
                      <div style={{ fontSize: '0.6rem', color: '#92400e' }}>research-level</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Cheat sheet panel */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 'var(--s10)' }}>
            <CheatSheet segId={active} />
          </div>
        </div>
      </div>
    </div>
  )
}
