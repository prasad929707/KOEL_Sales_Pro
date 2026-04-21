// CompareModule.jsx — Shared competitor comparison component
// Works in both BD Center and Kirloskar Sales Pro.
// Reads spec data from Supabase `competitor_specs` table.
// Same visual style as existing Compare.jsx (Sales Pro).

import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// ── Constants ─────────────────────────────────────────────────────────────
const KVA_RATINGS = [
  7.5, 10, 15, 20, 25, 30, 40, 58.5,
  82.5, 100, 125, 160, 200, 250, 320,
  400, 500, 625, 750, 1010, 1250, 1500,
]

const BRAND_ORDER = [
  'Cummins', 'Greaves', 'Ashok Leyland', 'Mahindra', 'Eicher', 'Baudouin', 'Caterpillar',
]

const BRAND_URLS = {
  'KOEL':          'https://www.kirloskargensets.com/products/diesel-generators/',
  'Cummins':       'https://www.cumminsindia.com/power-generation/generators/diesel-generators',
  'Greaves':       'https://www.greavescotton.com/products/gen-set-engines/',
  'Ashok Leyland': 'https://www.ashokleyland.com/power/diesel-generator-sets/',
  'Mahindra':      'https://www.mahindrapowerol.com/',
  'Eicher':        'https://www.eicher.in/generators/',
  'Baudouin':      'https://www.moteurs-baudouin.com/en/gas-diesel-engines-generators/',
  'Caterpillar':   'https://www.cat.com/en_IN/products/new/power-systems/electric-power-generation.html',
}

