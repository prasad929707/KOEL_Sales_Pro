// ─────────────────────────────────────────────────────────────────────────────
// Marksight — Market opportunity intelligence module
// Tabs: Segment Universe · India Map · Pipeline Tracker · Gap Analysis
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MARKSIGHT_SEGMENTS, MARKSIGHT_SEGMENT_LIST,
  TIER_CONFIG, GOEM_DATA, STATE_TO_GOEM, DEMAND_CITIES,
} from '../data/marksightData'
import IndiaMap from '../components/IndiaMap'
import DCIntelligence from '../components/DCIntelligence'

// ── Shared sub-components ─────────────────────────────────────────────────────

function TierBadge({ tier, small }) {
  const cfg = TIER_CONFIG[tier]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.bg, color: cfg.color,
      fontSize: small ? '0.6rem' : '0.65rem',
      fontWeight: 700, padding: small ? '2px 7px' : '3px 9px',
      borderRadius: 99, letterSpacing: '0.04em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

function VisibilityDot({ level }) {
  const map = {
    'Very High': { color: '#14b8a6', count: 4 },
    'High':      { color: '#22c55e', count: 3 },
    'Medium':    { color: '#f59e0b', count: 2 },
    'Low':       { color: '#475569', count: 1 },
  }
  const { color, count } = map[level] || map['Low']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {[1,2,3,4].map(n => (
        <div key={n} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: n <= count ? color : 'rgba(0,0,0,0.08)',
        }} />
      ))}
      <span style={{ fontSize: '0.62rem', color: '#475569', marginLeft: 2 }}>{level}</span>
    </div>
  )
}

// ── Tab: Segment Universe ─────────────────────────────────────────────────────

