import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { KOEL_RANGES, getAllModels } from '../data/koel'
import { getAllCumminsModels }  from '../data/cummins'
import { getAllMahindraModels } from '../data/mahindra'
import { getAllGreavesModels }  from '../data/greaves'
import { getRemarks } from '../data/remarks'
import { starred, auth } from '../lib/storage'
import Badge from '../components/Badge'

const COMPETITOR_BRANDS = ['Cummins', 'Mahindra Powerol', 'Greaves Cotton']

const allCompetitorModels = () => ({
  'Cummins':          getAllCumminsModels(),
  'Mahindra Powerol': getAllMahindraModels(),
  'Greaves Cotton':   getAllGreavesModels(),
})

const isValidMatch = (koelKva, compKva) =>
  compKva >= koelKva * 0.75 && compKva <= koelKva * 1.25

const fmt = (v, unit = '') => v != null ? `${v}${unit}` : '—'

const compare = (koelVal, compVal, higherIsBetter = true) => {
  if (koelVal == null || compVal == null) return 'neutral'
  const kn = parseFloat(String(koelVal)), cn = parseFloat(String(compVal))
  if (isNaN(kn) || isNaN(cn)) return 'neutral'
  if (kn === cn) return 'neutral'
  return (higherIsBetter ? kn > cn : kn < cn) ? 'koel' : 'comp'
}

const SPEC_ROWS = [
  { section: 'Genset' },
  { key: 'kva',                label: 'Rated Output',             unit: 'kVA',         koelFn: m => m.kva,                compFn: m => m.kva,               higher: true  },
  { key: 'noiseLevel',         label: 'Noise Level',              unit: 'dBA',         koelFn: m => m.noiseLevel,         compFn: m => m.noiseLevel,        higher: false, remarksKey: 'noiseLevel' },
  { key: 'fuelTank',           label: 'Fuel Tank Capacity',       unit: 'L',           koelFn: m => m.fuelTank,           compFn: m => m.fuelTank,          higher: true,  remarksKey: 'fuelTank' },
  { key: 'dims',               label: 'Dimensions (L×W×H)',       unit: 'mm',          koelFn: m => m.dimensions ? `${m.dimensions.length}×${m.dimensions.width}×${m.dimensions.height}` : '—', compFn: () => '—', higher: false, remarksKey: 'dimensions' },
  { key: 'weightDry',          label: 'Weight (Dry)',             unit: 'kg',          koelFn: m => m.weightDry,          compFn: m => m.weightDry,         higher: false, remarksKey: 'weight' },
  { section: 'Engine' },
  { key: 'engineModel',        label: 'Engine Model',             unit: '',            koelFn: m => m.engineModel,        compFn: m => m.engineModel,       higher: false, remarksKey: 'engineModel' },
  { key: 'engineMake',         label: 'Engine Make',              unit: '',            koelFn: m => m.engineMake,         compFn: m => m.engineMake || '—', higher: false, remarksKey: 'engineMake' },
  { key: 'cylinders',          label: 'No. of Cylinders',         unit: '',            koelFn: m => m.cylinders,          compFn: m => m.cylinders,         higher: true,  remarksKey: 'cylinders' },
  { key: 'displacement',       label: 'Displacement',             unit: 'L',           koelFn: m => m.displacement,       compFn: m => m.displacement,      higher: true,  remarksKey: 'displacement' },
  { key: 'aspiration',         label: 'Aspiration',               unit: '',            koelFn: m => m.aspiration,         compFn: m => m.aspiration,        higher: false },
  { key: 'lubeOilChangePeriod',label: 'Lube Oil Change Period',   unit: 'hrs',         koelFn: m => m.lubeOilChangePeriod,compFn: m => m.lubeOilChangePeriod || '—', higher: true, remarksKey: 'lubeOilChangePeriod' },
  { key: 'lubeOilSump',        label: 'Lube Oil Sump',            unit: 'L',           koelFn: m => m.lubeOilSump,        compFn: m => m.lubeOilSump || '—',higher: false },
  { key: 'coolantCapacity',    label: 'Coolant Capacity',         unit: 'L',           koelFn: m => m.coolantCapacity,    compFn: m => m.coolantCapacity || '—', higher: false },
  { key: 'adblueCapacity',     label: 'AdBlue / DEF Capacity',    unit: 'L',           koelFn: m => m.adblueCapacity || 'EGR (N/A)', compFn: m => m.adblueCapacity || '—', higher: false, remarksKey: 'adblueCapacity' },
  { section: 'Alternator' },
  { key: 'altEff',             label: 'Alternator Efficiency',    unit: '%',           koelFn: m => m.alternatorEfficiency, compFn: () => '—',              higher: true,  remarksKey: 'alternatorEfficiency' },
  { key: 'insulationClass',    label: 'Insulation Class',         unit: '',            koelFn: m => m.insulationClass,    compFn: () => 'H',                higher: false },
  { key: 'maxVoltageDip',      label: 'Max Voltage Dip',          unit: '',            koelFn: m => m.maxVoltageDip,      compFn: () => '—',                higher: false },
  { section: 'Other' },
  { key: 'serviceInterval',    label: 'Service Interval',         unit: '',            koelFn: () => '500 hrs / 12 months', compFn: m => m.serviceInterval || '—', higher: false, remarksKey: 'serviceInterval' },
  { key: 'governingClass',     label: 'Governing Class',          unit: '',            koelFn: m => m.governingClass || '—', compFn: m => m.governingClass || '—', higher: false, remarksKey: 'governingClass' },
]

