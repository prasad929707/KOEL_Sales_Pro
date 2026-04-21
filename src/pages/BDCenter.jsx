// ─────────────────────────────────────────────────────────────────────────────
// BD Center — Business Development CRM
// India map (live lead pins) → pipeline table → add lead form
// Location: device GPS -OR- city search (Nominatim/OSM, free, no API key)
// Google Maps link auto-generated from lat/lon — clicking opens exact pin
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'

// ── Mobile hook ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isMobile
}
import { useNavigate } from 'react-router-dom'
import IndiaMap from '../components/IndiaMap'
import DCIntelligence from '../components/DCIntelligence'
import AdminPanel from './AdminPanel'
import { GOEM_DATA } from '../data/marksightData'
import { useLocationCapture, mapsUrl } from '../lib/locationCapture'
import { fetchLeads, insertLead, updateLead, subscribeLeads } from '../lib/bdLeads'
import { supabase } from '../lib/supabase'
import { fetchMyProfile, isAdminRole, ALL_SEGMENTS } from '../lib/userProfiles'
import { scanVisitingCard } from '../lib/groqVision'

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGES = [
  { id: 'new',         label: 'New',        color: '#64748b' },
  { id: 'qualified',   label: 'Qualified',  color: '#2563eb' },
  { id: 'proposal',    label: 'Proposal',   color: '#7c3aed' },
  { id: 'negotiation', label: 'Negotiation',color: '#d97706' },
  { id: 'won',         label: 'Won',        color: '#16a34a' },
  { id: 'lost',        label: 'Lost',       color: '#dc2626' },
  { id: 'stalled',     label: 'Stalled',    color: '#94a3b8' },
]

const SEGMENTS = [
  'Data Centers', 'Real Estate', 'Healthcare', 'Hospitality',
  'Telecom', 'Infrastructure', 'Industrial', 'Other',
]

const LEAD_SOURCES = [
  'Visiting Card', 'Referral', 'Cold Outreach', 'Tender / RFQ',
  'Exhibition', 'GOEM Introduction', 'Other',
]

function stageFor(id) { return STAGES.find(s => s.id === id) || STAGES[0] }

function goemForState(state) {
  for (const [id, g] of Object.entries(GOEM_DATA)) {
    if (g.states?.includes(state)) return { id, name: g.name, color: g.color }
  }
  return null
}

function fmtKva(kva) {
  if (!kva) return '—'
  if (kva >= 1000) return `${(kva / 1000).toFixed(0)}k kVA`
  return `${kva} kVA`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
}

