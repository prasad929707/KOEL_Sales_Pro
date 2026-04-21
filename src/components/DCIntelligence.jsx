// ─────────────────────────────────────────────────────────────────────────────
// DCIntelligence — Data Centers segment deep-dive
// Sections: Context · Headlines · Project pipeline (table + competitor col + Excel)
//           · Growth chart · Geo split · Sources · GOEM exposure · Competitor mapping
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import {
  CAPACITY_GROWTH, GEO_SPLIT, HEADLINES,
  PROJECTS, LIKELIHOOD_CFG, STATUS_CFG, SOURCES, COMPETITOR_MAP,
} from '../data/deepdive/dc_intel'

// ── Known competitors for multi-select ───────────────────────────────────────
const KNOWN_COMPETITORS = ['Cummins', 'Caterpillar', 'Perkins', 'Jakson', 'SDMO', 'Other']

// ── Likelihood dots ───────────────────────────────────────────────────────────
function LikelihoodDots({ level }) {
  const cfg = LIKELIHOOD_CFG[level] || LIKELIHOOD_CFG.unknown
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: '0.62rem', fontWeight: 700,
      padding: '2px 9px', borderRadius: 99, whiteSpace: 'nowrap',
    }}>
      {[1,2,3,4].map(n => (
        <span key={n} style={{
          width: 5, height: 5, borderRadius: '50%',
          background: n <= cfg.dots ? cfg.color : 'rgba(0,0,0,0.1)',
          flexShrink: 0,
        }} />
      ))}
      <span style={{ marginLeft: 4 }}>{cfg.label}</span>
    </span>
  )
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, color: '#64748b', bg: 'rgba(100,116,139,0.1)' }
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 600, color: cfg.color,
      background: cfg.bg, padding: '2px 7px', borderRadius: 99,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

// ── Source tag ────────────────────────────────────────────────────────────────
function SourceTag({ text }) {
  return (
    <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontStyle: 'italic' }}>{text}</span>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ label, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: '0.62rem', fontWeight: 800, color: '#1e3a5f',
        textTransform: 'uppercase', letterSpacing: '0.12em',
        marginBottom: sub ? 4 : 0,
      }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{sub}</div>}
    </div>
  )
}

// ── Custom recharts tooltip ───────────────────────────────────────────────────
function GrowthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: '#0f1f38', border: '1px solid rgba(20,184,166,0.3)',
      borderRadius: 8, padding: '8px 12px',
    }}>
      <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.78rem', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.72rem', color: '#14b8a6', marginBottom: 3 }}>
        {d?.mw?.toLocaleString()} MW IT capacity
      </div>
      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>
        {d?.actual ? 'Actual' : 'Projected'} · {d?.source}
      </div>
    </div>
  )
}

// ── Competitor chips — inline multi-select popover ────────────────────────────
function CompetitorChips({ value = [], onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function toggle(comp) {
    onChange(value.includes(comp) ? value.filter(c => c !== comp) : [...value, comp])
  }

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title="Click to edit competitors"
        style={{ cursor: 'pointer', display: 'flex', gap: 3, flexWrap: 'wrap', minHeight: 20, alignItems: 'center' }}
      >
        {value.length === 0
          ? <span style={{ fontSize: '0.62rem', color: '#cbd5e1', fontStyle: 'italic' }}>click to add</span>
          : value.map(c => (
              <span key={c} style={{
                fontSize: '0.55rem', fontWeight: 700,
                color: '#dc2626', background: 'rgba(220,38,38,0.08)',
                padding: '1px 6px', borderRadius: 99, border: '1px solid rgba(220,38,38,0.18)',
              }}>{c}</span>
            ))
        }
      </div>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 300, top: '100%', left: 0,
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          padding: '6px 0', minWidth: 170, marginTop: 4,
        }}>
          {KNOWN_COMPETITORS.map(comp => (
            <label
              key={comp}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 12px', cursor: 'pointer',
                fontSize: '0.68rem', color: '#334155', background: 'transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--off-white)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <input
                type="checkbox"
                checked={value.includes(comp)}
                onChange={() => toggle(comp)}
                style={{ width: 13, height: 13, accentColor: '#dc2626', cursor: 'pointer', flexShrink: 0 }}
              />
              {comp}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Headline numbers strip ────────────────────────────────────────────────────
function HeadlineStrip() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
      marginBottom: 28,
    }}>
      {HEADLINES.map((h, i) => (
        <div key={i} style={{
          background: 'var(--white)',
          border: `1px solid rgba(13,148,136,0.15)`,
          borderTop: `3px solid ${h.accent}`,
          borderRadius: 10, padding: '14px 16px',
        }}>
          <div style={{
            fontSize: '1.5rem', fontWeight: 800,
            color: h.accent, fontFamily: 'var(--font-mono)',
            lineHeight: 1, marginBottom: 5,
          }}>
            {h.value}
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate)', marginBottom: 3 }}>{h.label}</div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 5 }}>{h.sub}</div>
          <SourceTag text={h.source} />
        </div>
      ))}
    </div>
  )
}

// ── Growth chart ──────────────────────────────────────────────────────────────
function GrowthChart() {
  const lastActual = CAPACITY_GROWTH.filter(d => d.actual).at(-1)
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px',
    }}>
      <SectionHeader
        label="Installed Capacity Trajectory (MW IT)"
        sub="India total · FY2020 actuals → FY2030 projected"
      />
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={CAPACITY_GROWTH} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'inherit' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} width={36} />
          <RechartTooltip content={<GrowthTooltip />} />
          <ReferenceLine x={lastActual?.year} stroke="rgba(13,148,136,0.3)" strokeDasharray="4 2" label={{ value: 'Latest actual', position: 'top', fontSize: 9, fill: '#0d9488' }} />
          <Area type="monotone" dataKey="mw" stroke="#0d9488" strokeWidth={2} fill="url(#actualGrad)"
            dot={(props) => {
              const { cx, cy, payload } = props
              if (!payload.actual) return <g key={props.key} />
              return <circle key={props.key} cx={cx} cy={cy} r={3} fill="#0d9488" stroke="white" strokeWidth={1.5} />
            }}
            activeDot={{ r: 5, fill: '#0d9488' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', color: '#64748b' }}>
          <div style={{ width: 14, height: 2, background: '#0d9488', borderRadius: 1 }} />
          Actual (JLL India DC Report)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', color: '#64748b' }}>
          <div style={{ width: 14, height: 2, background: '#0d9488', opacity: 0.4, borderRadius: 1 }} />
          Projected (JLL + CBRE consensus)
        </div>
      </div>
    </div>
  )
}

// ── Geographic split chart ────────────────────────────────────────────────────
function GeoChart() {
  const maxMw = Math.max(...GEO_SPLIT.map(d => d.mw))
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px',
    }}>
      <SectionHeader label="Geographic Split (FY2024)" sub="% of 900 MW installed · by metro" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GEO_SPLIT.map(city => (
          <div key={city.city}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--slate)' }}>{city.city}</span>
                <span style={{ fontSize: '0.58rem', color: city.color, fontWeight: 700, background: city.color + '15', padding: '1px 6px', borderRadius: 99 }}>{city.goem}</span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#0d9488', fontFamily: 'var(--font-mono)' }}>{city.mw} MW</span>
            </div>
            <div style={{ height: 6, background: 'var(--off-white)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(city.mw / maxMw) * 100}%`, background: city.city === 'Others' ? '#94a3b8' : '#0d9488', borderRadius: 3, transition: 'width 600ms ease' }} />
            </div>
            <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: 2 }}>{city.pct}% of installed base</div>
          </div>
        ))}
      </div>
      <SourceTag text="JLL India Data Centre Report 2024" />
    </div>
  )
}