// ── Compute "Why Kirloskar" advantages dynamically ──────────────────
const getKoelAdvantages = (kModel, cModel, brand) => {
  const pts = []

  // 1. Displacement
  if (kModel.displacement && cModel.displacement && kModel.displacement > cModel.displacement) {
    const pct = Math.round((kModel.displacement - cModel.displacement) / cModel.displacement * 100)
    pts.push({
      icon: '⚙️',
      heading: `${kModel.displacement}L vs ${cModel.displacement}L engine displacement (+${pct}%)`,
      body: `More displacement at the same rated output means lower specific load — the engine is running well within capacity. That translates to less wear per hour and longer engine life.`,
    })
  }

  // 2. Noise load point — always relevant vs Cummins
  if (brand === 'Cummins') {
    pts.push({
      icon: '🔇',
      heading: 'Noise declared at 100% load (not 75%)',
      body: `Cummins specifies noise levels at 75% load — a lighter, quieter operating point. KOEL's <75 dBA is at full load. The same genset will be louder under heavier load; KOEL's number is the harder benchmark.`,
    })
  }

  // 3. Fuel tank
  if (kModel.fuelTank && cModel.fuelTank && kModel.fuelTank > cModel.fuelTank) {
    const pct = Math.round((kModel.fuelTank - cModel.fuelTank) / cModel.fuelTank * 100)
    pts.push({
      icon: '⛽',
      heading: `${kModel.fuelTank}L fuel tank — ${pct}% more than ${cModel.fuelTank}L`,
      body: `Larger onboard tank means longer uninterrupted run times during extended outages. Fewer fuel stops is significant for facilities with limited access windows — hospitals, data centres, remote sites.`,
    })
  }

  // 4. In-house engine
  if (kModel.engineMake === 'Kirloskar') {
    pts.push({
      icon: '🏭',
      heading: 'Kirloskar-manufactured engine in a Kirloskar genset',
      body: `Engine and genset from the same manufacturer — one warranty, one service team, no OEM-vs-genset-OEM finger-pointing when something goes wrong. This matters most at 2 AM during a breakdown.`,
    })
  }

  // 5. AdBlue tank size
  if (kModel.adblueCapacity && cModel.adblueCapacity && kModel.adblueCapacity > cModel.adblueCapacity) {
    pts.push({
      icon: '💧',
      heading: `${kModel.adblueCapacity}L AdBlue tank vs ${cModel.adblueCapacity}L`,
      body: `Larger DEF tank reduces refill frequency — fewer interventions needed during long-duration runs. Especially relevant for mission-critical sites where access is restricted.`,
    })
  }

  // 6. Alternator efficiency declared
  if (kModel.alternatorEfficiency) {
    const compNote = brand === 'Cummins'
      ? "Cummins Stamford alternator efficiency is not declared in the CPCB IV+ spec sheet — ask the dealer for it."
      : brand === 'Mahindra Powerol'
        ? 'Mahindra Powerol uses CG/LS sourced alternators — alternator efficiency is not declared in their spec.'
        : 'Greaves uses sourced alternators (NSM / Meccalte) — efficiency not declared in their CPCB IV+ spec.'
    pts.push({
      icon: '⚡',
      heading: `${kModel.alternatorEfficiency}% alternator efficiency — declared`,
      body: `Kirloskar publishes alternator efficiency at rated load. ${compNote} Higher alternator efficiency means more of the engine's output reaches the load — less heat loss.`,
    })
  }

  // 7. Service network — always show, customised per brand
  const serviceNote = brand === 'Mahindra Powerol'
    ? "Mahindra Powerol service depth varies significantly outside tier-1 cities — worth verifying at the customer site location."
    : brand === 'Greaves Cotton'
      ? "Greaves Cotton has reasonable tier-1 coverage; tier-2 and below should be verified at the customer site location."
      : 'Cummins post-warranty genset service is typically third-party in most Indian regions — response time and pricing vary by partner.'
  pts.push({
    icon: '📍',
    heading: 'Pan-India service network with declared 5-year AMC pricing',
    body: `Transparent AMC pricing for 5 years from day one — no surprises when the warranty ends. ${serviceNote}`,
  })

  return pts.slice(0, 5)
}