function emptyLead() {
  return {
    id: crypto.randomUUID(),
    company: '', contact: '', phone: '', email: '', designation: '',
    city: '', district: '', state: '',
    lat: null, lon: null, mapsUrl: '',
    segment: 'Data Centers', kvaEstimate: '',
    stage: 'new', owner: '',
    source: 'Cold Outreach',
    notes: '', nextStep: '', nextStepDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ── Nominatim city search (free, no API key) ──────────────────────────────────
// Searches within India only. Returns [{label, city, district, state, lat, lon}]
async function searchCity(query) {
  if (!query || query.length < 3) return []
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=6`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'KirloskarSalesPro/1.0 (prasad929707@gmail.com)' },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.map(item => {
    const a = item.address || {}
    const city     = a.city || a.town || a.village || a.municipality || a.county || ''
    const district = a.county || a.state_district || ''
    const state    = a.state || ''
    return {
      label:    [city, district, state].filter(Boolean).join(', ') || item.display_name,
      city, district, state,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }
  }).filter(r => r.state)
}

// ── City search input with dropdown ──────────────────────────────────────────
function CitySearch({ onSelect }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const timerRef                = useRef(null)
  const wrapRef                 = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    if (val.length < 3) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchCity(val)
      setResults(res)
      setOpen(res.length > 0)
      setLoading(false)
    }, 350)
  }

  function pick(item) {
    setQuery(item.label)
    setOpen(false)
    onSelect(item)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>
        Search City / Area
      </label>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={handleChange}
          placeholder="Type city name… (e.g. Pune, Navi Mumbai)"
          style={{
            width: '100%', padding: '7px 32px 7px 10px', borderRadius: 7, border: '1px solid var(--border)',
            fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none',
            background: 'var(--white)', color: 'var(--slate)', boxSizing: 'border-box',
          }}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#94a3b8' }}>…</span>
        )}
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: 2,
        }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => pick(r)} style={{
              display: 'block', width: '100%', padding: '9px 14px', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>{r.city || r.district}</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 1 }}>{[r.district, r.state].filter(Boolean).join(', ')}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── StagePill ─────────────────────────────────────────────────────────────────
function StagePill({ stage }) {
  const s = stageFor(stage)
  return (
    <span style={{
      fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
      background: s.color + '18', color: s.color, border: `1px solid ${s.color}30`,
    }}>
      {s.label}
    </span>
  )
}

// ── Pipeline summary strip ────────────────────────────────────────────────────
function PipelineStrip({ leads }) {
  const active   = leads.filter(l => !['won', 'lost'].includes(l.stage))
  const totalKva = active.reduce((s, l) => s + (Number(l.kvaEstimate) || 0), 0)
  const wonKva   = leads.filter(l => l.stage === 'won').reduce((s, l) => s + (Number(l.kvaEstimate) || 0), 0)
  const stateCounts = {}
  active.forEach(l => { if (l.state) stateCounts[l.state] = (stateCounts[l.state] || 0) + 1 })
  const topState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div style={{
      background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)',
      borderRadius: 10, padding: '12px 20px', marginBottom: 18,
      display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap',
    }}>
      {[
        { label: 'Active leads',  value: String(active.length),   hi: true  },
        { label: 'Pipeline kVA', value: fmtKva(totalKva),         hi: true  },
        { label: 'Won kVA',      value: fmtKva(wonKva),           hi: false },
        { label: 'Top state',    value: topState ? `${topState[0]} · ${topState[1]}` : '—', hi: false },
      ].map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          {i > 0 && <div style={{ width: 1, height: 28, background: 'rgba(124,58,237,0.15)', margin: '0 22px' }} />}
          <div>
            <div style={{ fontSize: '0.58rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: s.hi ? '#7c3aed' : '#334155', fontFamily: 'var(--font-mono)' }}>{s.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Add Lead Form ─────────────────────────────────────────────────────────────
function AddLeadForm({ onSave, onCancel, availableSegments = SEGMENTS }) {
  const isMobile                    = useIsMobile()
  const [form, setForm]             = useState(emptyLead())
  const [locMode, setLocMode]       = useState('search') // 'gps' | 'search'
  const { capture, loading: gpsLoading, error: gpsError } = useLocationCapture()
  const [scanning,  setScanning]   = useState(false)
  const [scanDone,  setScanDone]   = useState(false)
  const [scanError, setScanError]  = useState('')
  const cardInputRef               = useRef(null)

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleCardScan(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true); setScanError(''); setScanDone(false)
    try {
      const ex = await scanVisitingCard(file)
      setForm(f => ({
        ...f,
        company:     ex.company     || f.company,
        contact:     ex.contact     || f.contact,
        phone:       ex.phone       || f.phone,
        email:       ex.email       || f.email,
        designation: ex.designation || f.designation,
        // append website to notes if found
        notes: ex.website
          ? (f.notes ? f.notes + '\nWebsite: ' + ex.website : 'Website: ' + ex.website)
          : f.notes,
      }))
      setScanDone(true)
      setTimeout(() => setScanDone(false), 3500)
    } catch (err) {
      setScanError(err.message || 'Card scan failed — try a clearer photo.')
    } finally {
      setScanning(false)
      e.target.value = ''
    }
  }

  // GPS capture
  async function handleGps() {
    const result = await capture()
    if (result) {
      setForm(f => ({
        ...f,
        lat: result.lat, lon: result.lon,
        city:     result.city     || f.city,
        district: result.district || f.district,
        state:    result.state    || f.state,
        mapsUrl:  result.mapsUrl,
      }))
    }
  }

  // City search selection
  function handleCitySelect(item) {
    setForm(f => ({
      ...f,
      city:     item.city,
      district: item.district,
      state:    item.state,
      lat:      item.lat,
      lon:      item.lon,
      mapsUrl:  mapsUrl(item.lat, item.lon),
    }))
  }

  function handleSave() {
    if (!form.company.trim()) return
    const goem = goemForState(form.state)
    onSave({
      ...form,
      kvaEstimate: Number(form.kvaEstimate) || null,
      goemId:   goem?.id   || null,
      goemName: goem?.name || null,
      mapsUrl:  form.mapsUrl || (form.lat && form.lon ? mapsUrl(form.lat, form.lon) : ''),
      updatedAt: new Date().toISOString(),
    })
  }

  const goem = goemForState(form.state)

  const fieldPad = isMobile ? '11px 13px' : '7px 10px'
  const fieldFs  = isMobile ? '1rem'      : '0.82rem'

  const inp = (label, key, opts = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
      <input
        type={opts.type || 'text'}
        value={form[key]}
        placeholder={opts.placeholder || ''}
        onChange={e => set(key, e.target.value)}
        style={{ padding: fieldPad, borderRadius: 8, border: '1px solid var(--border)', fontSize: fieldFs, fontFamily: 'inherit', outline: 'none', background: 'var(--white)', color: 'var(--slate)' }}
      />
    </div>
  )

  const sel = (label, key, options) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</label>
      <select value={form[key]} onChange={e => set(key, e.target.value)}
        style={{ padding: fieldPad, borderRadius: 8, border: '1px solid var(--border)', fontSize: fieldFs, fontFamily: 'inherit', outline: 'none', background: 'var(--white)', color: 'var(--slate)', cursor: 'pointer' }}>
        {options.map(o => (
          <option key={typeof o === 'string' ? o : o.id} value={typeof o === 'string' ? o : o.id}>
            {typeof o === 'string' ? o : o.label}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderLeft: '4px solid #7c3aed', borderRadius: 12,
      padding: '28px 28px 24px', marginBottom: 24,
    }}>
      {/* Hidden file input for card scan */}
      <input
        ref={cardInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleCardScan}
      />

      {/* Form header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--slate)' }}>Add Lead</div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>Use GPS if you're at the site, or search the city name</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Card scan button */}
          <button
            onClick={() => cardInputRef.current?.click()}
            disabled={scanning}
            title="Take a photo of a visiting card — AI fills the form"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8,
              background: scanDone
                ? 'rgba(22,163,74,0.08)'
                : scanning
                  ? '#f8fafc'
                  : 'rgba(124,58,237,0.07)',
              border: `1px solid ${scanDone ? 'rgba(22,163,74,0.35)' : scanning ? 'var(--border)' : 'rgba(124,58,237,0.25)'}`,
              color: scanDone ? '#16a34a' : scanning ? '#94a3b8' : '#7c3aed',
              fontSize: '0.75rem', fontWeight: 700,
              cursor: scanning ? 'default' : 'pointer', fontFamily: 'inherit',
              transition: 'all 200ms',
            }}
          >
            {scanning
              ? <><span style={{ display: 'inline-block', animation: 'koel-spin 0.8s linear infinite' }}>↻</span> Scanning…</>
              : scanDone
                ? <>✓ Card filled</>
                : <>📷 Scan Card</>
            }
          </button>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>×</button>
        </div>
      </div>
      {scanError && (
        <div style={{ fontSize: '0.72rem', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '6px 12px', marginBottom: 14 }}>
          {scanError}
        </div>
      )}

      {/* Lead details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? '12px' : '14px 18px', marginBottom: 20 }}>
        {inp('Company *', 'company', { placeholder: 'e.g. Adani Green Energy' })}
        {inp('Contact Name', 'contact', { placeholder: 'Person you met' })}
        {inp('Designation', 'designation', { placeholder: 'e.g. GM Projects' })}
        {inp('Phone', 'phone', { placeholder: '+91 98765 43210', type: 'tel' })}
        {inp('Email', 'email', { placeholder: 'name@company.com', type: 'email' })}
        {sel('Segment', 'segment', availableSegments)}
        {inp('kVA Estimate', 'kvaEstimate', { placeholder: '2500', type: 'number' })}
        {sel('Stage', 'stage', STAGES)}
        {sel('Lead Source', 'source', LEAD_SOURCES)}
        {inp('Owner / Rep', 'owner', { placeholder: 'Your name' })}
        {inp('Next Step Date', 'nextStepDate', { type: 'date' })}
      </div>

      {/* ── Location section ── */}
      <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 18px', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Location</div>
          {/* Toggle: GPS vs Search */}
          <div style={{ display: 'flex', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 99, padding: 2, gap: 2 }}>
            {[{ id: 'gps', label: '📍 Use GPS' }, { id: 'search', label: '🔍 Search City' }].map(opt => (
              <button key={opt.id} onClick={() => setLocMode(opt.id)} style={{
                padding: '4px 12px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700,
                background: locMode === opt.id ? '#7c3aed' : 'transparent',
                color: locMode === opt.id ? 'white' : '#64748b',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        {locMode === 'gps' ? (
          <div>
            <button onClick={handleGps} disabled={gpsLoading} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8,
              background: gpsLoading ? '#f1f5f9' : 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.25)', color: '#7c3aed',
              fontSize: '0.78rem', fontWeight: 700, cursor: gpsLoading ? 'default' : 'pointer', fontFamily: 'inherit',
            }}>
              {gpsLoading
                ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span> Getting location…</>
                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg> Capture device location</>
              }
            </button>
            {gpsError && <div style={{ fontSize: '0.72rem', color: '#dc2626', marginTop: 8 }}>{gpsError}</div>}
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 8 }}>Works best on mobile. Fills city, district, state and pins on map.</div>
          </div>
        ) : (
          <CitySearch onSelect={handleCitySelect} />
        )}

        {/* Location preview — shown once lat/lon are set */}
        {form.lat && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, padding: '10px 14px', background: 'var(--white)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
                {[form.city, form.district, form.state].filter(Boolean).join(', ')}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                {form.lat.toFixed(4)}, {form.lon.toFixed(4)}
              </div>
            </div>
            {goem && (
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: goem.color }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: goem.color, display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                {goem.name}
              </span>
            )}
            <a href={form.mapsUrl} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Google Maps ↗
            </a>
          </div>
        )}
      </div>

      {/* Notes + Next step */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '0 18px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
            placeholder="Context, requirements, decision timeline…"
            style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', background: 'var(--white)', color: 'var(--slate)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Next Step</label>
          <textarea value={form.nextStep} onChange={e => set('nextStep', e.target.value)} rows={3}
            placeholder="What happens next, who owns it, by when…"
            style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', resize: 'vertical', background: 'var(--white)', color: 'var(--slate)' }} />
        </div>
      </div>

      {/* Save / Cancel */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={!form.company.trim()} style={{
          padding: '9px 24px', borderRadius: 8,
          background: form.company.trim() ? '#7c3aed' : '#e2e8f0',
          color: form.company.trim() ? 'white' : '#94a3b8',
          border: 'none', fontSize: '0.82rem', fontWeight: 700,
          cursor: form.company.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
        }}>Save Lead</button>
        <button onClick={onCancel} style={{
          padding: '9px 18px', borderRadius: 8, background: 'transparent',
          border: '1px solid var(--border)', color: '#475569',
          fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
        }}>Cancel</button>
      </div>
    </div>
  )
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────
function DashboardTab({ leads, onNavigate }) {
  const isMobile = useIsMobile()
  const now = new Date()

  const funnel = STAGES.map(s => {
    const sl = leads.filter(l => l.stage === s.id)
    return { ...s, count: sl.length, kva: sl.reduce((sum, l) => sum + (Number(l.kvaEstimate) || 0), 0) }
  })
  const maxCount = Math.max(...funnel.map(f => f.count), 1)

  const leaderboard = useMemo(() => {
    const map = {}
    leads.forEach(l => {
      const key = l.owner || '(unassigned)'
      if (!map[key]) map[key] = { owner: key, count: 0, active: 0, won: 0 }
      const kva = Number(l.kvaEstimate) || 0
      map[key].count++
      if (!['won','lost'].includes(l.stage)) map[key].active += kva
      if (l.stage === 'won') map[key].won += kva
    })
    return Object.values(map).sort((a, b) => b.active - a.active)
  }, [leads])

  const overdue = leads.filter(l =>
    l.nextStepDate && new Date(l.nextStepDate) < now && !['won','lost'].includes(l.stage)
  ).sort((a, b) => new Date(a.nextStepDate) - new Date(b.nextStepDate))

  const dueSoon = leads.filter(l => {
    if (!l.nextStepDate || ['won','lost'].includes(l.stage)) return false
    const diff = (new Date(l.nextStepDate) - now) / 86400000
    return diff >= 0 && diff <= 3
  })

  const recentCutoff = new Date(now.getTime() - 7 * 86400000)
  const recent = leads
    .filter(l => new Date(l.createdAt) > recentCutoff)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)

  const totalActive = leads.filter(l => !['won','lost'].includes(l.stage))
  const totalActiveKva = totalActive.reduce((s, l) => s + (Number(l.kvaEstimate) || 0), 0)
  const totalWonKva   = leads.filter(l => l.stage === 'won').reduce((s, l) => s + (Number(l.kvaEstimate) || 0), 0)

  const card = (label, value, color) => (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: isMobile ? '16px' : '18px 22px' }}>
      <div style={{ fontSize: isMobile ? '1.5rem' : '1.7rem', fontWeight: 800, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Summary numbers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10 }}>
        {card('Total leads',    leads.length,           '#334155')}
        {card('Active leads',   totalActive.length,     '#7c3aed')}
        {card('Pipeline kVA',   fmtKva(totalActiveKva), '#7c3aed')}
        {card('Won kVA',        fmtKva(totalWonKva),    '#16a34a')}
      </div>

      {/* ── Stage funnel ── */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px' : '20px 24px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)', marginBottom: 16 }}>Pipeline Funnel</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {funnel.map(s => (
            <div key={s.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>{s.label}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', fontFamily: 'var(--font-mono)' }}>{s.count} lead{s.count !== 1 ? 's' : ''}</span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{fmtKva(s.kva)}</span>
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9' }}>
                <div style={{ height: '100%', borderRadius: 99, background: s.color, width: `${(s.count / maxCount) * 100}%`, transition: 'width 400ms ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Follow-up alerts ── */}
      {(overdue.length > 0 || dueSoon.length > 0) && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px' : '20px 24px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            Follow-up Alerts
            {overdue.length > 0 && <span style={{ fontSize: '0.62rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 99 }}>{overdue.length} overdue</span>}
            {dueSoon.length > 0 && <span style={{ fontSize: '0.62rem', fontWeight: 700, background: 'rgba(217,119,6,0.08)', color: '#d97706', padding: '2px 8px', borderRadius: 99 }}>{dueSoon.length} due soon</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[...overdue.map(l => ({ ...l, _t: 'overdue' })), ...dueSoon.map(l => ({ ...l, _t: 'soon' }))].map(l => (
              <div key={l.id + l._t} onClick={() => onNavigate(l.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 9, cursor: 'pointer',
                background: l._t === 'overdue' ? '#fef2f2' : 'rgba(217,119,6,0.04)',
                border: `1px solid ${l._t === 'overdue' ? '#fecaca' : 'rgba(217,119,6,0.2)'}`,
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{l._t === 'overdue' ? '⚠️' : '⏰'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.company}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nextStep || 'No next step set'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: l._t === 'overdue' ? '#dc2626' : '#d97706' }}>{fmtDate(l.nextStepDate)}</div>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 1 }}>{l.owner || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Team leaderboard ── */}
      {leaderboard.length > 0 && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px' : '20px 24px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)', marginBottom: 14 }}>Team Leaderboard</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 48px 80px' : '1fr 60px 110px 100px', gap: 8, padding: '4px 8px' }}>
              {['Name','Leads','Pipeline kVA',...(isMobile ? [] : ['Won kVA'])].map(h => (
                <div key={h} style={{ fontSize: '0.58rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: h === 'Name' ? 'left' : 'right' }}>{h}</div>
              ))}
            </div>
            {leaderboard.map((row, i) => (
              <div key={row.owner} style={{
                display: 'grid', gridTemplateColumns: isMobile ? '1fr 48px 80px' : '1fr 60px 110px 100px',
                gap: 8, padding: '10px 8px', borderRadius: 8, alignItems: 'center',
                background: i === 0 ? 'rgba(124,58,237,0.04)' : 'transparent',
                border: i === 0 ? '1px solid rgba(124,58,237,0.1)' : '1px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.85rem', width: 22, flexShrink: 0 }}>
                    {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700 }}>{i+1}</span>}
                  </span>
                  <span style={{ fontSize: isMobile ? '0.82rem' : '0.8rem', fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.owner}</span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{row.count}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7c3aed', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{fmtKva(row.active)}</div>
                {!isMobile && <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16a34a', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{fmtKva(row.won)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Added this week ── */}
      {recent.length > 0 && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '16px' : '20px 24px', marginBottom: 8 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)', marginBottom: 14 }}>
            Added This Week
            <span style={{ marginLeft: 8, fontSize: '0.65rem', fontWeight: 500, color: '#94a3b8' }}>{recent.length} lead{recent.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map(l => {
              const s = stageFor(l.stage)
              return (
                <div key={l.id} onClick={() => onNavigate(l.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 8, cursor: 'pointer', background: '#f8fafc',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.company}</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{l.segment}{l.city ? ` · ${l.city}` : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>{fmtKva(l.kvaEstimate)}</div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{l.owner || '—'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Lead card (mobile pipeline view) ─────────────────────────────────────────
function LeadCard({ lead, onNavigate, onStageChange }) {
  const [showStages, setShowStages] = useState(false)
  const s = stageFor(lead.stage)
  const overdue = lead.nextStepDate && new Date(lead.nextStepDate) < new Date() && !['won','lost'].includes(lead.stage)
  const soon    = !overdue && lead.nextStepDate && (new Date(lead.nextStepDate) - new Date()) < 3 * 86400000

  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)',
      borderLeft: `3px solid ${s.color}`, borderRadius: 10, padding: '14px 16px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div onClick={() => onNavigate(lead.id)} style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--slate)', marginBottom: 5, cursor: 'pointer' }}>
            {lead.company}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: s.color, background: s.color + '18', padding: '2px 8px', borderRadius: 99 }}>{s.label}</span>
            {lead.segment && <span style={{ fontSize: '0.62rem', color: '#64748b' }}>{lead.segment}</span>}
            {lead.city && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>📍 {lead.city}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7c3aed', fontFamily: 'var(--font-mono)' }}>{fmtKva(lead.kvaEstimate)}</div>
          {lead.owner && <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 2 }}>{lead.owner}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 }}>
        <div>
          {lead.nextStepDate && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 6,
              color: overdue ? '#dc2626' : soon ? '#d97706' : '#64748b',
              background: overdue ? '#fef2f2' : soon ? 'rgba(217,119,6,0.08)' : '#f8fafc',
            }}>
              {overdue ? '⚠ ' : soon ? '⏰ ' : '📅 '}{fmtDate(lead.nextStepDate)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setShowStages(v => !v)} style={{
            padding: '6px 12px', borderRadius: 7, fontSize: '0.65rem', fontWeight: 700,
            background: '#f8fafc', border: '1px solid var(--border)', color: '#64748b',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Stage ↕</button>
          <button onClick={() => onNavigate(lead.id)} style={{
            padding: '6px 14px', borderRadius: 7, fontSize: '0.65rem', fontWeight: 700,
            background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
            color: '#7c3aed', cursor: 'pointer', fontFamily: 'inherit',
          }}>Open →</button>
        </div>
      </div>

      {showStages && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {STAGES.map(st => (
            <button key={st.id} onClick={() => { onStageChange(lead.id, st.id); setShowStages(false) }} style={{
              padding: '5px 12px', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700,
              background: lead.stage === st.id ? st.color : 'transparent',
              color: lead.stage === st.id ? 'white' : st.color,
              border: `1px solid ${st.color}`, cursor: 'pointer', fontFamily: 'inherit',
            }}>{st.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pipeline table ────────────────────────────────────────────────────────────
const COL = '2fr 1.1fr 0.9fr 90px 110px 88px 100px'

function LeadRow({ lead, isExpanded, onToggle, onStageChange, onNavigate }) {
  const goem  = goemForState(lead.state)
  const stage = stageFor(lead.stage)

  return (
    <>
      <div
        onClick={onToggle}
        style={{
          display: 'grid', gridTemplateColumns: COL,
          padding: '11px 16px', cursor: 'pointer', gap: 8, alignItems: 'center',
          background: isExpanded ? 'rgba(124,58,237,0.03)' : 'transparent',
          borderBottom: isExpanded ? 'none' : '1px solid rgba(148,163,184,0.1)',
        }}
        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(0,0,0,0.015)' }}
        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = isExpanded ? 'rgba(124,58,237,0.03)' : 'transparent' }}
      >
        {/* Company */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--slate)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.company}</div>
            <div style={{ fontSize: '0.64rem', color: '#64748b', marginTop: 1 }}>{lead.segment}</div>
          </div>
          <button onClick={e => { e.stopPropagation(); onNavigate(lead.id) }} title="Open lead"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px 4px', borderRadius: 4, flexShrink: 0, lineHeight: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.background = 'rgba(124,58,237,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'none' }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1H2a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9"/>
              <path d="M9 1h5v5"/><path d="M15 1 8 8"/>
            </svg>
          </button>
        </div>

        {/* Location + Maps link */}
        <div>
          <div style={{ fontSize: '0.78rem', color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{lead.city || '—'}</span>
            {lead.mapsUrl && (
              <a href={lead.mapsUrl} target="_blank" rel="noreferrer"
                onClick={e => e.stopPropagation()}
                title="Open in Google Maps"
                style={{ color: '#2563eb', lineHeight: 0, flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </a>
            )}
          </div>
          <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{lead.state || ''}</div>
        </div>

        {/* kVA */}
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', fontFamily: 'var(--font-mono)' }}>
          {fmtKva(lead.kvaEstimate)}
        </div>

        {/* GOEM */}
        <div>
          {goem
            ? <span style={{ fontSize: '0.68rem', fontWeight: 700, color: goem.color }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: goem.color, display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
                {goem.name}
              </span>
            : <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>—</span>
          }
        </div>

        {/* Stage */}
        <StagePill stage={lead.stage} />

        {/* Owner */}
        <div style={{ fontSize: '0.72rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.owner || '—'}</div>

        {/* Last touch */}
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>{fmtDate(lead.updatedAt)}</div>
      </div>

      {isExpanded && (
        <div style={{
          padding: '14px 20px 18px', background: 'rgba(124,58,237,0.025)',
          borderBottom: '1px solid rgba(124,58,237,0.1)',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px 24px',
        }}>
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Contact</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--slate)', fontWeight: 600 }}>{lead.contact || '—'}</div>
            {lead.phone && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{lead.phone}</div>}
            {lead.mapsUrl && (
              <a href={lead.mapsUrl} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: '0.7rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {[lead.city, lead.district, lead.state].filter(Boolean).join(', ')} ↗
              </a>
            )}
          </div>

          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Notes</div>
            <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.6 }}>{lead.notes || <span style={{ color: '#94a3b8' }}>None</span>}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Next Step</div>
            <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.6 }}>{lead.nextStep || <span style={{ color: '#94a3b8' }}>Not set</span>}</div>
            {lead.nextStepDate && <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 600, marginTop: 4 }}>→ {fmtDate(lead.nextStepDate)}</div>}

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Move to</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {STAGES.map(s => (
                  <button key={s.id} onClick={e => { e.stopPropagation(); onStageChange(lead.id, s.id) }} style={{
                    padding: '3px 9px', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    background: lead.stage === s.id ? s.color : 'transparent',
                    color: lead.stage === s.id ? 'white' : s.color,
                    border: `1px solid ${s.color}`,
                  }}>{s.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function exportCsv(leads) {
  const headers = ['Company','Contact','Designation','Phone','Email','City','District','State','Segment','kVA','Stage','Owner','Source','Next Step','Next Step Date','Notes','Added']
  const rows = leads.map(l => [
    l.company, l.contact, l.designation, l.phone, l.email,
    l.city, l.district, l.state, l.segment, l.kvaEstimate ?? '',
    l.stage, l.owner, l.source, l.nextStep, l.nextStepDate, l.notes,
    l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN') : '',
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`))
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url
  a.download = `KOEL_BD_Pipeline_${new Date().toISOString().slice(0,10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

function PipelineTable({ leads, drillState, onStageChange, onNavigate }) {
  const isMobile    = useIsMobile()
  const [expandedId, setExpandedId] = useState(null)
  const [sortKey,    setSortKey]    = useState('updatedAt')
  const [sortDir,    setSortDir]    = useState(-1)
  const [stageFilter, setStageFilter] = useState('all')

  const visible = useMemo(() => {
    let rows = drillState ? leads.filter(l => l.state === drillState) : leads
    if (stageFilter !== 'all') rows = rows.filter(l => l.stage === stageFilter)
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
      return av < bv ? sortDir : av > bv ? -sortDir : 0
    })
  }, [leads, drillState, stageFilter, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
  }

  const hdr = (label, key) => (
    <div onClick={() => toggleSort(key)} style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', cursor: 'pointer', userSelect: 'none' }}>
      {label}{sortKey === key ? (sortDir === -1 ? ' ↓' : ' ↑') : ''}
    </div>
  )

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate)', marginRight: 4 }}>
          Pipeline
          {drillState && <span style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 500, marginLeft: 6 }}>· {drillState}</span>}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{visible.length} lead{visible.length !== 1 ? 's' : ''}</div>
        <button
          onClick={() => exportCsv(visible)}
          title="Export current view as CSV"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 7, fontSize: '0.62rem', fontWeight: 700,
            background: 'transparent', border: '1px solid var(--border)',
            color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.borderColor = 'rgba(22,163,74,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          ↓ CSV
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['all', ...STAGES.map(s => s.id)].map(s => {
          const stage = STAGES.find(x => x.id === s)
          const active = stageFilter === s
          return (
            <button key={s} onClick={() => setStageFilter(s)} style={{
              padding: '3px 9px', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              background: active ? (stage?.color || '#334155') : 'transparent',
              color: active ? 'white' : (stage?.color || '#334155'),
              border: `1px solid ${stage?.color || '#334155'}`,
            }}>{s === 'all' ? 'All' : stage.label}</button>
          )
        })}
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: COL, padding: '9px 16px', gap: 8, background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
        {hdr('Company / Segment', 'company')}
        {hdr('Location', 'city')}
        {hdr('kVA Est.', 'kvaEstimate')}
        {hdr('GOEM', 'goemName')}
        {hdr('Stage', 'stage')}
        {hdr('Owner', 'owner')}
        {hdr('Last Touch', 'updatedAt')}
      </div>

      {visible.length === 0
        ? <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
            No leads yet — click <strong>+ Add Lead</strong> to start building the pipeline.
          </div>
        : isMobile
          ? <div style={{ padding: '12px 12px 4px' }}>
              {visible.map(lead => (
                <LeadCard key={lead.id} lead={lead} onNavigate={onNavigate} onStageChange={onStageChange} />
              ))}
            </div>
          : visible.map(lead => (
              <LeadRow key={lead.id} lead={lead}
                isExpanded={expandedId === lead.id}
                onToggle={() => setExpandedId(x => x === lead.id ? null : lead.id)}
                onStageChange={onStageChange}
                onNavigate={onNavigate} />
            ))
      }
    </div>
  )
}

// ── GOEM summary (right 50%) ──────────────────────────────────────────────────
function GoemSummary({ leads }) {
  const byGoem = useMemo(() => {
    const map = {}
    leads.forEach(l => {
      const key = l.goemId || 'unknown'
      if (!map[key]) map[key] = { name: l.goemName || 'Unknown', color: GOEM_DATA[key]?.color || '#94a3b8', total: 0, active: 0 }
      const kva = Number(l.kvaEstimate) || 0
      map[key].total += kva
      if (!['won', 'lost'].includes(l.stage)) map[key].active += kva
    })
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [leads])

  const maxKva = byGoem[0]?.total || 1

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)', marginBottom: 4 }}>GOEM Coverage</div>
      <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 18 }}>Pipeline kVA by territory</div>
      {byGoem.length === 0
        ? <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Add leads with a state to see GOEM distribution.</div>
        : byGoem.map(g => (
            <div key={g.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#334155' }}>{g.name}</span>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>{fmtKva(g.total)}</span>
              </div>
              <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, width: `${(g.total / maxKva) * 100}%`, background: g.color + '40', borderRadius: 99 }} />
                <div style={{ position: 'absolute', inset: 0, width: `${(g.active / maxKva) * 100}%`, background: g.color, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: 3 }}>{fmtKva(g.active)} active pipeline</div>
            </div>
          ))
      }
    </div>
  )
}

// ── Sources panel (left 50%) ──────────────────────────────────────────────────
const INITIAL_SOURCES = [
  { id: 's1', name: 'JLL India Data Centre Report 2024',   type: 'Report',     url: 'https://www.jll.co.in/en/trends-and-insights/research' },
  { id: 's2', name: 'MahaRERA / KaRERA State Portals',     type: 'Regulatory', url: 'https://maharera.mahaonline.gov.in' },
  { id: 's3', name: 'PM-JAY & NABH Hospital Pipeline',     type: 'Government', url: 'https://pmjay.gov.in' },
  { id: 's4', name: 'TRAI 5G Rollout Tracker',             type: 'Regulatory', url: 'https://www.trai.gov.in' },
  { id: 's5', name: 'NHAI Infrastructure Pipeline',        type: 'Government', url: 'https://nhai.gov.in' },
]

const TYPE_COLORS = { Report: '#2563eb', Regulatory: '#7c3aed', Government: '#16a34a', Field: '#d97706', Other: '#64748b' }

function SourcesPanel() {
  const [sources, setSources] = useState(INITIAL_SOURCES)
  const [menuOpen, setMenuOpen] = useState(null)
  const [editing,  setEditing]  = useState(null)
  const [adding,   setAdding]   = useState(false)
  const [newName,  setNewName]  = useState('')

  function startEdit(id, field, current) { setEditing({ id, field, value: current }); setMenuOpen(null) }
  function commitEdit() {
    if (!editing) return
    setSources(s => s.map(x => x.id === editing.id ? { ...x, [editing.field]: editing.value } : x))
    setEditing(null)
  }
  function removeSource(id) { setSources(s => s.filter(x => x.id !== id)); setMenuOpen(null) }
  function addSource() {
    if (!newName.trim()) return
    setSources(s => [...s, { id: crypto.randomUUID(), name: newName.trim(), type: 'Other', url: '' }])
    setNewName(''); setAdding(false)
  }

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--slate)' }}>Research Sources</div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 2 }}>Market data & pipeline feeds</div>
        </div>
        <button onClick={() => setAdding(true)} style={{ padding: '4px 12px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, background: 'transparent', border: '1px solid var(--border)', color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>+ Add</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 260, overflowY: 'auto' }}>
        {sources.map(src => (
          <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px', borderRadius: 6, position: 'relative' }}>
            <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: (TYPE_COLORS[src.type] || '#64748b') + '18', color: TYPE_COLORS[src.type] || '#64748b', flexShrink: 0 }}>{src.type}</span>

            {editing?.id === src.id && editing.field === 'name'
              ? <input autoFocus value={editing.value} onChange={e => setEditing(x => ({ ...x, value: e.target.value }))}
                  onBlur={commitEdit} onKeyDown={e => e.key === 'Enter' && commitEdit()}
                  style={{ flex: 1, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 5, fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none' }} />
              : <span style={{ flex: 1, fontSize: '0.78rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {src.url
                    ? <a href={src.url} target="_blank" rel="noreferrer" style={{ color: '#334155', textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
                        onMouseLeave={e => e.currentTarget.style.color = '#334155'}>{src.name}</a>
                    : src.name}
                </span>
            }

            <button onClick={() => setMenuOpen(x => x === src.id ? null : src.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1rem', lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>···</button>

            {menuOpen === src.id && (
              <div style={{ position: 'absolute', right: 24, top: 0, zIndex: 50, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: 140, overflow: 'hidden' }}>
                {[{ label: 'Rename', action: () => startEdit(src.id, 'name', src.name) },
                  { label: 'Edit link', action: () => startEdit(src.id, 'url', src.url) },
                  { label: 'Remove', action: () => removeSource(src.id), danger: true }
                ].map(item => (
                  <button key={item.label} onClick={item.action} style={{ display: 'block', width: '100%', padding: '8px 14px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: item.danger ? '#dc2626' : '#334155', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div style={{ display: 'flex', gap: 6, padding: '6px 4px' }}>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addSource(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="Source name…"
              style={{ flex: 1, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: '0.78rem', fontFamily: 'inherit', outline: 'none' }} />
            <button onClick={addSource} style={{ padding: '5px 12px', borderRadius: 6, background: '#7c3aed', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ padding: '5px 10px', borderRadius: 6, background: 'none', border: '1px solid var(--border)', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BDCenter() {
  const navigate   = useNavigate()
  const isMobile   = useIsMobile()
  const [leads,            setLeads]           = useState([])
  const [dbLoading,        setDbLoading]       = useState(true)
  const [dbError,          setDbError]         = useState(null)
  const [showForm,         setShowForm]        = useState(false)
  const [mapOpen,          setMapOpen]         = useState(!isMobile)
  const [drillState,       setDrillState]      = useState(null)
  const [selectedDistrict, setSelectedDistrict]= useState(null)
  const [searchQuery,      setSearchQuery]     = useState('')
  const [activeTab,        setActiveTab]       = useState('dashboard')
  const [user,             setUser]            = useState(null)
  const [myProfile,        setMyProfile]       = useState(null)

  // ── Get current Supabase user + profile ───────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    fetchMyProfile().then(({ data }) => { if (data) setMyProfile(data) })
  }, [])

  // Segments this user can add leads to:
  // admins + super_admin → all segments
  // regular user with no assignment → all segments (default)
  // regular user with assignment → only their segments
  const availableSegments = useMemo(() => {
    if (!myProfile) return SEGMENTS
    if (isAdminRole(myProfile.role)) return SEGMENTS
    if (!myProfile.assignedSegments || myProfile.assignedSegments.length === 0) return SEGMENTS
    return myProfile.assignedSegments
  }, [myProfile])

  const canAdmin = myProfile && isAdminRole(myProfile.role)

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // ── Load from Supabase on mount + subscribe to real-time changes ──────────
  useEffect(() => {
    setDbLoading(true)
    fetchLeads()
      .then(({ data, error }) => {
        if (error) setDbError('Could not load leads: ' + error.message)
        else setLeads(data)
      })
      .finally(() => setDbLoading(false))

    // Real-time — any insert/update/delete by any team member reflects instantly
    const unsub = subscribeLeads(setLeads)
    return unsub
  }, [])

  const bubbles = useMemo(() => leads
    .filter(l => l.lat && l.lon)
    .map(l => {
      const s = stageFor(l.stage)
      return {
        lat: l.lat, lon: l.lon, stateName: l.state,
        size: l.kvaEstimate > 5000 ? 12 : l.kvaEstimate > 1000 ? 9 : 7,
        color: s.color,
        label: l.company,
        tooltip: `${l.company}\n${l.city}, ${l.state}\n${fmtKva(l.kvaEstimate)} · ${s.label}`,
      }
    }), [leads])

  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads
    const q = searchQuery.toLowerCase()
    return leads.filter(l =>
      l.company.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.state?.toLowerCase().includes(q) ||
      l.contact?.toLowerCase().includes(q)
    )
  }, [leads, searchQuery])

  async function handleSaveLead(lead) {
    const { data, error } = await insertLead(lead)
    if (error) { alert('Save failed: ' + error.message); return }
    setLeads(ls => [data, ...ls])
    setShowForm(false)
  }

  async function handleStageChange(id, stage) {
    // Optimistic update — revert if DB fails
    setLeads(ls => ls.map(l => l.id === id ? { ...l, stage } : l))
    const { error } = await updateLead(id, { stage })
    if (error) {
      // Revert
      fetchLeads().then(({ data }) => data && setLeads(data))
    }
  }

  const activePipeline = leads.filter(l => !['won', 'lost'].includes(l.stage))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', paddingBottom: 'var(--s12)' }}>

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--white)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 14px' : '0 28px', height: isMobile ? 52 : 48,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
          <button onClick={() => navigate('/')}
            style={{ fontSize: '0.68rem', color: '#475569', background: 'transparent', border: '1px solid var(--border)', padding: isMobile ? '5px 10px' : '3px 10px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← {isMobile ? '' : 'Platform'}
          </button>
          {!isMobile && <div style={{ width: 1, height: 18, background: 'var(--border)' }} />}
          <span style={{ fontSize: isMobile ? '0.9rem' : '0.78rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.01em' }}>BD Center</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(124,58,237,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800, color: '#7c3aed', flexShrink: 0,
              }}>
                {(myProfile?.name || user.user_metadata?.name || user.email || 'U').slice(0,1).toUpperCase()}
              </div>
              {!isMobile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: '#475569', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {myProfile?.name || user.user_metadata?.name || user.email}
                  </span>
                  {myProfile?.role && myProfile.role !== 'user' && (
                    <span style={{ fontSize: '0.52rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: myProfile.role === 'super_admin' ? '#7c3aed' : '#2563eb' }}>
                      {myProfile.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          <button onClick={handleLogout}
            style={{ fontSize: '0.68rem', color: '#64748b', background: 'transparent', border: '1px solid var(--border)', padding: isMobile ? '5px 10px' : '4px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit' }}>
            {isMobile ? '↩' : 'Sign out'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: isMobile ? '0 12px' : '0 var(--s6)' }}>

        {/* Header — hidden on mobile (dashboard has the stats) */}
        {!isMobile && (
          <div style={{ paddingTop: 28, marginBottom: 'var(--s5)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate)', letterSpacing: '-0.02em' }}>BD Center</h1>
                <p style={{ margin: '5px 0 0', color: '#475569', fontSize: '0.82rem' }}>Lead pipeline · GOEM coverage · India map</p>
              </div>
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total leads',  value: String(leads.length) },
                  { label: 'Active',       value: String(activePipeline.length), hi: true },
                  { label: 'Pipeline kVA', value: fmtKva(activePipeline.reduce((s,l) => s+(Number(l.kvaEstimate)||0),0)), hi: true },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1, color: s.hi ? '#7c3aed' : 'var(--slate)', fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                    <div style={{ fontSize: '0.58rem', color: '#64748b', marginTop: 3 }}>{s.label}</div>
                  </div>
                ))}
                <button onClick={() => setShowForm(f => !f)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 20px', borderRadius: 9,
                  background: showForm ? 'var(--white)' : '#7c3aed',
                  color: showForm ? '#7c3aed' : 'white',
                  border: '1px solid #7c3aed',
                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  {showForm ? '× Cancel' : '+ Add Lead'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showForm && <AddLeadForm onSave={handleSaveLead} onCancel={() => setShowForm(false)} availableSegments={availableSegments} />}

        {/* DB status */}
        {dbLoading && (
          <div style={{ textAlign: 'center', padding: '14px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
            Loading pipeline…
          </div>
        )}
        {dbError && (
          <div style={{ padding: '10px 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.78rem', marginBottom: 16 }}>
            {dbError}
          </div>
        )}

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 0, borderBottom: '2px solid var(--border)',
          marginBottom: isMobile ? 14 : 22,
          marginTop: isMobile ? 10 : 0,
          overflowX: 'auto', WebkitOverflowScrolling: 'touch',
        }}>
          {[
            { id: 'dashboard', label: isMobile ? '📊' : '📊 Dashboard' },
            { id: 'pipeline',  label: isMobile ? 'Leads' : 'Pipeline' },
            { id: 'intel',     label: isMobile ? 'Intel' : 'Market Intel' },
            ...(canAdmin ? [{ id: 'admin', label: isMobile ? 'Team' : '⚙ Team & Access' }] : []),
          ].map(tab => {
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: isMobile ? '10px 16px' : '9px 20px',
                fontSize: isMobile ? '0.82rem' : '0.78rem', fontWeight: 700,
                color: active ? '#7c3aed' : '#64748b',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
                borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent',
                marginBottom: -2,
                transition: 'color 150ms',
              }}>{tab.label}</button>
            )
          })}
        </div>

        {/* ── Dashboard tab ────────────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <>
            {/* Mobile: floating add button */}
            {isMobile && (
              <button onClick={() => { setShowForm(f => !f); setActiveTab('pipeline') }} style={{
                position: 'fixed', bottom: 24, right: 20, zIndex: 40,
                width: 56, height: 56, borderRadius: '50%',
                background: showForm ? 'var(--white)' : '#7c3aed',
                color: showForm ? '#7c3aed' : 'white',
                border: '1px solid #7c3aed',
                fontSize: '1.6rem', fontWeight: 300, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {showForm ? '×' : '+'}
              </button>
            )}
            <DashboardTab leads={leads} onNavigate={id => navigate(`/bd-center/lead/${id}`)} />
          </>
        )}

        {/* ── Pipeline tab ────────────────────────────────────────────────── */}
        {activeTab === 'pipeline' && (
          <>
            {leads.length > 0 && !isMobile && <PipelineStrip leads={leads} />}

            {/* India map — collapsible on mobile */}
            <div style={{ marginBottom: 20 }}>
              {isMobile && (
                <button onClick={() => setMapOpen(v => !v)} style={{
                  width: '100%', padding: '10px 14px', borderRadius: 9, marginBottom: 8,
                  background: 'var(--white)', border: '1px solid var(--border)',
                  fontSize: '0.78rem', fontWeight: 700, color: '#475569',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  🗺 India Map {mapOpen ? '▲' : '▼'}
                </button>
              )}
              {(!isMobile || mapOpen) && (
                <IndiaMap
                  overlayMode="goem"
                  bubbles={bubbles}
                  drillState={drillState}
                  selectedDistrict={selectedDistrict}
                  height={isMobile ? 320 : 520}
                  onStateClick={name => { setDrillState(name); setSelectedDistrict(null) }}
                  onDistrictClick={d => setSelectedDistrict(x => x === d ? null : d)}
                  onDrillBack={() => { setDrillState(null); setSelectedDistrict(null) }}
                  showLegend={false}
                  note={null}
                />
              )}
              {!isMobile && <div style={{ display: 'flex', alignItems: 'center', gap: '6px 18px', flexWrap: 'wrap', marginTop: 10 }}>
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>Leads:</span>
                {STAGES.filter(s => !['stalled'].includes(s.id)).map(s => (
                  <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', color: '#475569' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />{s.label}
                  </span>
                ))}
                <div style={{ width: 1, height: 14, background: 'var(--border)', margin: '0 4px' }} />
                <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>GOEM:</span>
                {Object.values(GOEM_DATA).filter(g => g.states?.length).map(g => (
                  <span key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: g.color + 'aa', border: `1px solid ${g.color}`, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#334155' }}>{g.name}</span>
                    <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>· {g.hq}</span>
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: '#94a3b8' }}>
                  {drillState ? `${drillState} · ← India to zoom out` : 'Click state → district view'}
                </span>
              </div>}
            </div>

            {/* Search bar + inline "+ Add Lead" + table */}
            <div style={{ marginBottom: isMobile ? 80 : 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search company, city, state…"
                    style={{ width: '100%', padding: isMobile ? '10px 10px 10px 34px' : '7px 10px 7px 30px', borderRadius: 8, border: '1px solid var(--border)', fontSize: isMobile ? '1rem' : '0.78rem', fontFamily: 'inherit', outline: 'none', background: 'var(--white)', color: 'var(--slate)', boxSizing: 'border-box' }} />
                </div>
                {!isMobile && (
                  <button onClick={() => { setShowForm(f => !f); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 8,
                    background: showForm ? 'var(--white)' : 'rgba(124,58,237,0.08)',
                    color: '#7c3aed', border: '1px solid rgba(124,58,237,0.3)',
                    fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}>
                    {showForm ? '× Cancel' : '+ Add Lead'}
                  </button>
                )}
              </div>
              <PipelineTable leads={filteredLeads} drillState={drillState} onStageChange={handleStageChange} onNavigate={id => navigate(`/bd-center/lead/${id}`)} />
            </div>
            {/* Mobile FAB */}
            {isMobile && (
              <button onClick={() => { setShowForm(f => !f); window.scrollTo({ top: 0, behavior: 'smooth' }) }} style={{
                position: 'fixed', bottom: 24, right: 20, zIndex: 40,
                width: 56, height: 56, borderRadius: '50%',
                background: showForm ? 'var(--white)' : '#7c3aed',
                color: showForm ? '#7c3aed' : 'white',
                border: '1px solid #7c3aed',
                fontSize: '1.6rem', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {showForm ? '×' : '+'}
              </button>
            )}
          </>
        )}

        {/* ── Market Intel tab ─────────────────────────────────────────────── */}
        {activeTab === 'intel' && (
          <>
            <DCIntelligence />
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <SourcesPanel />
              <GoemSummary leads={leads} />
            </div>
          </>
        )}

        {/* ── Admin tab — team & access management ─────────────────────────── */}
        {activeTab === 'admin' && canAdmin && (
          <div style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '28px 28px',
          }}>
            <AdminPanel myProfile={myProfile} />
          </div>
        )}

      </div>
    </div>
  )
}
