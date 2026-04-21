// ─────────────────────────────────────────────────────────────────────────────
// IndiaMap — India choropleth + bubble map with state→district drill
//
// Props:
//   overlayMode     'goem' | 'demand' | 'none'           default: 'goem'
//   colorMap        { [stateName/districtName]: { fill, stroke } }  optional
//   bubbles         [{ lat, lon, size, color, label, tooltip }]
//   onStateClick    (stateName) => void      — called in India view
//   onDistrictClick (districtName, stateName) => void  — called in drill view
//   onDrillBack     () => void               — called when Back button clicked
//   drillState      string | null            — when set, drills into that state's districts
//   selectedState   string | null            — highlights a state (India view)
//   selectedDistrict string | null           — highlights a district (drill view)
//   height          number                   default: 500
//   showLegend      boolean                  default: true
//   legendItems     [{ color, label }]
//   note            string | null
//
// Drill behaviour:
//   drillState=null  → shows full India states, GOEM overlay, bubbles
//   drillState='Maharashtra' → shows Maharashtra districts, GOEM tint, district tooltips
//   Back button calls onDrillBack — parent manages drillState
//
// GeoJSON caching: both files fetched once, module-level.
// District file (34.5 MB) loads lazily on first drill.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps'
import { GOEM_DATA, STATE_TO_GOEM, DEMAND_CITIES, STATE_CENTROIDS } from '../data/marksightData'

// ── Module-level GeoJSON cache ────────────────────────────────────────────────
const GEO_CACHE = { states: null, districts: null }

// ── State-name aliases (old GADM names → current SoI names) ──────────────────
const STATE_NAME_ALIASES = {
  'Orissa':               'Odisha',
  'Uttaranchal':          'Uttarakhand',
  'Jammu and Kashmir':    'Jammu & Kashmir',
  'Andaman and Nicobar':  'Andaman & Nicobar',
  'Dadra and Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'Daman and Diu':        'Dadra and Nagar Haveli and Daman and Diu',
}
function canonicalName(n) { return STATE_NAME_ALIASES[n] || n }
function featureName(geo)  { return geo?.properties?.ST_NM || geo?.properties?.NAME_1 || '' }
function districtName(geo) { return geo?.properties?.NAME_2 || '' }

function lookupByState(dict, stateName) {
  if (!dict) return undefined
  if (dict[stateName] !== undefined) return dict[stateName]
  const c = canonicalName(stateName)
  if (dict[c] !== undefined) return dict[c]
  for (const [old, modern] of Object.entries(STATE_NAME_ALIASES)) {
    if (modern === stateName && dict[old] !== undefined) return dict[old]
  }
  return undefined
}

function matchesState(featureStateName, drillState) {
  if (!featureStateName || !drillState) return false
  if (featureStateName === drillState) return true
  if (STATE_NAME_ALIASES[featureStateName] === drillState) return true
  if (canonicalName(featureStateName) === canonicalName(drillState)) return true
  return false
}