// ── Spec rows (marketing priority: KOEL strengths first) ──────────────────
const SPEC_ROWS = [
  { section: 'Key Performance' },
  { key: 'certified_power_bhp',    label: 'Certified Engine Power',      unit: 'bhp', higher: true,
    remark: 'Higher HP means the engine runs well within its rated capacity — longer life and better block loading.' },
  { key: 'displacement_litres',    label: 'Engine Displacement',         unit: 'L',   higher: true,
    remark: 'More displacement = lower specific load at rated output → less wear per hour.' },
  { key: 'block_loading_pct',      label: 'Block Loading Capacity',      unit: '%',   higher: true,
    remark: 'Higher block loading % means the set can handle sudden large load changes without stalling.' },
  { key: 'std_fuel_tank_litres',   label: 'Standard Fuel Tank',          unit: 'L',   higher: true,
    remark: 'Larger tank = more continuous runtime between refills — critical for data centres and hospitals.' },
  { key: 'fuel_cons_100pct_lph',   label: 'Fuel Consumption @ 100%',    unit: 'L/hr', higher: false,
    remark: 'Lower fuel consumption at full load means lower operating cost over the genset lifetime.' },
  { key: 'fuel_cons_75pct_lph',    label: 'Fuel Consumption @ 75%',     unit: 'L/hr', higher: false },
  { key: 'fuel_cons_50pct_lph',    label: 'Fuel Consumption @ 50%',     unit: 'L/hr', higher: false },
  { key: 'service_interval',       label: 'Service Interval',            unit: '',     higher: false,
    remark: 'KOEL: 500 hrs / 12 months. Longer intervals mean lower annual maintenance cost and less downtime.' },
  { key: 'sound_level_db',         label: 'Noise Level',                 unit: '',     higher: false,
    remark: 'KOEL noise is measured at 100% load. Cummins specifies noise at 75% — a lighter operating point.' },

  { section: 'Engine Specification' },
  { key: 'engine_make',            label: 'Engine Make',                 unit: '' },
  { key: 'engine_model',           label: 'Engine Model',                unit: '' },
  { key: 'aspiration',             label: 'Aspiration',                  unit: '' },
  { key: 'num_cylinders',          label: 'No. of Cylinders',            unit: '',    higher: true },
  { key: 'cylinder_config',        label: 'Cylinder Configuration',      unit: '' },
  { key: 'bore_stroke',            label: 'Bore × Stroke',               unit: 'mm',  special: 'bore_stroke' },
  { key: 'compression_ratio',      label: 'Compression Ratio',           unit: '' },
  { key: 'performance_class',      label: 'Performance Class',           unit: '' },
  { key: 'starting_system',        label: 'Starting System',             unit: '' },
  { key: 'lube_oil_spec',          label: 'Lube Oil Specification',      unit: '',
    remark: 'K-Oil Premium (KOEL proprietary) is ~50% cheaper than equivalent competitor oils — significant long-term TCO saving.' },
  { key: 'lube_oil_sump_litres',   label: 'Lube Oil Sump',              unit: 'L',   higher: false },
  { key: 'coolant_capacity_litres',label: 'Coolant Capacity',            unit: 'L',   higher: false },
  { key: 'def_tank_litres',        label: 'DEF / AdBlue Tank',           unit: 'L',   higher: true,
    remark: 'Larger DEF tank reduces refill frequency — important for sites with restricted access windows.' },

  { section: 'Genset Dimensions & Weight' },
  { key: 'length_mm',              label: 'Length',                      unit: 'mm',  higher: false },
  { key: 'width_mm',               label: 'Width',                       unit: 'mm',  higher: false },
  { key: 'height_mm',              label: 'Height',                      unit: 'mm',  higher: false },
  { key: 'wet_weight_kg',          label: 'Wet Weight',                  unit: 'kg',  higher: false },

  { section: 'Controls & Governing' },
  { key: 'governing_system',       label: 'Governing System',            unit: '',
    remark: 'Electronic governor is maintenance-free and delivers better fuel efficiency across speed/load.' },
  { key: 'genset_controller',      label: 'Genset Controller',           unit: '' },
  { key: 'frequency_hz',           label: 'Frequency',                   unit: 'Hz' },
  { key: 'voltage_v',              label: 'Voltage',                     unit: 'V' },

  { section: 'Alternator' },
  { key: 'alternator_make',        label: 'Alternator Make',             unit: '',
    remark: 'KOEL uses its own alternator — one warranty, one service team, no finger-pointing during breakdowns.' },
  { key: 'alternator_efficiency_pct', label: 'Alternator Efficiency',   unit: '%',   higher: true,
    remark: 'Higher efficiency = more usable power per litre of fuel. Competitors often do not declare this figure.' },
  { key: 'insulation_class',       label: 'Insulation Class',            unit: '' },

  { section: 'Exhaust Systems' },
  { key: 'after_treatment',        label: 'After Treatment System',      unit: '' },
  { key: 'fuel_injection',         label: 'Fuel Injection System',       unit: '' },
  { key: 'silencer_location',      label: 'Silencer Location',           unit: '',
    remark: 'Outside canopy silencer (KOEL) vs inside canopy (some competitors) — easier maintenance access.' },
  { key: 'exhaust_pipe_size_inches',label: 'Exhaust Pipe Size',          unit: 'in',  higher: true },
  { key: 'mean_piston_speed_ms',   label: 'Mean Piston Speed',           unit: 'm/s', higher: false },
  { key: 'exhaust_temp_celsius',   label: 'Exhaust Temperature',         unit: '°C',  higher: false },

  { section: 'Engine Dimensions' },
  { key: 'engine_length_mm',       label: 'Engine Length',               unit: 'mm',  higher: false },
  { key: 'engine_width_mm',        label: 'Engine Width',                unit: 'mm',  higher: false },
  { key: 'engine_height_mm',       label: 'Engine Height',               unit: 'mm',  higher: false },
]

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (v, unit = '') => {
  if (v == null || v === '') return '—'
  return unit ? `${v} ${unit}` : String(v)
}

const getVal = (spec, key) => {
  if (key === 'bore_stroke') {
    if (spec?.bore_mm && spec?.stroke_mm) return `${spec.bore_mm} × ${spec.stroke_mm}`
    return null
  }
  return spec?.[key] ?? null
}

const compareVals = (koelVal, compVal, higher) => {
  if (koelVal == null || compVal == null) return 'neutral'
  const kn = parseFloat(String(koelVal))
  const cn = parseFloat(String(compVal))
  if (isNaN(kn) || isNaN(cn) || kn === cn) return 'neutral'
  return (higher ? kn > cn : kn < cn) ? 'koel' : 'comp'
}

// ── Styles (inline, no CSS dependency) ────────────────────────────────────
const C = {
  teal:   '#007B7F',
  dark:   '#003D40',
  win:    '#d1fae5',
  winBdr: '#6ee7b7',
  flag:   '#fef9c3',
  flagBdr:'#fde047',
  loss:   '#fee2e2',
  lossBdr:'#fca5a5',
  gray:   '#64748b',
  border: '#e2e8f0',
  secBg:  '#f0f9f9',
}