export default function Compare() {
  const [searchParams] = useSearchParams()
  const competitors    = allCompetitorModels()

  // ── Initialise from URL params (supports opening from Starred) ──
  const initKoelRangeId = () => {
    const koelParam = searchParams.get('koel')
    if (koelParam) {
      const found = KOEL_RANGES.find(r => r.models.some(m => m.model === koelParam))
      if (found) return found.id
    }
    return '82-160'
  }

  const initKoelModelIdx = () => {
    const koelParam = searchParams.get('koel')
    if (koelParam) {
      const range = KOEL_RANGES.find(r => r.models.some(m => m.model === koelParam))
      if (range) {
        const idx = range.models.findIndex(m => m.model === koelParam)
        return idx >= 0 ? idx : 0
      }
    }
    return 0
  }

  const initBrand = () => searchParams.get('brand') || ''

  const initCompModel = (brand) => {
    const modelParam = searchParams.get('model')
    if (modelParam && brand) {
      const brandList = competitors[brand] || []
      return brandList.find(m => m.model === modelParam) || null
    }
    return null
  }

  const [koelRangeId,  setKoelRangeId]  = useState(initKoelRangeId)
  const [koelModelIdx, setKoelModelIdx] = useState(initKoelModelIdx)
  const [brand,        setBrand]        = useState(initBrand)
  const [compModel,    setCompModel]    = useState(() => initCompModel(initBrand()))
  const [isStarred,    setIsStarred]    = useState(false)

  const koelRange   = KOEL_RANGES.find(r => r.id === koelRangeId)
  const koelModel   = koelRange?.models[koelModelIdx]
  const brandModels = competitors[brand] || []
  const validModels = koelModel ? brandModels.filter(m => isValidMatch(koelModel.kva, m.kva)) : []

  // Reset compModel only when KOEL range/model/brand changes interactively
  // (not on initial mount — let URL params hydrate the selection)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (mounted) {
      setCompModel(null)
      setRemarksOverrides({})
      setEditingKey(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [koelRangeId, koelModelIdx, brand])

  useEffect(() => {
    if (koelModel && compModel) {
      setIsStarred(starred.isStarred(koelModel.model, brand, compModel.model))
    }
  }, [koelModel, compModel, brand])

  const handleStar = () => {
    if (!koelModel || !compModel) return
    if (isStarred) return
    starred.add({ koelModel: koelModel.model, competitorBrand: brand, competitorModel: compModel.model })
    setIsStarred(true)
  }

  const remarks    = koelRange && compModel ? getRemarks(koelRange.id, brand, compModel.rangeId) : {}
  const advantages = koelModel && compModel ? getKoelAdvantages(koelModel, compModel, brand) : []

  const pdfRef    = useRef(null)
  const [pdfMode,          setPdfMode]          = useState(false)
  const [remarksOverrides, setRemarksOverrides] = useState({})
  const [editingKey,       setEditingKey]       = useState(null)
  const session   = auth.getSession()

  const handleDownloadPDF = async () => {
    if (!koelModel || !compModel) return
    setPdfMode(true)
    await new Promise(r => setTimeout(r, 120))
    const html2pdf = (await import('html2pdf.js')).default
    const filename = `KOEL_${koelModel.model}_vs_${compModel.model}.pdf`
    await html2pdf()
      .set({
        margin: [12, 10, 12, 10],
        filename,
        image:     { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:     { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css'] },
      })
      .from(pdfRef.current)
      .save()
    setPdfMode(false)
  }

  return (
    <div className="page-content">
      <div className="container--wide">

        {/* ── Header ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--s8)', flexWrap: 'wrap', gap: 'var(--s4)' }}>
          <div>
            <div className="section-eyebrow">Competitor Check</div>
            <h2>Head-to-Head Comparison</h2>
          </div>
          <div style={{ display: 'flex', gap: 'var(--s3)' }}>
            <button
              className={`btn ${isStarred ? 'btn--outline' : 'btn--ghost'} btn--sm`}
              onClick={handleStar}
              disabled={!compModel || isStarred}
              style={isStarred ? { borderColor: 'var(--orange)', color: 'var(--orange)' } : {}}
            >
              {isStarred ? '⭐ Saved' : '☆ Save Comparison'}
            </button>
            <button
              className="btn btn--primary btn--sm"
              onClick={handleDownloadPDF}
              disabled={!koelModel || !compModel || pdfMode}
              title="Download comparison as PDF to share with customer"
            >
              {pdfMode ? 'Generating…' : '↓ Download PDF'}
            </button>
          </div>
        </div>

        {/* ── Selectors ────────────────────────────────────────── */}
        <div className="compare-selectors">

          {/* KOEL selector */}
          <div className="compare-selector compare-selector--koel">
            <div className="compare-selector__label">Kirloskar (Select)</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              <div>
                <label className="compare-field-label">Range</label>
                <select
                  className="compare-select"
                  value={koelRangeId}
                  onChange={e => { setKoelRangeId(e.target.value); setKoelModelIdx(0) }}
                >
                  <optgroup label="Standard Range (LHP / MHP)">
                    {KOEL_RANGES.map(r => (
                      <option key={r.id} value={r.id}>{r.label} kVA</option>
                    ))}
                  </optgroup>
                  <optgroup label="HHP Range">
                    <option value="optiprime">Optiprime 117–2020 kVA (Pending)</option>
                  </optgroup>
                </select>
              </div>

              {koelRange && (
                <div>
                  <label className="compare-field-label">Model</label>
                  <select
                    className="compare-select"
                    value={koelModelIdx}
                    onChange={e => setKoelModelIdx(Number(e.target.value))}
                  >
                    {koelRange.models.map((m, i) => (
                      <option key={m.model} value={i}>{m.kva} kVA — {m.model}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Competitor selector */}
          <div className="compare-selector">
            <div className="compare-selector__label">Competitor (Select)</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              <div>
                <label className="compare-field-label">Brand</label>
                <select
                  className="compare-select"
                  value={brand}
                  onChange={e => { setBrand(e.target.value); setCompModel(null) }}
                >
                  <option value="">— Select brand —</option>
                  {COMPETITOR_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {brand && (
                <div>
                  <label className="compare-field-label">Model</label>
                  {validModels.length === 0 && koelModel ? (
                    <div className="no-match-warning">
                      No {brand} model within ±25% of {koelModel.kva} kVA. Try a different KOEL model or brand.
                    </div>
                  ) : (
                    <select
                      className="compare-select"
                      value={compModel?.model || ''}
                      onChange={e => {
                        const selected = validModels.find(m => m.model === e.target.value) || null
                        setCompModel(selected)
                      }}
                    >
                      <option value="">— Select model —</option>
                      {validModels.map(m => (
                        <option key={m.model} value={m.model}>{m.kva} kVA — {m.model}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Optiprime Pending State ───────────────────────────── */}
        {koelRangeId === 'optiprime' && (
          <div style={{
            marginTop: 'var(--s8)',
            background: 'linear-gradient(135deg, #0D1F2D 0%, #0F2A38 100%)',
            border: '1px solid rgba(0,123,127,0.3)',
            borderRadius: 14,
            padding: 'var(--s10)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(0,123,127,0.15)', border: '2px dashed rgba(0,123,127,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--s5)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--teal)',
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'var(--s3)',
            }}>
              Phase 2 · Under Development
            </div>
            <h3 style={{ color: 'white', margin: '0 0 var(--s3)' }}>Optiprime Comparisons Coming Soon</h3>
            <p style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 480, margin: '0 auto var(--s7)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              Head-to-head data for the Optiprime HHP range is being compiled. Competitor data in this segment (Cummins C1000D5, Mahindra H-Series, Greaves 500–600 kVA) is being verified against CPCB IV+ spec sheets before publishing.
            </p>
            <a
              href="/optiprime"
              onClick={e => { e.preventDefault(); window.location.href = '/optiprime' }}
              className="btn btn--lg"
              style={{ background: 'var(--teal)', color: 'white', border: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Explore Optiprime Range →
            </a>
          </div>
        )}

        {/* ── Comparison Table ──────────────────────────────────── */}
        {koelModel && compModel && (
          <div ref={pdfRef} style={{ background: 'white' }}>

            {/* PDF-only header — hidden on screen, visible when generating */}
            {pdfMode && (
              <div style={{ padding: '0 0 var(--s6)', marginBottom: 'var(--s6)', borderBottom: '2px solid #007B7F', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#007B7F', marginBottom: 4 }}>
                    Kirloskar Oil Engines Limited
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0D1F2D' }}>
                    {koelModel.model} vs {compModel.model}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 2 }}>
                    {koelModel.kva} kVA  ·  Kirloskar vs {brand}  ·  CPCB IV+ Specification Comparison
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#888' }}>
                  <div>Prepared by: {session?.email || 'KOEL Sales Rep'}</div>
                  <div>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>
            )}

            <div style={{ overflowX: 'auto', marginBottom: 'var(--s8)' }}>
              <table className="compare-table" style={{ minWidth: 800 }}>
                <thead>
                  <tr>
                    <th className="param-col" style={{ width: 200 }}>Parameter</th>
                    <th className="koel-col">
                      <div className="compare-col-header">
                        <span className="compare-col-brand">Kirloskar</span>
                        <span className="compare-col-model">{koelModel.model}</span>
                        <span className="compare-col-kva">{koelModel.kva} kVA</span>
                      </div>
                    </th>
                    <th>
                      <div className="compare-col-header">
                        <span className="compare-col-brand">{brand}</span>
                        <span className="compare-col-model">{compModel.model}</span>
                        <span className="compare-col-kva">{compModel.kva} kVA</span>
                      </div>
                    </th>
                    <th className="remarks-col" style={{ width: 260 }}>
                      <div className="compare-col-header">
                        <span className="compare-col-brand">Field Notes</span>
                        <span className="compare-col-model">Remarks</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SPEC_ROWS.map((row, i) => {
                    if (row.section) return (
                      <tr key={`sec-${i}`} className="section-row">
                        <td colSpan={4}>{row.section}</td>
                      </tr>
                    )
                    const koelVal  = row.koelFn(koelModel)
                    const compVal  = row.compFn(compModel)
                    const winner   = compare(koelVal, compVal, row.higher)
                    const defaultRemark = row.remarksKey ? remarks[row.remarksKey] : null
                    const override = remarksOverrides[row.key]
                    const displayRemark = override !== undefined ? override : defaultRemark
                    const isEditing = editingKey === row.key && !pdfMode

                    return (
                      <tr key={row.key}>
                        <td className="param-col">{row.label}{row.unit ? <span className="spec-table__unit">({row.unit})</span> : ''}</td>
                        <td className={winner === 'koel' ? 'win' : ''} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                          {fmt(koelVal)}{row.unit && koelVal != null && koelVal !== '—' ? ` ${row.unit}` : ''}
                        </td>
                        <td className={winner === 'comp' ? 'loss' : winner === 'koel' ? 'flag' : ''} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
                          {fmt(compVal)}{row.unit && compVal != null && compVal !== '—' ? ` ${row.unit}` : ''}
                        </td>
                        <td className="remarks-col">
                          {isEditing ? (
                            <textarea
                              className="remark-editor"
                              defaultValue={displayRemark || ''}
                              autoFocus
                              rows={3}
                              onBlur={e => {
                                const val = e.target.value.trim()
                                setRemarksOverrides(prev => ({ ...prev, [row.key]: val || undefined }))
                                setEditingKey(null)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Escape') { setEditingKey(null) }
                              }}
                            />
                          ) : (
                            <div
                              className={`remark-cell-wrap ${!pdfMode ? 'remark-cell-wrap--editable' : ''}`}
                              onClick={() => !pdfMode && setEditingKey(row.key)}
                              title={!pdfMode ? 'Click to add a note for this customer' : undefined}
                            >
                              {displayRemark
                                ? <span className={`remarks-cell ${override !== undefined ? 'remarks-cell--edited' : ''}`}>{displayRemark}</span>
                                : <span className="remark-placeholder">{pdfMode ? '' : '+ add note'}</span>
                              }
                              {override !== undefined && !pdfMode && (
                                <button
                                  className="remark-reset-btn"
                                  title="Reset to default"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setRemarksOverrides(prev => {
                                      const next = { ...prev }
                                      delete next[row.key]
                                      return next
                                    })
                                  }}
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

            {/* ── Colour Legend ──── */}
            <div style={{ display: 'flex', gap: 'var(--s4)', marginBottom: 'var(--s6)', flexWrap: 'wrap' }}>
              {[
                { cls: 'win',  label: 'KOEL advantage' },
                { cls: 'flag', label: 'Contextual: see Remarks' },
                { cls: 'loss', label: 'Competitor claims advantage' },
              ].map(l => (
                <div key={l.cls} style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', fontSize: '0.8rem' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: l.cls === 'win' ? 'var(--win-bg)' : l.cls === 'flag' ? 'var(--flag-bg)' : 'var(--loss-bg)', border: `1px solid ${l.cls === 'win' ? 'var(--win)' : l.cls === 'flag' ? 'var(--flag)' : 'var(--loss)'}` }} />
                  <span style={{ color: 'var(--gray)' }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* ── Why Kirloskar — Advantage Summary ─────────────── */}
            {advantages.length > 0 && (
              <div className="koel-advantage-panel">
                <div className="koel-advantage-panel__header">
                  <div className="koel-advantage-panel__eyebrow">Sales Summary</div>
                  <h3 className="koel-advantage-panel__title">
                    Why {koelModel.model} over {compModel.model}
                  </h3>
                  <p className="koel-advantage-panel__sub">
                    Key points to close — without repeating what the table already shows.
                  </p>
                </div>
                <div className="koel-advantage-list">
                  {advantages.map((adv, i) => (
                    <div key={i} className="koel-advantage-item">
                      <div className="koel-advantage-item__icon">{adv.icon}</div>
                      <div className="koel-advantage-item__content">
                        <div className="koel-advantage-item__heading">{adv.heading}</div>
                        <div className="koel-advantage-item__body">{adv.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Source Buttons ─── */}
            {!pdfMode && (
              <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap', paddingTop: 'var(--s6)', borderTop: '1px solid var(--border)', marginTop: 'var(--s6)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray)', alignSelf: 'center' }}>Source datasheets:</span>
                <a href={koelRange.datasheet} target="_blank" rel="noreferrer" className="source-btn">
                  KOEL {koelRange.label} kVA Datasheet
                </a>
                {compModel.datasheet && (
                  <a href={compModel.datasheet} target="_blank" rel="noreferrer" className="source-btn">
                    {brand} {compModel.rangeLabel} Datasheet
                  </a>
                )}
              </div>
            )}

            {/* PDF footer */}
          </div>
        )}

        {koelRangeId !== 'optiprime' && (!koelModel || !compModel) && (
          <div className="empty-state">
            <div className="empty-state__icon">⚖️</div>
            <h3>{!brand ? 'Select a competitor brand' : !compModel ? 'Select a competitor model' : 'Select models to compare'}</h3>
            <p>{!brand ? 'Pick a brand from the dropdown above to start comparing.' : 'Choose a competitor model to see the head-to-head comparison.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
