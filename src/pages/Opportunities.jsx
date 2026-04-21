// ─────────────────────────────────────────────────────────────────────────────
// Opportunities — Project-level demand tracker × GOEM coverage × gap map
// Layout: full-width India map (drill on click) → project table below
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import IndiaMap from '../components/IndiaMap'
import { GOEM_DATA } from '../data/marksightData'

import dcData from '../data/opportunities/data_centers.json'
import DCIntelligence from '../components/DCIntelligence'


// ── Segment tabs ───────────────────────────────────────────────────────────────
const SEGMENT_TABS = [
  { id: 'data_centers', label: 'Data Centers', icon: '🏢', data: dcData, accent: '#0d9488' },
  { id: 'real_estate',  label: 'Real Estate',  icon: '🏗',  data: null, accent: '#2563eb',  soon: true },
  { id: 'healthcare',   label: 'Healthcare',   icon: '🏥', data: null, accent: '#dc2626',  soon: true },
  { id: 'telecom',      label: 'Telecom',      icon: '📡', data: null, accent: '#7c3aed',  soon: true },
  { id: 'hospitality',  label: 'Hospitality',  icon: '🏨', data: null, accent: '#b45309',  soon: true },
  { id: 'infra',        label: 'Infrastructure', icon: '🔧', data: null, accent: '#475569', soon: true },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtKva(kva) {
  if (!kva) return '—'
  if (kva >= 100000) return `${(kva / 1000).toFixed(0)} GVA`
  if (kva >= 1000)   return `${(kva / 1000).toFixed(0)}k kVA`
  return `${kva} kVA`
}

function goemForState(state) {
  for (const [id, goem] of Object.entries(GOEM_DATA)) {
    if (goem.states && goem.states.includes(state)) return id
  }
  return null
}

// ── Gap summary strip ──────────────────────────────────────────────────────────
function GapStrip({ projects }) {
  const open    = projects.filter(p => p.koelOpportunity === 'open')
  const openKva = open.reduce((s, p) => s + (p.gensetKvaEstimate || 0), 0)
  const counts  = {}
  open.forEach(p => { counts[p.state] = (counts[p.state] || 0) + 1 })
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0]
  const topGoem = top ? goemForState(top[0]) : null
  const topGoemName = topGoem && GOEM_DATA[topGoem] ? GOEM_DATA[topGoem].name : null
  if (!open.length) return null

  return (
    <div style={{
      background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.18)',
      borderRadius: 10, padding: '12px 20px', marginBottom: 18,
      display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#0d9488', boxShadow: '0 0 0 3px rgba(13,148,136,0.2)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0d9488' }}>{open.length} open {open.length === 1 ? 'opportunity' : 'opportunities'}</div>
          <div style={{ fontSize: '0.6rem', color: '#475569', marginTop: 1 }}>Genset OEM not yet awarded — specs not locked</div>
        </div>
      </div>
      <div style={{ width: 1, height: 26, background: 'rgba(13,148,136,0.15)' }} />
      <div>
        <div style={{ fontSize: '0.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Total kVA addressable</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0d9488', fontFamily: 'var(--font-mono)' }}>{fmtKva(openKva)}</div>
      </div>
      {top && (
        <>
          <div style={{ width: 1, height: 26, background: 'rgba(13,148,136,0.15)' }} />
          <div>
            <div style={{ fontSize: '0.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Highest concentration</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate)' }}>
              {top[0]} · {top[1]} projects{topGoemName && <span style={{ color: '#64748b', fontWeight: 500 }}> · {topGoemName}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}


// ── Coming Soon ────────────────────────────────────────────────────────────────
function ComingSoon({ segment }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', opacity: 0.25 }}>{segment.icon}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>{segment.label}</div>
      <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: 380, lineHeight: 1.7 }}>
        Project data for this segment is being sourced.
        {segment.id === 'real_estate'  && ' Source: MahaRERA / KaRERA + developer IR.'}
        {segment.id === 'healthcare'   && ' Source: PM-JAY list + NABH + hospital chain IR.'}
        {segment.id === 'telecom'      && ' Source: Indus Towers AR + TRAI 5G rollout.'}
        {segment.id === 'hospitality'  && ' Source: HVS India Hotel Survey + brand pipeline.'}
        {segment.id === 'infra'        && ' Source: MoCA + NHAI + Ministry of Railways.'}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Opportunities() {
  const navigate = useNavigate()
  const [activeTab,        setActiveTab]        = useState('data_centers')
  const [drillState,       setDrillState]       = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)

  const segment     = SEGMENT_TABS.find(t => t.id === activeTab)
  const rawProjects = segment?.data?.projects || []

  const projects = useMemo(() => rawProjects.map(p => ({
    ...p, _goem: goemForState(p.state),
  })), [rawProjects])

  // Map bubbles — project pins colored by KOEL fit
  const bubbles = useMemo(() => projects.map(p => ({
    lat:      p.lat, lon: p.lon,
    stateName: p.state,
    size: p.gensetKvaEstimate > 100000 ? 14 : p.gensetKvaEstimate > 50000 ? 10 : p.gensetKvaEstimate > 25000 ? 8 : 6,
    color: p.koelOpportunity === 'open' ? '#0d9488'
         : p.koelOpportunity === 'unlikely' ? '#dc2626' : '#94a3b8',
    label:   p.projectName,
    tooltip: `${p.projectName}\n${p.developer}\n${fmtKva(p.gensetKvaEstimate)} DG`,
  })), [projects])

  // Stats
  const openCount = projects.filter(p => p.koelOpportunity === 'open').length
  const totalMw   = projects.reduce((s,p) => s + (p.mwItLoad||0), 0)
  const openKva   = projects.filter(p => p.koelOpportunity === 'open').reduce((s,p) => s + (p.gensetKvaEstimate||0), 0)

  function handleStateClick(name) {
    setDrillState(name)
    setSelectedDistrict(null)
  }
  function handleDrillBack() {
    setDrillState(null)
    setSelectedDistrict(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', paddingBottom: 'var(--s12)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 var(--s6)' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ paddingTop: 'var(--s8)', marginBottom: 'var(--s5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <button
              onClick={() => navigate('/')}
              style={{ fontSize: '0.68rem', color: '#334155', background: 'transparent', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0d9488'; e.currentTarget.style.borderColor = 'rgba(13,148,136,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              ← Platform
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate)', letterSpacing: '-0.02em' }}>Opportunities</h1>
              <p style={{ margin: '5px 0 0', color: '#475569', fontSize: '0.82rem' }}>Announced projects × GOEM coverage × where to push</p>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
              {[
                { label: 'DC projects tracked', value: String(projects.length) },
                { label: 'MW IT load tracked',  value: totalMw > 0 ? `${totalMw} MW` : '—' },
                { label: 'Open opportunities',  value: String(openCount), hi: true },
                { label: 'Addressable kVA',     value: fmtKva(openKva), hi: true },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1, color: s.hi ? '#0d9488' : 'var(--slate)', fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.58rem', color: '#64748b', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Segment tabs ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {SEGMENT_TABS.map(tab => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setDrillState(null); setSelectedDistrict(null) }}
                style={{
                  padding: '10px 16px', background: 'transparent', border: 'none',
                  borderBottom: `2px solid ${isActive ? (tab.accent || '#0d9488') : 'transparent'}`,
                  color: isActive ? (tab.accent || '#0d9488') : '#475569',
                  fontSize: '0.75rem', fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'color 150ms, border-color 150ms', marginBottom: -1, whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: '0.72rem' }}>{tab.icon}</span>
                {tab.label}
                {tab.soon && (
                  <span style={{ fontSize: '0.52rem', fontWeight: 700, color: '#94a3b8', background: 'var(--off-white)', border: '1px solid var(--border)', padding: '1px 5px', borderRadius: 99 }}>SOON</span>
                )}
                {!tab.soon && tab.data && (
                  <span style={{ fontSize: '0.58rem', fontWeight: 800, color: isActive ? '#0d9488' : '#94a3b8', background: isActive ? 'rgba(13,148,136,0.1)' : 'var(--off-white)', border: `1px solid ${isActive ? 'rgba(13,148,136,0.2)' : 'var(--border)'}`, padding: '1px 6px', borderRadius: 99, marginLeft: 2 }}>
                    {tab.data.projects?.length || 0}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab content ─────────────────────────────────────────────────── */}
        {segment?.soon && <ComingSoon segment={segment} />}

        {!segment?.soon && (
          <>
            {/* Gap strip */}
            <GapStrip projects={projects} />

            {/* ── Hero map — full width ──────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <IndiaMap
                overlayMode="goem"
                bubbles={bubbles}
                drillState={drillState}
                selectedDistrict={selectedDistrict}
                height={580}
                onStateClick={handleStateClick}
                onDistrictClick={d => setSelectedDistrict(x => x === d ? null : d)}
                onDrillBack={handleDrillBack}
                showLegend={false}
                note={null}
              />

              {/* Map legend row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px 18px', flexWrap: 'wrap', marginTop: 10 }}>
                {/* Project pins legend */}
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>Projects:</span>
                {[{ color: '#0d9488', label: 'Open' }, { color: '#dc2626', label: 'Unlikely' }, { color: '#94a3b8', label: 'Unknown' }].map(i => (
                  <span key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', color: '#475569' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: i.color }} />{i.label}
                  </span>
                ))}
                <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 4px' }} />
                {/* GOEM territory legend */}
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>GOEM:</span>
                {Object.values(GOEM_DATA).filter(g => g.states?.length).map(g => (
                  <span key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: g.color + 'aa', border: `1px solid ${g.color}`, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#334155' }}>{g.name}</span>
                    <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>· {g.hq}</span>
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: '#94a3b8' }}>
                  {drillState ? `${drillState} · click districts · ← India to zoom out` : 'Click any state → district view'}
                </span>
              </div>
            </div>

            {/* ── DC deep-dive section (market data, charts, sources, GOEM exposure) */}
            {activeTab === 'data_centers' && <DCIntelligence />}
          </>
        )}
      </div>
    </div>
  )
}