// ── Component ──────────────────────────────────────────────────────────────
export default function CompareModule({ compact = false }) {
  const [kva,         setKva]         = useState(160)
  const [compBrand,   setCompBrand]   = useState('')
  const [koelSpec,    setKoelSpec]    = useState(null)
  const [compSpec,    setCompSpec]    = useState(null)
  const [availBrands, setAvailBrands] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [pdfMode,     setPdfMode]     = useState(false)
  const [noteOverrides, setNoteOverrides] = useState({})
  const [editingKey,  setEditingKey]  = useState(null)
  const pdfRef = useRef(null)

  // Load KOEL spec + available brands for this kVA
  useEffect(() => {
    if (!kva) return
    setLoading(true)
    setCompBrand('')
    setCompSpec(null)
    setNoteOverrides({})
    setEditingKey(null)

    supabase
      .from('competitor_specs')
      .select('*')
      .eq('kva_rating', kva)
      .then(({ data, error }) => {
        if (error || !data) { setLoading(false); return }
        const koel = data.find(r => r.brand === 'KOEL')
        const others = data.filter(r => r.brand !== 'KOEL')
          .sort((a, b) => BRAND_ORDER.indexOf(a.brand) - BRAND_ORDER.indexOf(b.brand))
        setKoelSpec(koel || null)
        setAvailBrands(others.map(r => r.brand))
        setLoading(false)
      })
  }, [kva])

  // Load competitor spec when brand changes
  useEffect(() => {
    if (!compBrand || !kva) { setCompSpec(null); return }
    supabase
      .from('competitor_specs')
      .select('*')
      .eq('kva_rating', kva)
      .eq('brand', compBrand)
      .single()
      .then(({ data }) => setCompSpec(data || null))
  }, [compBrand, kva])

  const handleDownloadPDF = async () => {
    if (!koelSpec || !compSpec) return
    setPdfMode(true)
    await new Promise(r => setTimeout(r, 120))
    const html2pdf = (await import('html2pdf.js')).default
    await html2pdf()
      .set({
        margin: [10, 8, 10, 8],
        filename: `KOEL_${kva}kVA_vs_${compBrand}.pdf`,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css'] },
      })
      .from(pdfRef.current)
      .save()
    setPdfMode(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: C.teal, marginBottom: 4 }}>
              Competitor Intelligence
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0d1f2d' }}>
              Head-to-Head Comparison
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDownloadPDF}
              disabled={!koelSpec || !compSpec || pdfMode}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: (!koelSpec || !compSpec) ? '#e2e8f0' : C.teal,
                color: (!koelSpec || !compSpec) ? '#94a3b8' : 'white',
                fontSize: '0.82rem', fontWeight: 700,
                boxShadow: (!koelSpec || !compSpec) ? 'none' : '0 2px 8px rgba(0,123,127,0.3)',
              }}
            >
              {pdfMode ? 'Generating…' : '↓ Download PDF'}
            </button>
          </div>
        </div>
      )}

      {/* ── Selectors ───────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* KOEL selector */}
        <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #005C60 100%)`,
          borderRadius: 12, padding: 20, color: 'white' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
            Kirloskar · Select
          </div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600,
            color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: '0.04em' }}>
            kVA RATING
          </label>
          <select
            value={kva}
            onChange={e => setKva(Number(e.target.value))}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              border: '1.5px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)', color: 'white',
              fontSize: '0.9rem', fontWeight: 700, outline: 'none', cursor: 'pointer',
            }}
          >
            {KVA_RATINGS.map(r => (
              <option key={r} value={r} style={{ background: '#003D40' }}>
                {r} kVA
              </option>
            ))}
          </select>

          {koelSpec && (
            <div style={{ marginTop: 14, padding: '10px 12px',
              background: 'rgba(255,255,255,0.08)', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                Model
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>
                {koelSpec.model_name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                {koelSpec.engine_model} · {koelSpec.num_cylinders} cyl · {koelSpec.displacement_litres}L
              </div>
            </div>
          )}
          {loading && (
            <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
              Loading…
            </div>
          )}
        </div>

        {/* Competitor selector */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20,
          border: '1.5px solid #e2e8f0' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#94a3b8', marginBottom: 12 }}>
            Competitor · Select
          </div>
          <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600,
            color: '#64748b', marginBottom: 6, letterSpacing: '0.04em' }}>
            BRAND
          </label>
          <select
            value={compBrand}
            onChange={e => setCompBrand(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8,
              border: '1.5px solid #e2e8f0', background: 'white', color: '#1e293b',
              fontSize: '0.88rem', fontWeight: 600, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="">— Select competitor —</option>
            {availBrands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {compSpec && (
            <div style={{ marginTop: 14, padding: '10px 12px',
              background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 2 }}>
                Model
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                {compSpec.model_name}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                {compSpec.engine_model} · {compSpec.num_cylinders ? `${compSpec.num_cylinders} cyl` : ''}{compSpec.displacement_litres ? ` · ${compSpec.displacement_litres}L` : ''}
              </div>
            </div>
          )}

          {!compBrand && availBrands.length > 0 && (
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#94a3b8' }}>
              {availBrands.length} competitor{availBrands.length > 1 ? 's' : ''} available at {kva} kVA
            </div>
          )}
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────── */}
      {(!koelSpec || !compSpec) && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 24px',
          background: '#f8fafc', borderRadius: 14, border: '1px dashed #e2e8f0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚖️</div>
          <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1.1rem', fontWeight: 700 }}>
            {!compBrand ? 'Select a competitor to compare' : 'No data available for this combination'}
          </h3>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.85rem' }}>
            {!compBrand
              ? 'Choose a competitor brand from the dropdown above.'
              : `No comparison data found for ${compBrand} at ${kva} kVA.`}
          </p>
        </div>
      )}

      {/* ── Comparison Table ─────────────────────────────────────── */}
      {koelSpec && compSpec && (
        <div ref={pdfRef} style={{ background: 'white' }}>

          {/* PDF header (only visible when generating) */}
          {pdfMode && (
            <div style={{ padding: '0 0 16px', marginBottom: 16,
              borderBottom: `2px solid ${C.teal}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                  textTransform: 'uppercase', color: C.teal, marginBottom: 4 }}>
                  Kirloskar Oil Engines Limited
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0d1f2d' }}>
                  {kva} kVA — KOEL vs {compBrand}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 2 }}>
                  CPCB IV+ Technical Specification Comparison · {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#888' }}>
                <div>KOEL Sales Intelligence</div>
                <div style={{ color: C.teal }}>kirloskargensets.com</div>
              </div>
            </div>
          )}

          {/* Table */}
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 200, textAlign: 'left' }}>Parameter</th>
                  <th style={{ ...thStyle, background: '#e0f2f1', color: C.dark }}>
                    <ColHeader brand="Kirloskar" model={koelSpec.model_name} kva={kva} />
                  </th>
                  <th style={{ ...thStyle }}>
                    <ColHeader brand={compBrand} model={compSpec.model_name} kva={kva} />
                  </th>
                  <th style={{ ...thStyle, width: 240, textAlign: 'left', color: '#64748b' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase' }}>Field Notes</div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, marginTop: 2 }}>Remarks</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {SPEC_ROWS.map((row, i) => {
                  if (row.section) return (
                    <tr key={`sec-${i}`}>
                      <td colSpan={4} style={{
                        background: C.secBg, color: C.dark, fontWeight: 800,
                        fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '8px 14px', borderTop: `2px solid ${C.teal}20`,
                      }}>
                        {row.section}
                      </td>
                    </tr>
                  )

                  const koelVal = getVal(koelSpec, row.key)
                  const compVal = getVal(compSpec, row.key)
                  const winner  = row.higher != null ? compareVals(koelVal, compVal, row.higher) : 'neutral'
                  const noteDefault = row.remark || null
                  const noteOverride = noteOverrides[row.key]
                  const displayNote  = noteOverride !== undefined ? noteOverride : noteDefault
                  const isEditing    = editingKey === row.key && !pdfMode

                  return (
                    <tr key={row.key} style={{ borderBottom: `1px solid ${C.border}` }}>
                      {/* Parameter label */}
                      <td style={{ padding: '8px 14px', fontSize: '0.8rem',
                        color: '#374151', fontWeight: 500, verticalAlign: 'middle' }}>
                        {row.label}
                        {row.unit && <span style={{ color: '#9ca3af', fontSize: '0.72rem',
                          marginLeft: 4 }}>({row.unit})</span>}
                      </td>

                      {/* KOEL value */}
                      <td style={{
                        padding: '8px 14px', textAlign: 'center', verticalAlign: 'middle',
                        fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem', fontWeight: 600,
                        background: winner === 'koel' ? C.win : 'transparent',
                        border: winner === 'koel' ? `1px solid ${C.winBdr}` : '',
                        borderRadius: winner === 'koel' ? 4 : 0,
                        color: winner === 'koel' ? '#065f46' : '#1e293b',
                      }}>
                        {fmt(koelVal)}
                        {winner === 'koel' && <span style={{ marginLeft: 4, fontSize: '0.7rem' }}>✓</span>}
                      </td>

                      {/* Competitor value */}
                      <td style={{
                        padding: '8px 14px', textAlign: 'center', verticalAlign: 'middle',
                        fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem', fontWeight: 600,
                        background: winner === 'comp' ? C.loss : winner === 'koel' ? C.flag : 'transparent',
                        color: winner === 'comp' ? '#991b1b' : '#1e293b',
                      }}>
                        {fmt(compVal)}
                      </td>

                      {/* Notes / Remarks */}
                      <td style={{ padding: '8px 14px', verticalAlign: 'middle' }}>
                        {isEditing ? (
                          <textarea
                            style={{ width: '100%', borderRadius: 6, border: `1.5px solid ${C.teal}`,
                              padding: '6px 8px', fontSize: '0.78rem', fontFamily: 'inherit',
                              resize: 'vertical', outline: 'none' }}
                            defaultValue={displayNote || ''}
                            autoFocus
                            rows={3}
                            onBlur={e => {
                              const val = e.target.value.trim()
                              setNoteOverrides(prev => ({ ...prev, [row.key]: val || undefined }))
                              setEditingKey(null)
                            }}
                            onKeyDown={e => e.key === 'Escape' && setEditingKey(null)}
                          />
                        ) : (
                          <div
                            onClick={() => !pdfMode && setEditingKey(row.key)}
                            title={!pdfMode ? 'Click to add / edit note' : undefined}
                            style={{ cursor: pdfMode ? 'default' : 'text', minHeight: 24 }}
                          >
                            {displayNote
                              ? <span style={{ fontSize: '0.78rem', color: '#374151',
                                  lineHeight: 1.5,
                                  ...(noteOverride !== undefined ? { color: C.teal, fontStyle: 'italic' } : {}),
                                }}>
                                  {displayNote}
                                </span>
                              : !pdfMode && <span style={{ fontSize: '0.75rem', color: '#d1d5db' }}>
                                  + add note
                                </span>
                            }
                            {noteOverride !== undefined && !pdfMode && (
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  setNoteOverrides(prev => { const n={...prev}; delete n[row.key]; return n })
                                }}
                                style={{ marginLeft: 6, fontSize: '0.7rem', color: '#9ca3af',
                                  background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >×</button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Legend ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { bg: C.win,  bdr: C.winBdr,  label: 'KOEL advantage' },
              { bg: C.flag, bdr: C.flagBdr, label: 'Contextual — see Remarks' },
              { bg: C.loss, bdr: C.lossBdr, label: 'Competitor claims advantage' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 13, height: 13, borderRadius: 3,
                  background: l.bg, border: `1px solid ${l.bdr}` }} />
                <span style={{ fontSize: '0.78rem', color: C.gray }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* ── Why Kirloskar Summary ─────────────────────────── */}
          <KoelAdvantagePanel koel={koelSpec} comp={compSpec} brand={compBrand} />

          {/* ── Source Links ──────────────────────────────────── */}
          {!pdfMode && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap',
              paddingTop: 20, borderTop: `1px solid ${C.border}`, marginTop: 20 }}>
              <span style={{ fontSize: '0.78rem', color: C.gray, alignSelf: 'center' }}>
                Source datasheets:
              </span>
              <SourceBtn label={`KOEL ${kva} kVA Datasheet`} url={BRAND_URLS['KOEL']} />
              <SourceBtn label={`${compBrand} Datasheet`} url={compSpec?.source_url || BRAND_URLS[compBrand]} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────
function ColHeader({ brand, model, kva }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
        textTransform: 'uppercase', marginBottom: 3 }}>{brand}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{model}</div>
      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>{kva} kVA</div>
    </div>
  )
}

function SourceBtn({ label, url }) {
  return (
    <a
      href={url} target="_blank" rel="noreferrer"
      style={{
        padding: '5px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
        border: '1px solid #e2e8f0', color: '#007B7F', background: 'white',
        textDecoration: 'none', transition: 'all 120ms',
      }}
      onMouseEnter={e => { e.target.style.background = '#f0f9f9'; e.target.style.borderColor = '#007B7F' }}
      onMouseLeave={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#e2e8f0' }}
    >
      {label} ↗
    </a>
  )
}

function KoelAdvantagePanel({ koel, comp, brand }) {
  const pts = useMemo(() => {
    if (!koel || !comp) return []
    const list = []

    // 1. Displacement
    if (koel.displacement_litres && comp.displacement_litres && koel.displacement_litres > comp.displacement_litres) {
      const pct = Math.round((koel.displacement_litres - comp.displacement_litres) / comp.displacement_litres * 100)
      list.push({
        icon: '⚙️',
        heading: `${koel.displacement_litres}L vs ${comp.displacement_litres}L displacement (+${pct}%)`,
        body: `More displacement at the same rated output means the engine runs well within capacity — lower specific load, less wear per hour, longer engine life.`,
      })
    }

    // 2. Fuel tank
    if (koel.std_fuel_tank_litres && comp.std_fuel_tank_litres && koel.std_fuel_tank_litres > comp.std_fuel_tank_litres) {
      const pct = Math.round((koel.std_fuel_tank_litres - comp.std_fuel_tank_litres) / comp.std_fuel_tank_litres * 100)
      list.push({
        icon: '⛽',
        heading: `${koel.std_fuel_tank_litres}L fuel tank — ${pct}% more than ${comp.std_fuel_tank_litres}L`,
        body: `Longer uninterrupted run times during extended outages — fewer fuel stops, crucial for data centres, hospitals, and remote sites.`,
      })
    }

    // 3. In-house engine
    if (koel.engine_make === 'Kirloskar') {
      list.push({
        icon: '🏭',
        heading: 'Kirloskar engine in a Kirloskar genset',
        body: `One OEM for engine and genset — single warranty, single service team, no finger-pointing at 2 AM during a breakdown.`,
      })
    }

    // 4. Noise measurement point
    if (brand === 'Cummins') {
      list.push({
        icon: '🔇',
        heading: 'KOEL noise declared at 100% load — Cummins at 75%',
        body: `KOEL's <75 dB(A) is measured at full load — the harder benchmark. Cummins specifies at 75% load, a lighter and quieter operating point.`,
      })
    }

    // 5. Lube oil cost
    list.push({
      icon: '💰',
      heading: 'K-Oil Premium: ~50% cheaper than competitor lube oils',
      body: `KOEL's proprietary K-Oil Premium is formulated for KOEL engines and priced significantly below equivalent Cummins, Greaves, or CAT oils — substantial TCO saving over the genset lifetime.`,
    })

    // 6. Electronic governor
    if (koel.governing_system?.toLowerCase().includes('electronic') &&
        !comp.governing_system?.toLowerCase().includes('electronic')) {
      list.push({
        icon: '⚡',
        heading: 'Electronic governor vs mechanical',
        body: `KOEL's electronic governor is maintenance-free and delivers better fuel efficiency by adjusting fuel flow precisely to speed and load. Mechanical governors require periodic calibration.`,
      })
    }

    // 7. Alternator efficiency declared
    if (koel.alternator_efficiency_pct && !comp.alternator_efficiency_pct) {
      list.push({
        icon: '📊',
        heading: `${koel.alternator_efficiency_pct}% alternator efficiency — declared`,
        body: `${brand} does not declare alternator efficiency in their CPCB IV+ spec sheet. KOEL publishes it openly — higher efficiency means more usable power per litre of fuel.`,
      })
    }

    return list.slice(0, 5)
  }, [koel, comp, brand])

  if (pts.length === 0) return null

  return (
    <div style={{ background: 'linear-gradient(135deg, #0d1f2d 0%, #0f2a38 100%)',
      borderRadius: 14, padding: 24, marginBottom: 20,
      border: '1px solid rgba(0,123,127,0.25)' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#0096A0', marginBottom: 6 }}>
        Sales Summary
      </div>
      <h3 style={{ margin: '0 0 4px', color: 'white', fontSize: '1.1rem', fontWeight: 800 }}>
        Why {koel.model_name} over {comp.model_name}
      </h3>
      <p style={{ margin: '0 0 18px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
        Key points to close — without repeating what the table already shows.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pts.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start',
            background: 'rgba(255,255,255,0.04)', borderRadius: 10,
            padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{p.icon}</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white',
                marginBottom: 4 }}>{p.heading}</div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.6 }}>{p.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Inline style constants ─────────────────────────────────────────────────
const thStyle = {
  padding: '12px 14px',
  background: '#f8fafc',
  borderBottom: '2px solid #e2e8f0',
  fontSize: '0.78rem',
  fontWeight: 700,
  color: '#374151',
}