// ── Per-state drill: zoom factor + geographic centre for ZoomableGroup ────────
const STATE_DRILL = {
  'Andhra Pradesh':    { zoom: 3.0, center: [80.0, 15.5] },
  'Arunachal Pradesh': { zoom: 3.0, center: [94.7, 28.2] },
  'Assam':             { zoom: 3.5, center: [92.8, 26.1] },
  'Bihar':             { zoom: 4.0, center: [85.5, 25.6] },
  'Chandigarh':        { zoom: 12,  center: [76.79, 30.76] },
  'Chhattisgarh':      { zoom: 3.2, center: [81.7, 21.3] },
  'Dadra and Nagar Haveli and Daman and Diu': { zoom: 10, center: [73.0, 20.3] },
  'Delhi':             { zoom: 12,  center: [77.2, 28.6] },
  'Goa':               { zoom: 8.0, center: [74.1, 15.3] },
  'Gujarat':           { zoom: 3.0, center: [71.5, 22.5] },
  'Haryana':           { zoom: 5.5, center: [76.2, 29.2] },
  'Himachal Pradesh':  { zoom: 4.5, center: [77.0, 31.8] },
  'Jammu and Kashmir': { zoom: 2.5, center: [76.5, 34.0] },
  'Jammu & Kashmir':   { zoom: 2.5, center: [76.5, 34.0] },
  'Jharkhand':         { zoom: 4.5, center: [85.3, 23.6] },
  'Karnataka':         { zoom: 3.2, center: [75.8, 14.8] },
  'Kerala':            { zoom: 4.5, center: [76.3, 10.4] },
  'Ladakh':            { zoom: 2.2, center: [78.0, 34.5] },
  'Lakshadweep':       { zoom: 6.0, center: [73.3, 12.2] },
  'Madhya Pradesh':    { zoom: 2.8, center: [78.0, 23.5] },
  'Maharashtra':       { zoom: 3.0, center: [75.7, 19.0] },
  'Manipur':           { zoom: 6.5, center: [93.9, 24.8] },
  'Meghalaya':         { zoom: 6.0, center: [91.4, 25.5] },
  'Mizoram':           { zoom: 6.0, center: [92.9, 23.2] },
  'Nagaland':          { zoom: 6.5, center: [94.4, 26.2] },
  'Odisha':            { zoom: 3.5, center: [84.7, 20.4] },
  'Orissa':            { zoom: 3.5, center: [84.7, 20.4] },
  'Puducherry':        { zoom: 10,  center: [79.81, 11.94] },
  'Punjab':            { zoom: 5.0, center: [75.5, 31.2] },
  'Rajasthan':         { zoom: 2.5, center: [73.9, 26.8] },
  'Sikkim':            { zoom: 9.0, center: [88.5, 27.5] },
  'Tamil Nadu':        { zoom: 3.5, center: [78.5, 10.8] },
  'Telangana':         { zoom: 4.0, center: [79.2, 17.5] },
  'Tripura':           { zoom: 7.0, center: [91.7, 23.7] },
  'Uttar Pradesh':     { zoom: 2.8, center: [80.8, 27.0] },
  'Uttarakhand':       { zoom: 4.5, center: [79.3, 30.1] },
  'Uttaranchal':       { zoom: 4.5, center: [79.3, 30.1] },
  'West Bengal':       { zoom: 3.5, center: [87.5, 23.3] },
  'Andaman and Nicobar': { zoom: 2.5, center: [92.6, 11.7] },
  'Andaman & Nicobar':   { zoom: 2.5, center: [92.6, 11.7] },
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ x, y, content }) {
  if (!content) return null
  return (
    <div style={{
      position: 'fixed', left: x + 14, top: y - 10,
      background: '#0f1f38',
      border: '1px solid rgba(20,184,166,0.3)',
      borderRadius: 8, padding: '8px 12px',
      pointerEvents: 'none', zIndex: 9999, maxWidth: 260,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      {content}
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend({ items }) {
  if (!items?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 8 }}>
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--gray)', lineHeight: 1 }}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default memo(function IndiaMap({
  overlayMode     = 'goem',
  colorMap        = null,
  bubbles         = null,
  onStateClick    = null,
  onDistrictClick = null,
  onDrillBack     = null,
  drillState      = null,
  selectedState   = null,
  selectedDistrict = null,
  height          = 500,
  showLegend      = true,
  legendItems     = null,
  note            = null,
  mapLevel        = 'states',   // legacy — still accepted
}) {
  const [statesData,      setStatesData]      = useState(GEO_CACHE.states)
  const [districtsData,   setDistrictsData]   = useState(GEO_CACHE.districts)
  const [statesLoading,   setStatesLoading]   = useState(!GEO_CACHE.states)
  const [districtLoading, setDistrictLoading] = useState(false)
  const [statesError,     setStatesError]     = useState(null)
  const [tooltip,         setTooltip]         = useState({ x: 0, y: 0, content: null })
  const [resetKey,        setResetKey]        = useState(0)
  const mouseDownPos = useRef(null)

  const isDrilling = Boolean(drillState)
  const drillCfg   = drillState
    ? (STATE_DRILL[drillState] || STATE_DRILL[canonicalName(drillState)] || null)
    : null
  const mapZoom   = isDrilling && drillCfg ? drillCfg.zoom   : 1
  const mapCenter = isDrilling && drillCfg ? drillCfg.center : [82.5, 22]
  const maxZoom   = isDrilling ? 20 : 8

  // ── Load states on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (GEO_CACHE.states) { setStatesData(GEO_CACHE.states); setStatesLoading(false); return }
    fetch('/india-states.geojson')
      .then(r => { if (!r.ok) throw new Error('Failed to load states GeoJSON'); return r.json() })
      .then(d => { GEO_CACHE.states = d; setStatesData(d); setStatesLoading(false) })
      .catch(e => { setStatesError(e.message); setStatesLoading(false) })
  }, [])

  // ── Reset zoom when drill state changes ──────────────────────────────────
  useEffect(() => { setResetKey(k => k + 1) }, [drillState])

  // ── Load districts lazily on first drill ─────────────────────────────────
  useEffect(() => {
    if (!drillState) return
    if (GEO_CACHE.districts) { setDistrictsData(GEO_CACHE.districts); return }
    setDistrictLoading(true)
    fetch('/india-districts.geojson')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => { GEO_CACHE.districts = d; setDistrictsData(d); setDistrictLoading(false) })
      .catch(() => setDistrictLoading(false))
  }, [drillState])

  // ── Active GeoJSON ────────────────────────────────────────────────────────
  const activeGeoData = useMemo(() => {
    if (!isDrilling) return statesData
    if (!districtsData) return null
    return {
      ...districtsData,
      features: districtsData.features.filter(f =>
        matchesState(f.properties?.NAME_1 || '', drillState)
      ),
    }
  }, [isDrilling, statesData, districtsData, drillState])

  // ── GOEM for drilled state ────────────────────────────────────────────────
  const drillGoem = useMemo(() => {
    if (!drillState) return null
    const id = lookupByState(STATE_TO_GOEM, drillState)
    return id ? GOEM_DATA[id] : null
  }, [drillState])

  // ── Feature style ─────────────────────────────────────────────────────────
  const getFeatureStyle = useCallback((geo) => {
    const name = featureName(geo)

    if (isDrilling) {
      const dName = districtName(geo)
      const isSel = selectedDistrict && dName === selectedDistrict
      const base  = drillGoem ? drillGoem.color + '2a' : '#e2e8f0'
      const hover = drillGoem ? drillGoem.color + '55' : 'rgba(20,184,166,0.2)'
      const stroke = drillGoem ? drillGoem.color + '77' : '#94a3b8'
      return {
        default: { fill: isSel ? '#14b8a6' : base,  stroke, strokeWidth: 0.5, outline: 'none' },
        hover:   { fill: hover, stroke: drillGoem?.color || '#14b8a6', strokeWidth: 1.2, outline: 'none' },
        pressed: { fill: '#0d9488', stroke: '#0d9488', strokeWidth: 1, outline: 'none' },
      }
    }

    const isSel = selectedState && selectedState === name

    if (colorMap) {
      const c = lookupByState(colorMap, name)
      if (c) return {
        default: { fill: isSel ? '#14b8a6' : c.fill, stroke: '#1e3a5f', strokeWidth: 0.4, outline: 'none' },
        hover:   { fill: c.hover || '#14b8a6', stroke: '#14b8a6', strokeWidth: 1, outline: 'none' },
        pressed: { fill: '#0d9488', stroke: '#0d9488', strokeWidth: 1, outline: 'none' },
      }
    }

    if (overlayMode === 'goem') {
      const goemId = lookupByState(STATE_TO_GOEM, name)
      const goem   = goemId ? GOEM_DATA[goemId] : null
      const fill   = isSel ? '#14b8a6' : goem ? goem.color + '55' : '#edf2f7'
      const stroke = isSel ? '#14b8a6' : goem ? goem.color + 'aa' : '#c4cdd4'
      return {
        default: { fill, stroke, strokeWidth: 0.6, outline: 'none' },
        hover:   { fill: goem ? goem.color + '66' : 'rgba(20,184,166,0.2)', stroke: goem?.color || '#14b8a6', strokeWidth: 1, outline: 'none' },
        pressed: { fill: '#0d9488', stroke: '#0d9488', strokeWidth: 1, outline: 'none' },
      }
    }

    if (overlayMode === 'demand') {
      const score = DEMAND_CITIES.filter(c => c.state === name).reduce((a, c) => a + c.demandScore, 0)
      const alpha = Math.floor(Math.min(score / 12, 1) * 180).toString(16).padStart(2, '0')
      const fill  = isSel ? '#14b8a6' : `#0ea5e9${alpha}`
      return {
        default: { fill, stroke: '#1e3a5f', strokeWidth: 0.4, outline: 'none' },
        hover:   { fill: '#0ea5e9aa', stroke: '#14b8a6', strokeWidth: 1, outline: 'none' },
        pressed: { fill: '#0d9488', stroke: '#0d9488', strokeWidth: 1, outline: 'none' },
      }
    }

    return {
      default: { fill: isSel ? '#14b8a6' : '#edf2f7', stroke: '#c4cdd4', strokeWidth: 0.4, outline: 'none' },
      hover:   { fill: 'rgba(20,184,166,0.2)', stroke: '#14b8a6', strokeWidth: 1, outline: 'none' },
      pressed: { fill: '#0d9488', stroke: '#0d9488', strokeWidth: 1, outline: 'none' },
    }
  }, [isDrilling, overlayMode, colorMap, selectedState, selectedDistrict, drillGoem])

  // ── Tooltip content ───────────────────────────────────────────────────────
  const buildTooltip = useCallback((geo) => {
    const name = featureName(geo)

    if (isDrilling) {
      const dName = districtName(geo)
      return (
        <div>
          <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.82rem', marginBottom: 2 }}>{dName || name}</div>
          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{drillState}</div>
          {drillGoem && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: drillGoem.color }} />
              <span style={{ fontSize: '0.68rem', color: drillGoem.color, fontWeight: 600 }}>{drillGoem.name} GOEM</span>
            </div>
          )}
          <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 4 }}>Click for district detail</div>
        </div>
      )
    }

    if (overlayMode === 'goem') {
      const goemId = lookupByState(STATE_TO_GOEM, name)
      const goem   = goemId ? GOEM_DATA[goemId] : null
      return (
        <div>
          <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.82rem', marginBottom: 4 }}>{name}</div>
          {goem ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: goem.color, flexShrink: 0 }} />
                <span style={{ color: goem.color, fontWeight: 600, fontSize: '0.75rem' }}>{goem.name}</span>
              </div>
              {!goem.verified && <div style={{ fontSize: '0.62rem', color: '#f59e0b', marginTop: 2 }}>⚠ Not officially verified</div>}
            </>
          ) : (
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>GOEM assignment unknown</div>
          )}
          <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 5 }}>Click → district view</div>
        </div>
      )
    }

    if (overlayMode === 'demand') {
      const cities = DEMAND_CITIES.filter(c => c.state === name)
      return (
        <div>
          <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.82rem', marginBottom: 4 }}>{name}</div>
          {cities.length > 0
            ? cities.map(c => (
                <div key={c.id} style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 2 }}>
                  <span style={{ color: '#14b8a6', fontWeight: 600 }}>{c.name}</span> — {c.demandScore}/10
                </div>
              ))
            : <div style={{ fontSize: '0.72rem', color: '#475569' }}>No tracked hotspots</div>
          }
          <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 5 }}>Click → district view</div>
        </div>
      )
    }

    return <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.82rem' }}>{name}</div>
  }, [isDrilling, overlayMode, drillState, drillGoem])

  // ── Click dispatcher ──────────────────────────────────────────────────────
  const handleClick = useCallback((geo, e) => {
    const pos = mouseDownPos.current
    const isDrag = pos && (Math.abs(e.clientX - pos.x) >= 6 || Math.abs(e.clientY - pos.y) >= 6)
    mouseDownPos.current = null
    if (isDrag) return
    if (isDrilling) {
      onDistrictClick?.(districtName(geo), drillState)
    } else {
      onStateClick?.(featureName(geo))
    }
  }, [isDrilling, onStateClick, onDistrictClick, drillState])

  // ── Bubbles — filter to drilled state in drill view ──────────────────────
  const activeBubbles = useMemo(() => {
    let list = bubbles || []
    if (!list.length && !isDrilling && overlayMode === 'demand') {
      list = DEMAND_CITIES.map(c => ({
        lat: c.lat, lon: c.lon, size: c.demandScore * 2.5,
        color: '#14b8a6', label: c.name,
        tooltip: `${c.name}\nDemand: ${c.demandScore}/10`,
      }))
    }
    // In drill view: only show bubbles belonging to the drilled state
    if (isDrilling && drillState) {
      list = list.filter(b =>
        !b.stateName || b.stateName === drillState || canonicalName(b.stateName) === drillState
      )
    }
    return list
  }, [bubbles, overlayMode, isDrilling, drillState])

  // ── Legend items ──────────────────────────────────────────────────────────
  const computedLegend = useMemo(() => {
    if (legendItems) return legendItems
    if (isDrilling) return drillGoem ? [{ color: drillGoem.color + '55', label: `${drillGoem.name} GOEM territory` }] : []
    if (overlayMode === 'goem') {
      return Object.values(GOEM_DATA)
        .filter(g => g.states?.length > 0)
        .map(g => ({ color: g.color, label: g.name }))
    }
    if (overlayMode === 'demand') {
      return [
        { color: '#0ea5e9cc', label: 'High demand concentration' },
        { color: '#0ea5e922', label: 'Low / untracked' },
      ]
    }
    return []
  }, [legendItems, isDrilling, drillGoem, overlayMode])

  // Show loading overlay if: states not ready, OR drilling but districts not yet loaded
  // (do NOT rely on districtLoading flag — there's a render gap before the effect sets it)
  const isLoading = statesLoading || (isDrilling && !districtsData)
  const loadMsg   = (isDrilling && !districtsData) ? `Loading ${drillState} districts…` : 'Loading map…'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%' }}>

      {/* Back button + state pill — shown in drill mode */}
      {isDrilling && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button
            onClick={onDrillBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: '0.7rem', fontWeight: 700, color: '#334155',
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid var(--border)', borderRadius: 99,
              padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'color 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#14b8a6'}
            onMouseLeave={e => e.currentTarget.style.color = '#334155'}
          >
            ← India
          </button>
          <span style={{
            fontSize: '0.68rem', fontWeight: 700,
            color: drillGoem ? drillGoem.color : '#334155',
            background: 'rgba(255,255,255,0.95)',
            border: `1px solid ${drillGoem ? drillGoem.color + '44' : 'var(--border)'}`,
            borderRadius: 99, padding: '4px 11px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            {drillState}{drillGoem ? ` · ${drillGoem.name}` : ''}
          </span>
        </div>
      )}

      {/* Reset zoom — bottom-right, shown in drill view */}
      {isDrilling && (
        <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{
            background: 'rgba(255,255,255,0.92)', border: '1px solid var(--border)',
            borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: '0.52rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', padding: '4px 6px', borderBottom: '1px solid var(--border)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Scroll to zoom
            </div>
            <button
              onClick={() => setResetKey(k => k + 1)}
              title="Reset zoom to default"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                fontSize: '0.6rem', fontWeight: 700, color: '#334155',
                background: 'transparent', border: 'none',
                padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 150ms, background 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#14b8a6'; e.currentTarget.style.background = 'rgba(20,184,166,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v4h4M15 12v-4h-4"/>
                <path d="M14.5 9A6.5 6.5 0 1 1 12 3.5"/>
              </svg>
              Reset view
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div style={{
        height,
        background: isDrilling ? 'rgba(248,250,252,0.6)' : 'transparent',
        borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--border)',
        position: 'relative',
      }}>
        {/* Loading overlay */}
        {isLoading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            background: 'rgba(248,250,252,0.9)', zIndex: 5,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid rgba(20,184,166,0.2)',
              borderTopColor: '#14b8a6',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ color: 'var(--gray)', fontSize: '0.78rem' }}>{loadMsg}</div>
            {districtLoading && (
              <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                34 MB district file — caches after first load
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {statesError && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#dc2626', fontSize: '0.82rem', textAlign: 'center' }}>
              ⚠ Failed to load map<br />
              <span style={{ color: '#475569', fontSize: '0.7rem' }}>{statesError}</span>
            </div>
          </div>
        )}

        {/* Map */}
        {!statesLoading && !statesError && (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 820, center: [82.5, 20] }}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomableGroup
              key={`zg-${resetKey}`}
              zoom={mapZoom}
              center={mapCenter}
              maxZoom={maxZoom}
              minZoom={1}
              onMoveEnd={() => {}}
            >
              {/* States or filtered districts */}
              {activeGeoData && (
                <Geographies geography={activeGeoData}>
                  {({ geographies }) =>
                    geographies.map(geo => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={getFeatureStyle(geo)}
                        onMouseDown={e => { mouseDownPos.current = { x: e.clientX, y: e.clientY } }}
                        onClick={e => handleClick(geo, e)}
                        onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, content: buildTooltip(geo) })}
                        onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                        onMouseLeave={() => setTooltip(t => ({ ...t, content: null }))}
                      />
                    ))
                  }
                </Geographies>
              )}

              {/* GOEM name labels on states (India view only) */}
              {!isDrilling && overlayMode === 'goem' && Object.entries(STATE_CENTROIDS).map(([sName, { lat, lon }]) => {
                const goemId = lookupByState(STATE_TO_GOEM, sName)
                const goem   = goemId ? GOEM_DATA[goemId] : null
                if (!goem) return null
                const skip = ['Goa','Sikkim','Delhi','Chandigarh','Lakshadweep',
                  'Andaman and Nicobar','Andaman & Nicobar','Puducherry',
                  'Dadra and Nagar Haveli','Daman and Diu',
                  'Dadra and Nagar Haveli and Daman and Diu']
                if (skip.includes(sName)) return null
                return (
                  <Marker key={`sl-${sName}`} coordinates={[lon, lat]}>
                    <text
                      textAnchor="middle"
                      style={{
                        fontFamily: 'inherit', fontSize: 9, fontWeight: 700,
                        fill: goem.color, pointerEvents: 'none',
                        opacity: 0.9, letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}
                    >
                      {goem.name}
                    </text>
                  </Marker>
                )
              })}

              {/* District labels — only in drill mode and when not too many features */}
              {isDrilling && activeGeoData?.features &&
                activeGeoData.features.length <= 75 &&
                activeGeoData.features.map((f, i) => {
                  const coords = f.geometry?.type === 'Polygon'
                    ? f.geometry.coordinates[0]
                    : f.geometry?.type === 'MultiPolygon'
                    ? f.geometry.coordinates[0][0] : null
                  if (!coords?.length) return null
                  const lon = coords.reduce((s, c) => s + c[0], 0) / coords.length
                  const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
                  const dName = districtName(f)
                  if (!dName) return null
                  return (
                    <Marker key={`dl-${i}`} coordinates={[lon, lat]}>
                      <text
                        textAnchor="middle"
                        style={{
                          fontFamily: 'inherit', fontSize: Math.max(1.2, 5 / mapZoom), fontWeight: 600,
                          fill: drillGoem ? drillGoem.color : '#334155',
                          pointerEvents: 'none', opacity: 0.8,
                        }}
                      >
                        {dName}
                      </text>
                    </Marker>
                  )
                })
              }

              {/* Bubbles */}
              {activeBubbles.map((b, i) => (
                <Marker key={i} coordinates={[b.lon, b.lat]}>
                  <circle
                    r={Math.max(1.5, b.size / mapZoom)}
                    fill={b.color || '#14b8a6'} fillOpacity={0.6}
                    stroke={b.color || '#14b8a6'} strokeWidth={1} strokeOpacity={0.9}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={e => {
                      const lines = (b.tooltip || b.label || '').split('\n')
                      setTooltip({
                        x: e.clientX, y: e.clientY,
                        content: (
                          <div>
                            {lines.map((l, j) => (
                              <div key={j} style={{
                                fontSize: j === 0 ? '0.78rem' : '0.68rem',
                                fontWeight: j === 0 ? 700 : 400,
                                color: j === 0 ? '#f1f5f9' : '#94a3b8',
                                marginBottom: j === 0 ? 3 : 1,
                              }}>{l}</div>
                            ))}
                          </div>
                        ),
                      })
                    }}
                    onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                    onMouseLeave={() => setTooltip(t => ({ ...t, content: null }))}
                  />
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        )}
      </div>

      {showLegend && <Legend items={computedLegend} />}

      {note && (
        <div style={{ marginTop: 8, fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5 }}>
          ⚠ {note}
        </div>
      )}

      <Tooltip x={tooltip.x} y={tooltip.y} content={tooltip.content} />
    </div>
  )
})