// ── Project table helpers ─────────────────────────────────────────────────────
const COL  = '1.3fr 0.75fr 58px 80px 100px 140px 66px 110px'
const HDRS = ['Project / Operator', 'City', 'MW IT', 'DG kVA', 'GOEM', 'Likely Competitor', 'Status', 'KOEL Fit']
const SORT_OPTIONS = [
  { id: 'likelihood', label: 'KOEL Fit' },
  { id: 'mwIt',       label: 'Scale' },
  { id: 'city',       label: 'City' },
  { id: 'status',     label: 'Status' },
]
const LIKELIHOOD_ORDER = { high: 0, medium: 1, low: 2, unknown: 3, unlikely: 4 }
const STATUS_ORDER_MAP  = { under_construction: 0, announced: 1, commissioned: 2 }

function fmtKva(v) {
  if (v >= 1000) return `${(v/1000).toFixed(0)}k kVA`
  return `${v} kVA`
}

// ── Exposure summary strip ────────────────────────────────────────────────────
function ExposureSummary({ projects }) {
  const goemKva = projects.reduce((acc, p) => {
    acc[p.goem] = (acc[p.goem] || 0) + p.kvaEstimate
    return acc
  }, {})
  const topGoem = Object.entries(goemKva).sort((a,b) => b[1]-a[1])[0]
  const opCount = projects.reduce((acc, p) => {
    acc[p.operator] = (acc[p.operator] || 0) + 1
    return acc
  }, {})
  const topOp   = Object.entries(opCount).sort((a,b) => b[1]-a[1])[0]
  const biggest = projects.reduce((max, p) => p.kvaEstimate > max.kvaEstimate ? p : max, projects[0] || { kvaEstimate: 0, project: '—', city: '—' })
  const openKva = projects.filter(p => p.koelLikelihood === 'high' || p.koelLikelihood === 'medium').reduce((s, p) => s + p.kvaEstimate, 0)
  const openCnt = projects.filter(p => p.koelLikelihood === 'high' || p.koelLikelihood === 'medium').length

  if (!projects.length) return null

  const stats = [
    { label: 'Highest GOEM exposure', value: topGoem?.[0] || '—', sub: topGoem ? fmtKva(topGoem[1]) + ' pipeline' : '' },
    { label: 'Most active operator', value: topOp?.[0] || '—', sub: topOp ? `${topOp[1]} projects tracked` : '' },
    { label: 'Largest single project', value: biggest.project, sub: fmtKva(biggest.kvaEstimate) + ` · ${biggest.city}` },
    { label: 'KOEL addressable (High + Mid)', value: fmtKva(openKva), sub: `${openCnt} active projects` },
  ]

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
      marginBottom: 16, padding: '14px 16px',
      background: 'rgba(13,148,136,0.04)',
      borderRadius: 10, border: '1px solid rgba(13,148,136,0.12)',
    }}>
      {stats.map((s, i) => (
        <div key={i}>
          <div style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate)', lineHeight: 1.2 }}>{s.value}</div>
          <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 2 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── Excel import modal ────────────────────────────────────────────────────────
function ImportModal({ onClose, onImport, existingProjects }) {
  const [step,      setStep]      = useState(1)
  const [parsed,    setParsed]    = useState(null)
  const [skipDupes, setSkipDupes] = useState(true)
  const fileRef = useRef(null)

  const TEMPLATE_HEADERS = [
    'Project', 'Operator', 'City', 'State', 'MW IT', 'kVA Estimate',
    'Status', 'GOEM', 'KOEL Fit', 'Commission FY',
    'Competitors (comma-sep)', 'Rationale', 'Source',
  ]

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const data  = new Uint8Array(ev.target.result)
      const wb    = XLSX.read(data, { type: 'array' })
      const ws    = wb.Sheets[wb.SheetNames[0]]
      const rows  = XLSX.utils.sheet_to_json(ws, { defval: '' })
      const existingNames = existingProjects.map(p => (p.project || '').toLowerCase())

      const errors = []
      const duplicates = []
      const valid = []
      const VALID_FIT    = ['high', 'medium', 'low', 'unlikely', 'unknown']
      const VALID_STATUS = ['announced', 'under_construction', 'commissioned']

      rows.forEach((row, i) => {
        const rn = i + 2
        if (!row['Project']?.trim()) { errors.push(`Row ${rn}: Project name missing`); return }
        if (!row['City']?.trim())    { errors.push(`Row ${rn}: City missing`); return }
        if (!row['State']?.trim())   { errors.push(`Row ${rn}: State missing`); return }
        const fitRaw    = (row['KOEL Fit'] || '').toLowerCase().trim()
        const statusRaw = (row['Status'] || '').toLowerCase().trim().replace(' ', '_')
        if (fitRaw && !VALID_FIT.includes(fitRaw))    errors.push(`Row ${rn}: KOEL Fit must be one of: ${VALID_FIT.join(', ')}`)
        if (statusRaw && !VALID_STATUS.includes(statusRaw)) errors.push(`Row ${rn}: Status must be one of: announced, under_construction, commissioned`)
        const isDupe = existingNames.includes(row['Project'].toLowerCase().trim())
        if (isDupe) duplicates.push(row['Project'])
        valid.push({
          id:             `imp-${Date.now()}-${i}`,
          project:        row['Project'].trim(),
          operator:       row['Operator']?.trim() || '—',
          city:           row['City'].trim(),
          state:          row['State'].trim(),
          mwIt:           parseFloat(row['MW IT']) || 0,
          kvaEstimate:    parseFloat(row['kVA Estimate']) || 0,
          status:         VALID_STATUS.includes(statusRaw) ? statusRaw : 'announced',
          goem:           row['GOEM']?.trim() || '—',
          koelLikelihood: VALID_FIT.includes(fitRaw) ? fitRaw : 'unknown',
          commissionFy:   row['Commission FY']?.toString().trim() || '—',
          competitors:    row['Competitors (comma-sep)']
                            ? row['Competitors (comma-sep)'].split(',').map(s => s.trim()).filter(Boolean)
                            : [],
          rationale:      row['Rationale']?.trim() || '',
          source:         row['Source']?.trim() || 'Imported',
          currentOem:     null,
        })
      })
      setParsed({ rows: valid, errors, duplicates })
      setStep(2)
    }
    reader.readAsArrayBuffer(file)
  }

  function doImport() {
    let toAdd = parsed.rows
    if (skipDupes) {
      const existingNames = existingProjects.map(p => (p.project || '').toLowerCase())
      toAdd = toAdd.filter(r => !existingNames.includes(r.project.toLowerCase()))
    }
    onImport(toAdd)
    setStep(3)
  }

  const toAddCount = parsed
    ? skipDupes
      ? parsed.rows.filter(r => !existingProjects.map(p => (p.project||'').toLowerCase()).includes(r.project.toLowerCase())).length
      : parsed.rows.length
    : 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--white)', borderRadius: 14, padding: '28px 32px', maxWidth: 560, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
          {['Upload', 'Validate', 'Done'].map((label, i) => {
            const num = i + 1
            const done = step > num
            const active = step === num
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 800,
                    background: done ? '#0d9488' : active ? 'rgba(13,148,136,0.12)' : 'var(--off-white)',
                    color: done ? 'white' : active ? '#0d9488' : '#94a3b8',
                    border: active ? '2px solid #0d9488' : done ? '2px solid #0d9488' : '1px solid var(--border)',
                    flexShrink: 0,
                  }}>
                    {done ? '✓' : num}
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: active ? 700 : 500, color: active ? '#0d9488' : '#64748b' }}>{label}</span>
                </div>
                {i < 2 && <div style={{ width: 28, height: 1, background: 'var(--border)', margin: '0 6px' }} />}
              </div>
            )
          })}
          <button onClick={onClose} style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>✕</button>
        </div>

        {/* Step 1 — Upload */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate)', marginBottom: 6 }}>Upload Excel file</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
              Upload your completed template. Required columns: Project, City, State.<br />
              Optional but useful: MW IT, kVA Estimate, Status, KOEL Fit, Competitors.
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'block', width: '100%', padding: '28px 20px', textAlign: 'center',
                border: '2px dashed rgba(13,148,136,0.3)', borderRadius: 10,
                background: 'rgba(13,148,136,0.03)', cursor: 'pointer',
                fontSize: '0.78rem', color: '#0d9488', fontFamily: 'inherit', fontWeight: 600,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#0d9488'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(13,148,136,0.3)'}
            >
              Click to select .xlsx / .xls / .csv
            </button>
          </div>
        )}

        {/* Step 2 — Validate */}
        {step === 2 && parsed && (
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate)', marginBottom: 16 }}>
              {parsed.rows.length} row{parsed.rows.length !== 1 ? 's' : ''} found
            </div>

            {parsed.errors.length > 0 && (
              <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  {parsed.errors.length} issue{parsed.errors.length !== 1 ? 's' : ''} found
                </div>
                {parsed.errors.slice(0, 5).map((e, i) => (
                  <div key={i} style={{ fontSize: '0.68rem', color: '#dc2626', lineHeight: 1.6 }}>{e}</div>
                ))}
                {parsed.errors.length > 5 && <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: 4 }}>…and {parsed.errors.length - 5} more</div>}
              </div>
            )}

            {parsed.duplicates.length > 0 && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  {parsed.duplicates.length} duplicate{parsed.duplicates.length !== 1 ? 's' : ''} detected
                </div>
                <div style={{ fontSize: '0.68rem', color: '#92400e', marginBottom: 10 }}>
                  These project names already exist: {parsed.duplicates.slice(0, 3).join(', ')}{parsed.duplicates.length > 3 ? ` +${parsed.duplicates.length - 3} more` : ''}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.7rem', color: '#334155' }}>
                  <input type="checkbox" checked={skipDupes} onChange={e => setSkipDupes(e.target.checked)} style={{ accentColor: '#0d9488' }} />
                  Skip duplicates (recommended) — append only new rows
                </label>
              </div>
            )}

            <div style={{ fontSize: '0.72rem', color: '#334155', marginBottom: 20, padding: '10px 14px', background: 'rgba(13,148,136,0.04)', borderRadius: 8 }}>
              <strong style={{ color: '#0d9488' }}>{toAddCount} row{toAddCount !== 1 ? 's' : ''}</strong> will be appended to the pipeline.
              {parsed.errors.length > 0 && <span style={{ color: '#dc2626' }}> Rows with errors will be skipped.</span>}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setStep(1)} style={{ fontSize: '0.68rem', color: '#64748b', background: 'transparent', border: '1px solid var(--border)', padding: '7px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <button
                onClick={doImport}
                disabled={toAddCount === 0}
                style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white', background: toAddCount === 0 ? '#94a3b8' : '#0d9488', border: 'none', padding: '7px 20px', borderRadius: 99, cursor: toAddCount === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                Import {toAddCount} row{toAddCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--slate)', marginBottom: 8 }}>Import complete</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
              {toAddCount} project{toAddCount !== 1 ? 's' : ''} added to the pipeline.<br />
              Data is session-local — export to Excel to persist changes.
            </div>
            <button onClick={onClose} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white', background: '#0d9488', border: 'none', padding: '8px 24px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Inline editable cell ──────────────────────────────────────────────────────
function EditCell({ value, onChange, type = 'text', options = null, mono = false }) {
  const [local, setLocal] = useState(value)
  function commit() { if (local !== value) onChange(local) }

  if (options) {
    return (
      <select
        value={local}
        onChange={e => { setLocal(e.target.value); onChange(e.target.value) }}
        style={{
          fontSize: '0.65rem', fontWeight: 600, color: '#334155',
          background: 'rgba(13,148,136,0.05)',
          border: '1px solid rgba(13,148,136,0.25)', borderRadius: 5,
          padding: '2px 4px', fontFamily: 'inherit', cursor: 'pointer',
          width: '100%',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }

  return (
    <input
      type={type}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') { commit(); e.target.blur() } }}
      style={{
        fontSize: '0.65rem', fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        color: '#334155', background: 'rgba(13,148,136,0.05)',
        border: '1px solid rgba(13,148,136,0.25)', borderRadius: 5,
        padding: '2px 5px', width: '100%', boxSizing: 'border-box',
      }}
    />
  )
}

// ── Project table ─────────────────────────────────────────────────────────────
function ProjectTable({ projects, onUpdateCompetitors, onImport, onUpdateProject, onOpenResearch }) {
  const [sortBy,       setSortBy]       = useState('likelihood')
  const [filterLevel,  setFilterLevel]  = useState('all')
  const [expandedId,   setExpandedId]   = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [showImport,   setShowImport]   = useState(false)
  const [editMode,     setEditMode]     = useState(false)

  const sorted = useMemo(() => {
    let list = [...projects]
    if (filterLevel !== 'all') list = list.filter(p => p.koelLikelihood === filterLevel)
    if (filterStatus !== 'all') list = list.filter(p => p.status === filterStatus)
    list.sort((a, b) => {
      if (sortBy === 'likelihood') return (LIKELIHOOD_ORDER[a.koelLikelihood] ?? 9) - (LIKELIHOOD_ORDER[b.koelLikelihood] ?? 9)
      if (sortBy === 'mwIt')       return b.mwIt - a.mwIt
      if (sortBy === 'status')     return (STATUS_ORDER_MAP[a.status] ?? 9) - (STATUS_ORDER_MAP[b.status] ?? 9)
      if (sortBy === 'city')       return a.city.localeCompare(b.city)
      return 0
    })
    return list
  }, [projects, sortBy, filterLevel, filterStatus])

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([[
      'Project', 'Operator', 'City', 'State', 'MW IT', 'kVA Estimate',
      'Status', 'GOEM', 'KOEL Fit', 'Commission FY',
      'Competitors (comma-sep)', 'Rationale', 'Source',
    ]])
    // Set column widths
    ws['!cols'] = [18,18,12,14,8,12,16,10,10,12,24,32,20].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'DC Pipeline Template')
    XLSX.writeFile(wb, 'KOEL_DC_Pipeline_Template.xlsx')
  }

  function exportCurrent() {
    const rows = projects.map(p => ({
      'Project':      p.project,
      'Operator':     p.operator,
      'City':         p.city,
      'State':        p.state,
      'MW IT':        p.mwIt,
      'kVA Estimate': p.kvaEstimate,
      'Status':       p.status,
      'GOEM':         p.goem,
      'KOEL Fit':     p.koelLikelihood,
      'Commission FY': p.commissionFy,
      'Competitors (comma-sep)': (p.competitors || []).join(', '),
      'Rationale':    p.rationale,
      'Source':       p.source,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [18,18,12,14,8,12,16,10,10,12,24,32,20].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'DC Pipeline')
    XLSX.writeFile(wb, 'KOEL_DC_Pipeline_Export.xlsx')
  }

  return (
    <div>
      {/* Header row with Excel controls */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>
            Project Pipeline
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {projects.length} projects tracked · kVA at 1.4× IT load (N+1 standard)
          </div>
        </div>

        {/* Excel controls + Edit toggle */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
          <button
            onClick={() => setEditMode(m => !m)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.65rem', fontWeight: 700,
              color: editMode ? 'white' : '#334155',
              background: editMode ? '#0d9488' : 'var(--white)',
              border: `1px solid ${editMode ? '#0d9488' : 'var(--border)'}`,
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 120ms',
            }}
            title={editMode ? 'Exit edit mode' : 'Edit table rows inline'}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
            </svg>
            {editMode ? 'Done editing' : 'Edit'}
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <button
            onClick={onOpenResearch}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.65rem', fontWeight: 700, color: 'white',
              background: 'linear-gradient(135deg, #0f1f38 0%, #1e3a5f 100%)',
              border: '1px solid #1e3a5f',
              padding: '6px 13px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'opacity 120ms', boxShadow: '0 1px 4px rgba(15,31,56,0.2)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            title="Run AI research agents to find new DC projects"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="5.5"/>
              <path d="M6.5 6.5l3 1.5-3 1.5V6.5z" fill="currentColor" stroke="none"/>
            </svg>
            AI Research
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <button
            onClick={downloadTemplate}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.65rem', fontWeight: 700, color: '#334155',
              background: 'var(--white)', border: '1px solid var(--border)',
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0d9488'; e.currentTarget.style.borderColor = 'rgba(13,148,136,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = 'var(--border)' }}
            title="Download blank template for bulk entry"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v9M4 7l4 4 4-4"/><rect x="2" y="12" width="12" height="2" rx="1"/>
            </svg>
            Template
          </button>
          <button
            onClick={() => setShowImport(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.65rem', fontWeight: 700, color: 'white',
              background: '#0d9488', border: '1px solid #0d9488',
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 120ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0f766e'}
            onMouseLeave={e => e.currentTarget.style.background = '#0d9488'}
            title="Import rows from Excel"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 11V2M4 7l4-4 4 4"/><rect x="2" y="12" width="12" height="2" rx="1"/>
            </svg>
            Import
          </button>
          <button
            onClick={exportCurrent}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.65rem', fontWeight: 600, color: '#64748b',
              background: 'transparent', border: '1px solid var(--border)',
              padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = '#94a3b8' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'var(--border)' }}
            title="Export current pipeline to Excel"
          >
            Export
          </button>
        </div>
      </div>

      {/* Exposure summary */}
      <ExposureSummary projects={projects} />

      {/* Filters + sort bar */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>KOEL Fit:</span>
        {['all', 'high', 'medium', 'low', 'unlikely', 'unknown'].map(f => {
          const cfg = f === 'all' ? null : LIKELIHOOD_CFG[f]
          const isActive = filterLevel === f
          return (
            <button key={f} onClick={() => setFilterLevel(f)} style={{
              fontSize: '0.6rem', fontWeight: 600,
              color: isActive ? (cfg?.color || '#334155') : '#64748b',
              background: isActive ? (cfg?.bg || 'rgba(51,65,85,0.08)') : 'transparent',
              border: `1px solid ${isActive ? (cfg?.border || 'rgba(51,65,85,0.2)') : 'transparent'}`,
              padding: '3px 9px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 120ms',
            }}>
              {f === 'all' ? 'All' : cfg?.label}
            </button>
          )
        })}
        <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 4px' }} />
        {['all', 'under_construction', 'announced', 'commissioned'].map(f => {
          const cfg = f === 'all' ? null : STATUS_CFG[f]
          const isActive = filterStatus === f
          return (
            <button key={f} onClick={() => setFilterStatus(f)} style={{
              fontSize: '0.6rem', fontWeight: 600,
              color: isActive ? (cfg?.color || '#334155') : '#64748b',
              background: isActive ? (cfg ? cfg.bg : 'rgba(51,65,85,0.08)') : 'transparent',
              border: `1px solid ${isActive ? 'var(--border)' : 'transparent'}`,
              padding: '3px 9px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {f === 'all' ? 'All status' : cfg?.label}
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ fontSize: '0.6rem', color: '#64748b' }}>Sort:</span>
          {SORT_OPTIONS.map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)} style={{
              fontSize: '0.6rem', fontWeight: sortBy === s.id ? 700 : 500,
              color: sortBy === s.id ? '#334155' : '#94a3b8',
              background: sortBy === s.id ? 'var(--off-white)' : 'transparent',
              border: `1px solid ${sortBy === s.id ? 'var(--border)' : 'transparent'}`,
              padding: '3px 8px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {s.label}{sortBy === s.id ? ' ↓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
          background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)',
          borderRadius: 8, marginBottom: 8, fontSize: '0.67rem', color: '#0f766e',
        }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg>
          <strong>Edit mode on</strong> — click any cell to edit. MW IT auto-recalculates kVA. Click "Done editing" when finished.
        </div>
      )}

      {/* Table */}
      <div style={{ border: `1px solid ${editMode ? 'rgba(13,148,136,0.25)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden', maxHeight: editMode ? 'none' : 600, overflowY: 'auto' }}>

        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: COL, gap: 10,
          background: '#f1f5f9',
          borderBottom: '2px solid var(--border)',
          padding: '7px 14px',
        }}>
          {HDRS.map(h => (
            <div key={h} style={{ fontSize: '0.58rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {sorted.map((p, i) => {
          const isExpanded = expandedId === p.id
          const isOdd = i % 2 === 1
          const likelyCfg = LIKELIHOOD_CFG[p.koelLikelihood] || LIKELIHOOD_CFG.unknown
          return (
            <div key={p.id}>
              <div
                onClick={() => !editMode && setExpandedId(id => id === p.id ? null : p.id)}
                style={{
                  display: 'grid', gridTemplateColumns: COL, gap: 10,
                  padding: editMode ? '6px 14px' : '9px 14px',
                  background: editMode ? (isOdd ? 'rgba(13,148,136,0.03)' : 'rgba(13,148,136,0.01)')
                    : isExpanded ? likelyCfg.bg : isOdd ? 'rgba(248,250,252,0.7)' : 'var(--white)',
                  borderBottom: `1px solid ${editMode ? 'rgba(13,148,136,0.15)' : 'var(--border)'}`,
                  cursor: editMode ? 'default' : 'pointer',
                  transition: 'background 100ms', alignItems: 'center',
                  outline: editMode ? '1px solid rgba(13,148,136,0.08)' : 'none',
                  outlineOffset: -1,
                }}
                onMouseEnter={e => { if (!isExpanded && !editMode) e.currentTarget.style.background = 'rgba(13,148,136,0.03)' }}
                onMouseLeave={e => { if (!isExpanded && !editMode) e.currentTarget.style.background = isOdd ? 'rgba(248,250,252,0.7)' : 'var(--white)' }}
              >
                {/* Project / Operator */}
                <div onClick={e => editMode && e.stopPropagation()}>
                  {editMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <EditCell value={p.project} onChange={v => onUpdateProject(p.id, { project: v })} />
                      <EditCell value={p.operator} onChange={v => onUpdateProject(p.id, { operator: v })} />
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--slate)', lineHeight: 1.2 }}>{p.project}</div>
                      <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: 1 }}>{p.operator}</div>
                    </>
                  )}
                </div>
                {/* City */}
                <div onClick={e => editMode && e.stopPropagation()}>
                  {editMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <EditCell value={p.city} onChange={v => onUpdateProject(p.id, { city: v })} />
                      <EditCell value={p.state} onChange={v => onUpdateProject(p.id, { state: v })} />
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate)' }}>{p.city}</div>
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{p.state}</div>
                    </>
                  )}
                </div>
                {/* MW IT */}
                <div onClick={e => editMode && e.stopPropagation()}>
                  {editMode ? (
                    <EditCell value={String(p.mwIt)} type="number" mono onChange={v => onUpdateProject(p.id, { mwIt: parseFloat(v) || 0, kvaEstimate: Math.round((parseFloat(v) || 0) * 1000 * 1.4) })} />
                  ) : (
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155', fontFamily: 'var(--font-mono)' }}>{p.mwIt} MW</span>
                  )}
                </div>
                {/* DG kVA — auto-computed, read-only even in edit */}
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0d9488', fontFamily: 'var(--font-mono)' }}>
                  {fmtKva(p.kvaEstimate)}
                </div>
                {/* GOEM */}
                <div onClick={e => editMode && e.stopPropagation()}>
                  {editMode ? (
                    <EditCell
                      value={p.goem}
                      options={[
                        { value: 'Kala', label: 'Kala (MH)' },
                        { value: 'Sunbeam', label: 'Sunbeam (South)' },
                        { value: 'IEC', label: 'IEC (North)' },
                        { value: 'South-East', label: 'South-East' },
                        { value: '—', label: '—' },
                      ]}
                      onChange={v => onUpdateProject(p.id, { goem: v })}
                    />
                  ) : (
                    <>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155' }}>{p.goem}</div>
                      {p.currentOem && (
                        <div style={{ fontSize: '0.58rem', color: '#dc2626', marginTop: 1 }}>vs {p.currentOem}</div>
                      )}
                    </>
                  )}
                </div>
                {/* Competitors — multi-select chips (always editable) */}
                <div onClick={e => e.stopPropagation()}>
                  <CompetitorChips
                    value={p.competitors || []}
                    onChange={comps => onUpdateCompetitors(p.id, comps)}
                  />
                </div>
                {/* Status */}
                <div onClick={e => editMode && e.stopPropagation()}>
                  {editMode ? (
                    <EditCell
                      value={p.status}
                      options={[
                        { value: 'under_construction', label: 'Under Const.' },
                        { value: 'announced', label: 'Announced' },
                        { value: 'commissioned', label: 'Commissioned' },
                      ]}
                      onChange={v => onUpdateProject(p.id, { status: v })}
                    />
                  ) : (
                    <StatusPill status={p.status} />
                  )}
                </div>
                {/* KOEL Fit */}
                <div onClick={e => editMode && e.stopPropagation()}>
                  {editMode ? (
                    <EditCell
                      value={p.koelLikelihood}
                      options={[
                        { value: 'high', label: 'High' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'low', label: 'Low' },
                        { value: 'unlikely', label: 'Unlikely' },
                        { value: 'unknown', label: 'Unknown' },
                      ]}
                      onChange={v => onUpdateProject(p.id, { koelLikelihood: v })}
                    />
                  ) : (
                    <LikelihoodDots level={p.koelLikelihood} />
                  )}
                </div>
              </div>

              {/* Expanded: rationale + source */}
              {isExpanded && (
                <div style={{
                  padding: '12px 14px 14px',
                  background: likelyCfg.bg,
                  borderBottom: `1px solid ${likelyCfg.border}`,
                  display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16,
                }}>
                  <div>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, color: likelyCfg.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5 }}>
                      {p.koelLikelihood === 'high' || p.koelLikelihood === 'medium' ? 'Action & Rationale' : 'Why Tracked'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--slate)', lineHeight: 1.65 }}>{p.rationale}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Commission FY</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155' }}>{p.commissionFy}</div>
                    </div>
                    {p.competitors?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Competing against</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {p.competitors.map(c => (
                            <span key={c} style={{ fontSize: '0.6rem', fontWeight: 700, color: '#dc2626', background: 'rgba(220,38,38,0.08)', padding: '2px 7px', borderRadius: 99, border: '1px solid rgba(220,38,38,0.18)' }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Source</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>{p.source}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {sorted.length === 0 && (
          <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
            No projects match this filter.
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.7 }}>
        DG kVA at 1.4× IT load (N+1 standard). KOEL Fit based on operator type, procurement stage, and GOEM coverage.
        Click <strong>Likely Competitor</strong> cell to edit competitors per project.
        Sources: JLL India DC Report 2024 · CBRE India Q4 2024 · datacentermap.com · operator IR pages.
        <span style={{ color: '#f59e0b', fontWeight: 600 }}> Validate GOEM assignments with KOEL Sales Ops before presenting.</span>
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={onImport}
          existingProjects={projects}
        />
      )}
    </div>
  )
}

// ── Sources panel ─────────────────────────────────────────────────────────────
const TYPE_CFG = {
  report:    { label: 'Report',    color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  directory: { label: 'Directory', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
  ir:        { label: 'IR',        color: '#b45309', bg: 'rgba(180,83,9,0.10)' },
  press:     { label: 'Press',     color: '#475569', bg: 'rgba(71,85,105,0.08)' },
  govt:      { label: 'Govt',      color: '#0d9488', bg: 'rgba(13,148,136,0.08)' },
}

// ── Agent API config ─────────────────────────────────────────────────────────
const AGENT_API = import.meta.env.VITE_AGENT_API || 'http://localhost:8765'

// ── Research modal — triggers agent run, shows live status, review diff ───────
function ResearchModal({ onClose, onImport, existingProjects }) {
  const [phase,   setPhase]   = useState('idle')   // idle|running|review|done|error
  const [runId,   setRunId]   = useState(null)
  const [summary, setSummary] = useState(null)
  const [diff,    setDiff]    = useState([])
  const [selected,setSelected]= useState(new Set())
  const [error,   setError]   = useState(null)
  const [dots,    setDots]    = useState(0)
  const pollRef = useRef(null)

  // Animated dots while running
  useEffect(() => {
    if (phase !== 'running') return
    const t = setInterval(() => setDots(d => (d + 1) % 4), 600)
    return () => clearInterval(t)
  }, [phase])

  // Poll status while running
  useEffect(() => {
    if (!runId || phase !== 'running') return
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${AGENT_API}/research/dc/status/${runId}`)
        const data = await r.json()
        if (data.status === 'review') {
          clearInterval(pollRef.current)
          const rr = await fetch(`${AGENT_API}/research/dc/results/${runId}`)
          const results = await rr.json()
          setSummary(results.summary)
          setDiff(results.diff || [])
          setSelected(new Set(results.diff?.map((_, i) => i) || []))
          setPhase('review')
        } else if (data.status === 'error') {
          clearInterval(pollRef.current)
          setError(data.error || 'Research run failed')
          setPhase('error')
        } else if (data.summary) {
          setSummary(data.summary)
        }
      } catch (e) {
        clearInterval(pollRef.current)
        setError(`Cannot reach agent API at ${AGENT_API}. Is the server running?`)
        setPhase('error')
      }
    }, 3000)
    return () => clearInterval(pollRef.current)
  }, [runId, phase])

  async function startRun() {
    setPhase('running'); setError(null); setSummary(null); setDiff([])
    try {
      const r = await fetch(`${AGENT_API}/research/dc/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ existing_pipeline: existingProjects }),
      })
      if (!r.ok) throw new Error(`API error ${r.status}`)
      const data = await r.json()
      setRunId(data.run_id)
    } catch (e) {
      setError(`Cannot connect to agent server at ${AGENT_API}.\n\nTo start it: cd agents && python server.py`)
      setPhase('error')
    }
  }

  async function approveSelected() {
    const items = diff.filter((_, i) => selected.has(i)).map(d => d.project)
    try {
      await fetch(`${AGENT_API}/research/dc/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId, items }),
      })
    } catch (_) {}
    onImport(items)
    setPhase('done')
  }

  const toggleItem = i => setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  const addCount = diff.filter((d, i) => d.action === 'add' && selected.has(i)).length
  const updateCount = diff.filter((d, i) => d.action === 'update' && selected.has(i)).length

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--white)', borderRadius: 14, padding: '28px 32px', maxWidth: 680, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', maxHeight: '88vh', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--slate)', letterSpacing: '-0.01em', marginBottom: 3 }}>
              Research Agents — Data Centers
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              12 agents · web search · operator IR · press · tenders · competitor signals
            </div>
          </div>
          <button onClick={onClose} style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>✕</button>
        </div>

        {/* ── idle ── */}
        {phase === 'idle' && (
          <div>
            <div style={{ background: 'rgba(13,148,136,0.04)', border: '1px solid rgba(13,148,136,0.15)', borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
              {[
                ['WebScout', 'News & announcements via web search'],
                ['CapacityTracker', 'Yotta · AdaniConnex · Nxtra · STT GDC expansion'],
                ['IRTracker', 'CtrlS DRHP · Pi DC · Sify annual reports'],
                ['TenderWatcher', 'GeM portal · private DG procurement tenders'],
                ['PressParser', 'ET Tech · Mint · Business Standard'],
                ['CompetitorRadar', 'Cummins/CAT win tracking'],
                ['PolicyWatch', 'CPCB IV+ deadlines · MeitY DC parks'],
                ['+ 5 signal agents', 'Job postings · land deals · compliance cycle'],
              ].map(([name, desc]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0d9488', minWidth: 130 }}>{name}</span>
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>{desc}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
              Runs take 60–120 seconds. Results are diffs — you approve what gets added to the pipeline.
              Requires agent server running at <code style={{ background: 'var(--off-white)', padding: '1px 4px', borderRadius: 4 }}>{AGENT_API}</code>
            </div>
            <button onClick={startRun} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 700, color: 'white', background: '#0d9488', border: 'none', padding: '10px 24px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="6"/><path d="M6 6l4 2-4 2V6z" fill="currentColor" stroke="none"/></svg>
              Run Research Agents
            </button>
          </div>
        )}

        {/* ── running ── */}
        {phase === 'running' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <style>{`@keyframes koel-spin { to { transform: rotate(360deg) } }`}</style>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(13,148,136,0.2)', borderTopColor: '#0d9488', animation: 'koel-spin 0.9s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--slate)', marginBottom: 6 }}>
              12 agents running{'.'.repeat(dots)}
            </div>
            {summary && (
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 8 }}>
                {summary.raw_projects > 0 && `${summary.raw_projects} raw findings so far`}
              </div>
            )}
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 12 }}>
              Searching web · reading operator sites · parsing press · diffing against pipeline
            </div>
          </div>
        )}

        {/* ── error ── */}
        {phase === 'error' && (
          <div style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>Agent run failed</div>
            <pre style={{ fontSize: '0.65rem', color: '#64748b', whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'var(--font-mono)' }}>{error}</pre>
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button onClick={() => setPhase('idle')} style={{ fontSize: '0.68rem', color: '#64748b', background: 'transparent', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
              <button onClick={startRun} style={{ fontSize: '0.68rem', fontWeight: 700, color: 'white', background: '#dc2626', border: 'none', padding: '6px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>Retry</button>
            </div>
          </div>
        )}

        {/* ── review ── */}
        {phase === 'review' && (
          <div>
            {/* Summary strip */}
            {summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16, padding: '10px 14px', background: 'rgba(13,148,136,0.05)', borderRadius: 9, border: '1px solid rgba(13,148,136,0.15)' }}>
                {[
                  { label: 'Agents OK',    value: summary.agents_ok },
                  { label: 'New found',    value: summary.new_projects, hi: true },
                  { label: 'Updated',      value: summary.updated },
                  { label: 'Raw signals',  value: summary.signals?.length || 0 },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.hi ? '#0d9488' : 'var(--slate)' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Executive signals */}
            {summary?.signals?.length > 0 && (
              <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(15,31,56,0.03)', border: '1px solid rgba(15,31,56,0.1)', borderRadius: 9 }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Executive Briefing</div>
                {summary.signals.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: '0.68rem', color: '#334155', lineHeight: 1.55 }}>
                    <span style={{ color: '#0d9488', flexShrink: 0 }}>▸</span>{s}
                  </div>
                ))}
              </div>
            )}

            {/* Diff items */}
            {diff.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.75rem' }}>
                No new findings this run — pipeline is up to date.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#334155' }}>{diff.length} findings — select what to import</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setSelected(new Set(diff.map((_,i)=>i)))} style={{ fontSize: '0.6rem', color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer' }}>Select all</button>
                    <button onClick={() => setSelected(new Set())} style={{ fontSize: '0.6rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                  </div>
                </div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
                  {diff.map((item, i) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderBottom: i < diff.length-1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', background: selected.has(i) ? 'rgba(13,148,136,0.04)' : 'var(--white)', borderLeft: `3px solid ${item.action==='add' ? '#0d9488' : '#f59e0b'}` }}>
                      <input type="checkbox" checked={selected.has(i)} onChange={() => toggleItem(i)} style={{ marginTop: 2, accentColor: '#0d9488', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: item.action==='add' ? '#0d9488' : '#b45309', background: item.action==='add' ? 'rgba(13,148,136,0.1)' : 'rgba(180,83,9,0.1)', padding: '1px 6px', borderRadius: 99 }}>{item.action}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate)' }}>{item.project?.Project || item.project?.project || '—'}</span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                          {item.project?.City || item.project?.city}, {item.project?.State || item.project?.state} · {item.project?.['MW IT'] || item.project?.mw_it || 0} MW · {item.reason}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={onClose} style={{ fontSize: '0.68rem', color: '#64748b', background: 'transparent', border: '1px solid var(--border)', padding: '7px 16px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
              {diff.length > 0 && (
                <button onClick={approveSelected} disabled={selected.size === 0}
                  style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white', background: selected.size > 0 ? '#0d9488' : '#94a3b8', border: 'none', padding: '7px 20px', borderRadius: 99, cursor: selected.size > 0 ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                  Import {addCount > 0 ? `${addCount} new` : ''}
                  {addCount > 0 && updateCount > 0 ? ' + ' : ''}
                  {updateCount > 0 ? `${updateCount} updates` : ''}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── done ── */}
        {phase === 'done' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>✓</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate)', marginBottom: 6 }}>Pipeline updated</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 20 }}>Approved projects added. Export to Excel to persist changes.</div>
            <button onClick={onClose} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white', background: '#0d9488', border: 'none', padding: '8px 24px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>Done</button>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Sources panel ─────────────────────────────────────────────────────────────
function SourcesPanel() {
  const [sources,   setSources]   = useState(SOURCES.map(s => ({ ...s })))
  const [menuId,    setMenuId]    = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editName,  setEditName]  = useState('')
  const [editUrl,   setEditUrl]   = useState('')
  const [editMode,  setEditMode]  = useState('name')
  const [adding,    setAdding]    = useState(false)
  const [newName,   setNewName]   = useState('')
  const menuRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function startEdit(src, mode) {
    setEditingId(src.id); setEditMode(mode)
    setEditName(src.name); setEditUrl(src.url || ''); setMenuId(null)
  }
  function commitEdit() {
    setSources(prev => prev.map(s => s.id === editingId
      ? { ...s, name: editMode === 'name' ? editName.trim() || s.name : s.name, url: editMode === 'url' ? editUrl.trim() : s.url }
      : s
    ))
    setEditingId(null)
  }
  function remove(id) { setSources(prev => prev.filter(s => s.id !== id)); setMenuId(null) }
  function addSource() {
    if (!newName.trim()) return
    setSources(prev => [...prev, { id: `s${Date.now()}`, name: newName.trim(), url: '', type: 'press', notes: '' }])
    setNewName(''); setAdding(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Research Sources</div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>{sources.length} sources · used by the research agent for this segment</div>
        </div>
        <button onClick={() => setAdding(a => !a)} style={{ fontSize: '0.62rem', fontWeight: 700, color: '#0d9488', background: 'rgba(13,148,136,0.08)', border: '1px solid rgba(13,148,136,0.2)', padding: '4px 10px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add</button>
      </div>

      {adding && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addSource(); if (e.key === 'Escape') setAdding(false) }} placeholder="Source name…" style={{ flex: 1, fontSize: '0.7rem', padding: '5px 10px', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 7, fontFamily: 'inherit', outline: 'none', color: 'var(--slate)', background: 'rgba(13,148,136,0.03)' }} />
          <button onClick={addSource} style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0d9488', background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.25)', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
          <button onClick={() => setAdding(false)} style={{ fontSize: '0.65rem', color: '#64748b', background: 'transparent', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        </div>
      )}

      <div style={{ overflowY: 'auto', flex: 1, maxHeight: 260, border: '1px solid var(--border)', borderRadius: 9, overflowX: 'hidden' }}>
        {sources.map((src, i) => {
          const typeCfg = TYPE_CFG[src.type] || TYPE_CFG.press
          const isEditing = editingId === src.id
          const isOdd = i % 2 === 1
          return (
            <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: isOdd ? 'rgba(248,250,252,0.6)' : 'var(--white)', borderBottom: i < sources.length - 1 ? '1px solid var(--border)' : 'none', position: 'relative' }}>
              <span style={{ fontSize: '0.55rem', fontWeight: 800, color: typeCfg.color, background: typeCfg.bg, padding: '1px 6px', borderRadius: 99, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{typeCfg.label}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing && editMode === 'name' ? (
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }} onBlur={commitEdit} style={{ width: '100%', fontSize: '0.7rem', padding: '2px 6px', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 4, fontFamily: 'inherit', outline: 'none' }} />
                ) : isEditing && editMode === 'url' ? (
                  <input autoFocus value={editUrl} onChange={e => setEditUrl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }} onBlur={commitEdit} placeholder="https://…" style={{ width: '100%', fontSize: '0.68rem', padding: '2px 6px', border: '1px solid rgba(13,148,136,0.3)', borderRadius: 4, fontFamily: 'var(--font-mono)', outline: 'none' }} />
                ) : (
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--slate)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{src.name}</div>
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.58rem', color: '#0d9488', textDecoration: 'none', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {src.url.replace('https://', '').replace('http://', '')}
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontStyle: 'italic' }}>no link</span>
                    )}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative' }} ref={menuId === src.id ? menuRef : null}>
                <button onClick={e => { e.stopPropagation(); setMenuId(id => id === src.id ? null : src.id) }} style={{ fontSize: '0.8rem', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 5px', borderRadius: 4, lineHeight: 1, fontFamily: 'inherit', ...(menuId === src.id ? { background: 'var(--off-white)', color: '#334155' } : {}) }} onMouseEnter={e => e.currentTarget.style.color = '#334155'} onMouseLeave={e => { if (menuId !== src.id) e.currentTarget.style.color = '#94a3b8' }}>···</button>
                {menuId === src.id && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 140, padding: '4px 0' }}>
                    {[
                      { label: 'Rename', action: () => startEdit(src, 'name') },
                      { label: 'Edit link', action: () => startEdit(src, 'url') },
                      { label: 'Remove', action: () => remove(src.id), danger: true },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} style={{ display: 'block', width: '100%', textAlign: 'left', fontSize: '0.68rem', fontWeight: 500, color: item.danger ? '#dc2626' : '#334155', background: 'transparent', border: 'none', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }} onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(220,38,38,0.05)' : 'var(--off-white)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── GOEM exposure summary ─────────────────────────────────────────────────────
function GoemExposure({ projects }) {
  const goemStats = useMemo(() => {
    const agg = {}
    projects.forEach(p => {
      if (!agg[p.goem]) agg[p.goem] = { name: p.goem, total: 0, open: 0, count: 0 }
      agg[p.goem].total += p.kvaEstimate
      agg[p.goem].count += 1
      if (p.koelLikelihood === 'high' || p.koelLikelihood === 'medium') agg[p.goem].open += p.kvaEstimate
    })
    return Object.values(agg).sort((a,b) => b.total - a.total)
  }, [projects])

  const maxKva = goemStats[0]?.total || 1
  const fmt = v => v >= 1000 ? `${(v/1000).toFixed(0)}k kVA` : `${v} kVA`
  const GOEM_COLORS = { Kala: '#db2777', Sunbeam: '#dc2626', IEC: '#2563eb', 'South-East': '#7c3aed', North: '#b45309' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.12em' }}>GOEM Exposure — Data Centers</div>
        <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>Total pipeline kVA by GOEM territory · High + Medium = KOEL addressable</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {goemStats.map(g => {
          const color = GOEM_COLORS[g.name] || '#64748b'
          const pct = (g.total / maxKva) * 100
          const openPct = g.total > 0 ? (g.open / g.total) * 100 : 0
          return (
            <div key={g.name}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate)' }}>{g.name}</span>
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{g.count} project{g.count !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0d9488', fontFamily: 'var(--font-mono)' }}>{fmt(g.open)}</span>
                  <span style={{ fontSize: '0.58rem', color: '#94a3b8', marginLeft: 4 }}>/ {fmt(g.total)} total</span>
                </div>
              </div>
              <div style={{ height: 7, background: 'var(--off-white)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: `${color}33`, borderRadius: 4, position: 'relative' }}>
                  {g.open > 0 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${openPct}%`, background: color, borderRadius: '4px 0 0 4px' }} />}
                </div>
              </div>
              <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginTop: 2 }}>
                {fmt(g.open)} addressable (H+M) · {Math.round((g.open/(g.total||1))*100)}% of territory pipeline
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Segment context strip ─────────────────────────────────────────────────────
function SegmentContext() {
  const POINTS = [
    { heading: 'kVA rule of thumb', body: '1 MW IT load → 1.4 MW DG backup (N+1). A 100 MW campus = ~56,000 kVA in gensets. Scale matters — this is big-ticket.' },
    { heading: 'Who KOEL competes against', body: 'Cummins owns hyperscalers (Google, Microsoft, AWS). KOEL is competitive in co-lo and enterprise DC, especially 500–1500 kVA. Caterpillar is a distant third.' },
    { heading: 'CPCB IV+ is the window', body: 'Pre-IV+ gensets must comply or be replaced. DC operators are under active compliance pressure — replacement tenders are running now, not in 2 years.' },
    { heading: 'Who signs the PO', body: 'DC Head / VP Infrastructure + Procurement, not Facilities. Operators buy in bulk and are repeat customers — one relationship = 5+ orders over a build-out.' },
  ]
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
      marginBottom: 24, padding: '16px 18px',
      background: 'rgba(15,31,56,0.03)',
      border: '1px solid rgba(15,31,56,0.1)',
      borderRadius: 12,
    }}>
      {POINTS.map((p, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{p.heading}</div>
          <div style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.65 }}>{p.body}</div>
        </div>
      ))}
    </div>
  )
}

// ── Competitor mapping section ────────────────────────────────────────────────
function CompetitorMapping({ projects }) {
  const [selected, setSelected] = useState(COMPETITOR_MAP[0]?.name || null)

  const comp = COMPETITOR_MAP.find(c => c.name === selected)

  // Projects contested with this competitor (have this comp in their competitors array)
  const contestedProjects = useMemo(() => {
    if (!comp) return []
    return projects.filter(p => (p.competitors || []).includes(comp.name))
  }, [projects, comp])

  // KOEL win/loss breakdown for contested projects
  const winCount  = contestedProjects.filter(p => p.koelLikelihood === 'high' || p.koelLikelihood === 'medium').length
  const lossCount = contestedProjects.filter(p => p.koelLikelihood === 'unlikely').length
  const openCount = contestedProjects.filter(p => p.koelLikelihood === 'low' || p.koelLikelihood === 'unknown').length
  const totalKva  = contestedProjects.reduce((s, p) => s + p.kvaEstimate, 0)
  const winKva    = contestedProjects.filter(p => p.koelLikelihood === 'high' || p.koelLikelihood === 'medium').reduce((s, p) => s + p.kvaEstimate, 0)

  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '24px',
    }}>
      {/* Header + competitor selector */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
            Competitor Landscape
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Select a competitor to see which deals KOEL contests with them
          </div>
        </div>

        {/* Competitor selector dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={selected || ''}
            onChange={e => setSelected(e.target.value)}
            style={{
              fontSize: '0.72rem', fontWeight: 700,
              color: comp ? comp.color : '#334155',
              background: comp ? `${comp.color}0d` : 'var(--off-white)',
              border: `1.5px solid ${comp ? comp.color : 'var(--border)'}`,
              padding: '7px 32px 7px 14px', borderRadius: 8,
              cursor: 'pointer', fontFamily: 'inherit',
              appearance: 'none', WebkitAppearance: 'none',
              minWidth: 180,
            }}
          >
            {COMPETITOR_MAP.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
          <div style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: comp ? comp.color : '#64748b', fontSize: '0.65rem',
          }}>▾</div>
        </div>
      </div>

      {comp && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

          {/* Left panel — competitor profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Threat badge + share */}
            <div style={{
              border: `1px solid var(--border)`, borderLeft: `4px solid ${comp.color}`,
              borderRadius: 10, padding: '14px 16px', background: 'var(--off-white)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--slate)' }}>{comp.name}</div>
                <span style={{
                  fontSize: '0.55rem', fontWeight: 800,
                  color: comp.threat === 'high' ? '#dc2626' : comp.threat === 'contest' ? '#b45309' : '#16a34a',
                  background: comp.threat === 'high' ? 'rgba(220,38,38,0.08)' : 'rgba(180,83,9,0.08)',
                  padding: '3px 9px', borderRadius: 99, letterSpacing: '0.08em', textTransform: 'uppercase',
                  border: `1px solid ${comp.threat === 'high' ? 'rgba(220,38,38,0.2)' : 'rgba(180,83,9,0.2)'}`,
                }}>
                  {comp.threat === 'high' ? 'High threat' : 'Contest'}
                </span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                Est. market share: <strong style={{ color: comp.color }}>{comp.shareEst}</strong>
              </div>
            </div>

            {/* Their ground */}
            <div>
              <div style={{ fontSize: '0.57rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>Their ground</div>
              {comp.strongholds.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
                  <span style={{ color: '#dc2626', fontSize: '0.6rem', flexShrink: 0, marginTop: 2, opacity: 0.7 }}>✕</span>
                  <span style={{ fontSize: '0.67rem', color: '#64748b', lineHeight: 1.55 }}>{s}</span>
                </div>
              ))}
            </div>

            {/* KOEL wins when */}
            <div>
              <div style={{ fontSize: '0.57rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 8 }}>KOEL wins when</div>
              {comp.koelWins.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
                  <span style={{ color: '#0d9488', fontSize: '0.6rem', flexShrink: 0, marginTop: 2 }}>✓</span>
                  <span style={{ fontSize: '0.67rem', color: '#334155', lineHeight: 1.55 }}>{w}</span>
                </div>
              ))}
            </div>

            {/* Tactical play */}
            <div style={{
              background: 'rgba(13,148,136,0.05)', border: '1px solid rgba(13,148,136,0.15)',
              borderRadius: 8, padding: '10px 13px', marginTop: 'auto',
            }}>
              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>Tactical play</div>
              <div style={{ fontSize: '0.67rem', color: '#475569', lineHeight: 1.65 }}>{comp.koelPlay}</div>
            </div>
          </div>

          {/* Right panel — contested deals */}
          <div>
            {/* Summary stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
              marginBottom: 16, padding: '12px 14px',
              background: `${comp.color}08`, borderRadius: 9, border: `1px solid ${comp.color}22`,
            }}>
              {[
                { label: 'Deals contested', value: contestedProjects.length || '0', sub: 'tracked in pipeline' },
                { label: 'KOEL favoured', value: winCount, sub: `${fmtKva(winKva)} addressable`, hi: true },
                { label: 'At risk / lost', value: lossCount, sub: 'KOEL unlikely', danger: true },
                { label: 'Total at stake', value: fmtKva(totalKva), sub: `${openCount} still open`, mono: true },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</div>
                  <div style={{
                    fontSize: s.mono ? '0.85rem' : '1.1rem', fontWeight: 800, lineHeight: 1.1,
                    color: s.hi ? '#0d9488' : s.danger ? '#dc2626' : 'var(--slate)',
                    fontFamily: s.mono ? 'var(--font-mono)' : 'inherit',
                  }}>{s.value}</div>
                  <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Project list */}
            {contestedProjects.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 160, gap: 8, color: '#94a3b8', textAlign: 'center',
                border: '1px dashed var(--border)', borderRadius: 10, padding: 24,
              }}>
                <div style={{ fontSize: '1.5rem', opacity: 0.3 }}>—</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>No deals tagged with {comp.name}</div>
                <div style={{ fontSize: '0.65rem', lineHeight: 1.6, maxWidth: 300 }}>
                  Use the <strong>Likely Competitor</strong> column in the pipeline table above to tag which projects involve this competitor.
                </div>
              </div>
            ) : (
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                {/* Mini header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '2fr 0.8fr 80px 90px 100px',
                  gap: 10, padding: '6px 14px',
                  background: '#f1f5f9', borderBottom: '2px solid var(--border)',
                }}>
                  {['Project', 'City', 'kVA', 'GOEM', 'KOEL Fit'].map(h => (
                    <div key={h} style={{ fontSize: '0.55rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{h}</div>
                  ))}
                </div>

                {contestedProjects.map((p, i) => {
                  const likelyCfg = LIKELIHOOD_CFG[p.koelLikelihood] || LIKELIHOOD_CFG.unknown
                  const isOdd = i % 2 === 1
                  return (
                    <div key={p.id} style={{
                      display: 'grid', gridTemplateColumns: '2fr 0.8fr 80px 90px 100px',
                      gap: 10, padding: '8px 14px',
                      background: isOdd ? 'rgba(248,250,252,0.7)' : 'var(--white)',
                      borderBottom: i < contestedProjects.length - 1 ? '1px solid var(--border)' : 'none',
                      alignItems: 'center',
                      borderLeft: `3px solid ${likelyCfg.color}`,
                    }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--slate)', lineHeight: 1.2 }}>{p.project}</div>
                        <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 1 }}>{p.operator}</div>
                      </div>
                      <div style={{ fontSize: '0.67rem', color: '#475569' }}>{p.city}</div>
                      <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#0d9488', fontFamily: 'var(--font-mono)' }}>{fmtKva(p.kvaEstimate)}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#334155' }}>{p.goem}</div>
                      <LikelihoodDots level={p.koelLikelihood} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────
export default function DCIntelligence() {
  const [projects, setProjects] = useState(() =>
    PROJECTS.map(p => ({ ...p, competitors: p.competitors || [] }))
  )
  const [showResearch, setShowResearch] = useState(false)

  function handleUpdateCompetitors(id, comps) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, competitors: comps } : p))
  }
  function handleImport(newRows) {
    setProjects(prev => [...prev, ...newRows])
  }
  function handleUpdateProject(id, fields) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
  }

  return (
    <div style={{
      marginTop: 32,
      paddingTop: 32,
      borderTop: '2px solid rgba(13,148,136,0.15)',
    }}>
      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 4, height: 22, background: '#0d9488', borderRadius: 2, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--slate)', letterSpacing: '-0.01em' }}>
            Data Centers · Pipeline & Coverage
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
            India DC capacity growth · Project pipeline · GOEM exposure · kVA addressable
          </div>
        </div>
      </div>

      {/* ── Project table (primary section — first thing after map) ──────── */}
      <div style={{
        background: 'var(--white)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '24px',
        marginBottom: 20,
      }}>
        <ProjectTable
          projects={projects}
          onUpdateCompetitors={handleUpdateCompetitors}
          onImport={handleImport}
          onUpdateProject={handleUpdateProject}
          onOpenResearch={() => setShowResearch(true)}
        />
      </div>

      {/* Executive context */}
      <SegmentContext />

      {/* Headline numbers */}
      <HeadlineStrip />

      {/* ── Charts row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
        <GrowthChart />
        <GeoChart />
      </div>

      {/* ── Bottom 50/50: Sources + GOEM Exposure ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px 16px' }}>
          <SourcesPanel />
        </div>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px 16px' }}>
          <GoemExposure projects={projects} />
        </div>
      </div>

      {/* ── Competitor mapping ───────────────────────────────────────────── */}
      <CompetitorMapping projects={projects} />

      {/* ── Research modal (portal-style, fixed overlay) ─────────────────── */}
      {showResearch && (
        <ResearchModal
          onClose={() => setShowResearch(false)}
          onImport={handleImport}
          existingProjects={projects}
        />
      )}
    </div>
  )
}