function SegmentCard({ seg, isActive, onClick }) {
  const tierCfg = TIER_CONFIG[seg.tier]
  return (
    <div
      onClick={onClick}
      style={{
        background: isActive ? 'rgba(20,184,166,0.06)' : 'var(--white)',
        border: `1px solid ${isActive ? 'rgba(20,184,166,0.4)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 150ms, background 150ms',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        height: 'fit-content',
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{seg.icon}</span>

      {/* Segment name */}
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate)', lineHeight: 1.2 }}>
        {seg.name}
      </div>

      {/* Tier badge */}
      <div style={{ marginTop: 2 }}>
        <TierBadge tier={seg.tier} small />
      </div>

      {/* Subsegments as tiny pills (max 3) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
        {seg.subsegments.slice(0, 3).map(sub => (
          <span key={sub} style={{
            fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)',
            background: 'var(--off-white)',
            border: '1px solid var(--border)',
            padding: '2px 6px', borderRadius: 99,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {sub.split(' ')[0]}
          </span>
        ))}
      </div>
    </div>
  )
}

function SegmentDetailPanel({ seg }) {
  if (!seg) return (
    <div style={{ padding: '40px 32px', textAlign: 'center', color: '#334155' }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>←</div>
      <div style={{ fontSize: '0.82rem' }}>Select a segment to view full detail</div>
    </div>
  )

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{seg.icon}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--slate)', fontWeight: 800 }}>{seg.name}</h3>
            <div style={{ marginTop: 5 }}><TierBadge tier={seg.tier} /></div>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.7 }}>{seg.description}</p>
      </div>

      {/* kVA range */}
      <Section label="Sizing">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {[
            { l: 'Min', v: seg.kvaRange.min },
            { l: 'Typical', v: seg.kvaRange.typical },
            { l: 'Max', v: seg.kvaRange.max },
          ].map(item => (
            <div key={item.l} style={{
              flex: 1, minWidth: 70,
              background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.15)',
              borderRadius: 8, padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.58rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.l}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#14b8a6', fontFamily: 'var(--font-mono)' }}>{item.v.toLocaleString()}</div>
              <div style={{ fontSize: '0.58rem', color: '#334155' }}>kVA</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.6, background: 'var(--white)', borderRadius: 6, padding: '8px 10px', borderLeft: '2px solid rgba(20,184,166,0.3)' }}>
          {seg.demandFormula}
        </div>
      </Section>

      {/* Sub-segments */}
      <Section label="Sub-segments">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {seg.subsegments.map(s => (
            <span key={s} style={{
              fontSize: '0.7rem', color: 'var(--gray)',
              background: 'var(--off-white)',
              border: '1px solid var(--border)',
              padding: '3px 10px', borderRadius: 99,
            }}>{s}</span>
          ))}
        </div>
      </Section>

      {/* Competitor landscape */}
      <Section label="Competitor Landscape">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {seg.topCompetitors.map((comp, i) => {
            let bgColor = 'var(--off-white)'
            let textColor = 'var(--gray)'
            if (i === 0) { bgColor = 'rgba(220,38,38,0.08)'; textColor = '#dc2626' }
            else if (comp.includes('KOEL')) { bgColor = 'rgba(20,184,166,0.08)'; textColor = '#14b8a6' }
            return (
              <span key={comp} style={{
                fontSize: '0.68rem', fontWeight: 700,
                color: textColor,
                background: bgColor,
                border: `1px solid ${i === 0 ? 'rgba(220,38,38,0.2)' : 'var(--border)'}`,
                padding: '3px 10px', borderRadius: 99,
              }}>
                {comp}
              </span>
            )
          })}
        </div>
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#475569', lineHeight: 1.65 }}>
          {seg.competitorContext}
        </p>
      </Section>

      {/* KOEL position */}
      <Section label="KOEL Position">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.15)',
            borderRadius: 8, padding: '10px 12px',
          }}>
            <div style={{ fontSize: '0.6rem', color: '#14b8a6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Strength</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.6 }}>{seg.koelStrength}</div>
          </div>
          <div style={{
            background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.1)',
            borderRadius: 8, padding: '10px 12px',
          }}>
            <div style={{ fontSize: '0.6rem', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Gap to close</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gray)', lineHeight: 1.6 }}>{seg.koelGap}</div>
          </div>
        </div>
      </Section>

      {/* Hot geographies */}
      <Section label="Hot Geographies">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {seg.hotGeographies.map(g => (
            <span key={g} style={{
              fontSize: '0.68rem', color: 'var(--gray)',
              background: 'var(--off-white)',
              border: '1px solid var(--border)',
              padding: '3px 10px', borderRadius: 99,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: '0.6rem' }}>📍</span>{g}
            </span>
          ))}
        </div>
      </Section>

      {/* Key players */}
      <Section label="Key Buyers / Developers">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {seg.keyPlayers.map(p => (
            <span key={p} style={{
              fontSize: '0.68rem', color: '#475569',
              background: 'var(--white)',
              border: '1px solid var(--border)',
              padding: '2px 8px', borderRadius: 99,
            }}>{p}</span>
          ))}
        </div>
      </Section>

      {/* Data sources */}
      <Section label="Data Sources">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {seg.keyDataSources.map((src, i) => (
            <div key={i} style={{
              display: 'flex', gap: 7, alignItems: 'flex-start',
              fontSize: '0.72rem', color: '#475569', lineHeight: 1.5,
            }}>
              <span style={{ color: '#334155', flexShrink: 0, marginTop: 2 }}>→</span>
              <span>{src}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Note if present */}
      {seg.note && (
        <div style={{
          background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 8, padding: '10px 12px', marginTop: 4,
          fontSize: '0.72rem', color: '#92400e', lineHeight: 1.6,
        }}>
          <span style={{ fontWeight: 700 }}>Note: </span>{seg.note}
        </div>
      )}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: '0.58rem', fontWeight: 800, color: '#1e3a5f',
        textTransform: 'uppercase', letterSpacing: '0.12em',
        marginBottom: 8, paddingBottom: 6,
        borderBottom: '1px solid var(--border)',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function SegmentUniverse() {
  const [active, setActive] = useState('data_centers')
  const [filterTier, setFilterTier] = useState(0) // 0 = all

  const filtered = filterTier
    ? MARKSIGHT_SEGMENT_LIST.filter(id => {
        const seg = MARKSIGHT_SEGMENTS.find(s => s.id === id)
        return seg && seg.tier === filterTier
      })
    : MARKSIGHT_SEGMENT_LIST

  const activeSeg = MARKSIGHT_SEGMENTS.find(s => s.id === active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

    {/* ── Top two-column row ─────────────────────────────────────────────── */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

      {/* Left — grid + filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Tier filter */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#334155', fontWeight: 600, flexShrink: 0 }}>Filter:</span>
          {[
            { tier: 0, label: 'All segments' },
            { tier: 1, label: 'Tier 1 — Priority' },
            { tier: 2, label: 'Tier 2 — Build Next' },
            { tier: 3, label: 'Tier 3 — Track' },
          ].map(f => (
            <button
              key={f.tier}
              onClick={() => setFilterTier(f.tier)}
              style={{
                fontSize: '0.68rem', fontWeight: 600,
                color: filterTier === f.tier ? '#14b8a6' : '#334155',
                background: filterTier === f.tier ? 'rgba(20,184,166,0.1)' : 'transparent',
                border: `1px solid ${filterTier === f.tier ? 'rgba(20,184,166,0.3)' : 'var(--border)'}`,
                padding: '4px 11px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 150ms',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Segment cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
          alignContent: 'start',
          overflowY: 'auto',
          paddingRight: 4,
          maxHeight: 'calc(100vh - 280px)',
        }}>
          {filtered.map(id => {
            const seg = MARKSIGHT_SEGMENTS.find(s => s.id === id)
            if (!seg) return null
            return (
              <SegmentCard
                key={id}
                seg={seg}
                isActive={active === id}
                onClick={() => setActive(id)}
              />
            )
          })}
        </div>
      </div>

      {/* Right — detail panel */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        height: 'calc(100vh - 230px)',
        position: 'sticky',
        top: 20,
      }}>
        <SegmentDetailPanel seg={activeSeg} />
      </div>

    </div>{/* end two-column row */}

    {/* ── DC Intelligence deep-dive (scroll down after clicking Data Centers) */}
    {active === 'data_centers' && (
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 4,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, color: '#14b8a6',
            letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 10px',
            background: 'rgba(20,184,166,0.08)', borderRadius: 99,
            border: '1px solid rgba(20,184,166,0.2)', flexShrink: 0,
          }}>
            ↓ Data Centers — Deep Dive
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <DCIntelligence />
      </div>
    )}

    </div>{/* end outer flex column */}
  )
}

// ── Tab: India Map ────────────────────────────────────────────────────────────

function IndiaMapTab() {
  const [drillState,       setDrillState]       = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)

  // Single click on a state → immediately drill into district map
  function handleStateClick(name) {
    setDrillState(name)
    setSelectedDistrict(null)
  }
  function handleDrillBack() {
    setDrillState(null)
    setSelectedDistrict(null)
  }
  function handleDistrictClick(dName) {
    setSelectedDistrict(d => d === dName ? null : dName)
  }

  // Demand city pins — always on the map
  const indiaBubbles = DEMAND_CITIES.map(c => ({
    lat: c.lat, lon: c.lon,
    size: 4 + c.demandScore * 1.5,
    color: '#f59e0b',
    label: c.name,
    tooltip: `${c.name} · ${c.state}\nDemand: ${c.demandScore}/10`,
  }))

  const drillBubbles = drillState
    ? DEMAND_CITIES.filter(c => c.state === drillState).map(c => ({
        lat: c.lat, lon: c.lon,
        size: 8 + c.demandScore * 2.5,
        color: '#f59e0b',
        label: c.name,
        tooltip: `${c.name}\nDemand: ${c.demandScore}/10`,
      }))
    : []

  const drillGoemId = drillState ? STATE_TO_GOEM[drillState] : null
  const drillGoem   = drillGoemId ? GOEM_DATA[drillGoemId] : null
  const drillCities = drillState  ? DEMAND_CITIES.filter(c => c.state === drillState) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Hero map — full width ─────────────────────────────────────────── */}
      <IndiaMap
        overlayMode="goem"
        bubbles={drillState ? drillBubbles : indiaBubbles}
        drillState={drillState}
        selectedDistrict={selectedDistrict}
        height={700}
        onStateClick={handleStateClick}
        onDistrictClick={handleDistrictClick}
        onDrillBack={handleDrillBack}
        showLegend={false}
        note={null}
      />

      {/* ── India view: GOEM legend + hint ───────────────────────────────── */}
      {!drillState && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 20px' }}>
          {Object.values(GOEM_DATA).filter(g => g.states?.length > 0).map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 10, height: 10, borderRadius: 2,
                background: g.color + 'aa', border: `1px solid ${g.color}`,
              }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155' }}>{g.name}</span>
              <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>· {g.hq}</span>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f59e0b', opacity: 0.85 }} />
              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Demand hotspots</span>
            </div>
            <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Click any state → district map</span>
          </div>
        </div>
      )}

      {/* ── Drill view: state info strip ─────────────────────────────────── */}
      {drillState && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

          {/* GOEM territory */}
          <div style={{
            background: drillGoem ? drillGoem.color + '0d' : 'var(--white)',
            border: `1px solid ${drillGoem ? drillGoem.color + '33' : 'var(--border)'}`,
            borderLeft: `3px solid ${drillGoem ? drillGoem.color : 'var(--border)'}`,
            borderRadius: 10, padding: '12px 16px',
          }}>
            <div style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>GOEM Territory</div>
            {drillGoem ? (
              <>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: drillGoem.color }}>{drillGoem.name}</div>
                <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 2 }}>HQ: {drillGoem.hq}</div>
                {!drillGoem.verified && <div style={{ fontSize: '0.58rem', color: '#f59e0b', marginTop: 4 }}>⚠ Territory unverified</div>}
              </>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Not assigned — check with Sales Ops</div>
            )}
          </div>

          {/* Selected district */}
          <div style={{
            background: selectedDistrict ? 'rgba(20,184,166,0.05)' : 'var(--white)',
            border: `1px solid ${selectedDistrict ? 'rgba(20,184,166,0.2)' : 'var(--border)'}`,
            borderRadius: 10, padding: '12px 16px',
          }}>
            <div style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>District</div>
            {selectedDistrict ? (
              <>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate)' }}>{selectedDistrict}</div>
                <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 2 }}>{drillState}</div>
              </>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Click a district on the map</div>
            )}
          </div>

          {/* Demand hotspots in this state */}
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 16px',
          }}>
            <div style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Hotspots in {drillState}</div>
            {drillCities.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {drillCities.sort((a,b) => b.demandScore - a.demandScore).map(c => (
                  <span key={c.id} style={{
                    fontSize: '0.65rem', fontWeight: 600,
                    color: '#d97706', background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    padding: '2px 9px', borderRadius: 99,
                  }}>
                    ● {c.name} <span style={{ opacity: 0.65, fontWeight: 400 }}>{c.demandScore}/10</span>
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>No hotspots tracked in {drillState}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Drill panel: shown when a state is drilled into ───────────────────────────
function DrillPanel({ stateName, selectedDistrict, mapMode }) {
  const goemId = STATE_TO_GOEM[stateName]
  const goem   = goemId ? GOEM_DATA[goemId] : null
  const cities = DEMAND_CITIES.filter(c => c.state === stateName)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* GOEM info */}
      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        borderLeft: `3px solid ${goem ? goem.color : 'var(--border)'}`,
        borderRadius: 10, padding: '12px 14px',
      }}>
        <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>GOEM Coverage</div>
        {goem ? (
          <>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: goem.color, marginBottom: 3 }}>{goem.name}</div>
            <div style={{ fontSize: '0.68rem', color: '#475569' }}>HQ: {goem.hq}</div>
            {!goem.verified && <div style={{ fontSize: '0.62rem', color: '#f59e0b', marginTop: 4 }}>⚠ Territory not officially verified</div>}
          </>
        ) : (
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>GOEM assignment unknown — verify with Sales Ops</div>
        )}
      </div>

      {/* Selected district */}
      {selectedDistrict && (
        <div style={{
          background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.2)',
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div style={{ fontSize: '0.62rem', color: '#14b8a6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Selected District</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate)' }}>{selectedDistrict}</div>
          <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: 3 }}>{stateName}</div>
        </div>
      )}

      {/* Demand cities in this state */}
      {cities.length > 0 && (
        <>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>Demand Hotspots</div>
          {cities.map(c => (
            <div key={c.id} style={{
              background: 'var(--white)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '9px 12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray)' }}>{c.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                  {c.tier1Segments.map(s => {
                    const seg = MARKSIGHT_SEGMENTS.find(x => x.id === s)
                    return seg ? (
                      <span key={s} style={{
                        fontSize: '0.58rem', color: '#14b8a6',
                        background: 'rgba(20,184,166,0.08)',
                        padding: '1px 6px', borderRadius: 99,
                      }}>{seg.shortName}</span>
                    ) : null
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#14b8a6' }}>{c.demandScore}</div>
                <div style={{ fontSize: '0.58rem', color: '#334155' }}>/10</div>
              </div>
            </div>
          ))}
        </>
      )}

      {cities.length === 0 && (
        <div style={{ fontSize: '0.72rem', color: '#64748b', padding: '8px 0' }}>
          No demand hotspots tracked in {stateName} yet.
        </div>
      )}

      <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 4, lineHeight: 1.6 }}>
        District data is geographic only. Segment-level demand by district will be added when pipeline data is sourced.
      </div>
    </div>
  )
}

function StateDetail({ stateName, mapMode }) {
  const goemId  = STATE_TO_GOEM[stateName]
  const goem    = goemId ? GOEM_DATA[goemId] : null
  const cities  = DEMAND_CITIES.filter(c => c.state === stateName)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: '0.6rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>GOEM Coverage</div>
        {goem ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: goem.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: goem.color }}>{goem.name}</div>
              {!goem.verified && <div style={{ fontSize: '0.62rem', color: '#f59e0b' }}>⚠ Not officially verified</div>}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.72rem', color: '#475569' }}>Unknown — verify with Sales Ops</div>
        )}
      </div>

      {cities.length > 0 && (
        <div>
          <div style={{ fontSize: '0.6rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tracked Hotspots</div>
          {cities.map(c => (
            <div key={c.id} style={{
              marginBottom: 8, padding: '8px 10px',
              background: 'var(--white)',
              borderRadius: 7, border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray)' }}>{c.name}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#14b8a6' }}>{c.demandScore}/10</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {c.tier1Segments.map(s => {
                  const seg = MARKSIGHT_SEGMENTS.find(x => x.id === s)
                  return seg ? (
                    <span key={s} style={{
                      fontSize: '0.58rem', color: '#14b8a6',
                      background: 'rgba(20,184,166,0.08)',
                      padding: '1px 6px', borderRadius: 99,
                    }}>{seg.shortName}</span>
                  ) : null
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {cities.length === 0 && (
        <div style={{ fontSize: '0.72rem', color: '#334155' }}>No demand hotspots tracked yet in this state.</div>
      )}
    </div>
  )
}

// ── Tab: Pipeline Tracker (placeholder) ──────────────────────────────────────

function PipelineTracker() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 480, gap: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem', opacity: 0.3 }}>🏗</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>Pipeline Tracker</div>
      <div style={{ fontSize: '0.82rem', color: '#1e3a5f', maxWidth: 500, lineHeight: 1.8 }}>
        Project-level demand tracker across India's top segments.
        Each row: Project name · Developer · City · Scale · Estimated kVA · Status · GOEM Coverage.
        Data sources: RERA, JLL, operator IR pages, LLM research prompts.
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {['Data Centers', 'Real Estate', 'Healthcare', 'Telecom', 'Hospitality'].map(s => (
          <span key={s} style={{
            fontSize: '0.68rem', color: '#334155',
            background: 'var(--off-white)',
            border: '1px solid var(--border)',
            padding: '4px 11px', borderRadius: 99,
          }}>{s}</span>
        ))}
      </div>
      <div style={{ fontSize: '0.72rem', color: '#1e2d45', marginTop: 8 }}>
        Building next · Start with Data Centers (most public data) → Real Estate (RERA) → Healthcare
      </div>
    </div>
  )
}

// ── Tab: Gap Analysis (placeholder) ──────────────────────────────────────────

function GapAnalysis() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 480, gap: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem', opacity: 0.3 }}>⚡</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>Gap Analysis</div>
      <div style={{ fontSize: '0.82rem', color: '#1e3a5f', maxWidth: 500, lineHeight: 1.8 }}>
        High-demand geographies with weak KOEL GOEM presence.
        The action list: which cities have announced projects but no reference installations, or a GOEM
        that is not actively working that segment.
      </div>
      <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: 8, maxWidth: 420, lineHeight: 1.7 }}>
        Example output: "6 announced data center projects in Navi Mumbai (18 months) — Jakson covers the
        geography but has zero DC reference installs. Action: push Jakson with KOEL support."
      </div>
      <div style={{ fontSize: '0.72rem', color: '#1e2d45', marginTop: 4 }}>
        Builds on top of Pipeline Tracker + GOEM Territory data · Coming after Pipeline is live
      </div>
    </div>
  )
}

// ── Main Marksight Page ───────────────────────────────────────────────────────

const TABS = [
  { id: 'segments', label: 'Segment Universe',  icon: '◈' },
  { id: 'map',      label: 'India Demand Map',   icon: '🗺' },
  { id: 'pipeline', label: 'Pipeline Tracker',   icon: '📋', soon: true },
  { id: 'gaps',     label: 'Gap Analysis',        icon: '⚡', soon: true },
]

export default function Marksight() {
  const [activeTab, setActiveTab] = useState('segments')
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--off-white)',
      paddingBottom: 'var(--s12)',
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 var(--s6)' }}>

        {/* ── Module header ────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 'var(--s8)', marginBottom: 'var(--s6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    fontSize: '0.68rem', color: '#334155', background: 'transparent',
                    border: '1px solid var(--border)', padding: '3px 10px',
                    borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 4,
                    transition: 'color 150ms, border-color 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#14b8a6'; e.currentTarget.style.borderColor = 'rgba(20,184,166,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  ← Platform
                </button>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 700, color: '#14b8a6',
                  background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)',
                  padding: '2px 8px', borderRadius: 99, letterSpacing: '0.06em',
                }}>
                  NEW MODULE
                </span>
              </div>
              <h1 style={{
                margin: 0, fontSize: '1.6rem', fontWeight: 800,
                color: 'var(--slate)', letterSpacing: '-0.02em',
              }}>
                Marksight
              </h1>
              <p style={{ margin: '5px 0 0', color: '#334155', fontSize: '0.82rem', lineHeight: 1.5 }}>
                Where is the demand · Where is KOEL covered · Where is the gap
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'Segments tracked', value: '12' },
                { label: 'Demand cities', value: `${DEMAND_CITIES.length}` },
                { label: 'GOEM zones', value: `${Object.keys(GOEM_DATA).length - 1}` },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#14b8a6', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#334155', marginTop: 3 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 0,
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 18px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${isActive ? '#14b8a6' : 'transparent'}`,
                  color: isActive ? '#14b8a6' : '#334155',
                  fontSize: '0.78rem', fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'color 150ms, border-color 150ms',
                  marginBottom: -1,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#64748b' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#334155' }}
              >
                <span style={{ fontSize: '0.75rem' }}>{tab.icon}</span>
                {tab.label}
                {tab.soon && (
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 700, color: '#334155',
                    background: 'var(--off-white)',
                    border: '1px solid var(--border)',
                    padding: '1px 5px', borderRadius: 99, letterSpacing: '0.06em',
                  }}>
                    NEXT
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────── */}
        {activeTab === 'segments' && <SegmentUniverse />}
        {activeTab === 'map'      && <IndiaMapTab />}
        {activeTab === 'pipeline' && <PipelineTracker />}
        {activeTab === 'gaps'     && <GapAnalysis />}

      </div>
    </div>
  )
}
