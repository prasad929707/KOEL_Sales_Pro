// ─────────────────────────────────────────────────────────────────────────────
// PITCH BUILDER — KOEL Sales Pro
//
// Flow:
//   Section A: Customer context (name, segment, city, pincode, date)
//   Section B: DG requirements — block load + load profile → reactive sizing
//   Section C: Context & Concerns — free text + segment challenges (checkboxes)
//   [Analyse →] button
//   Chat: AI Engineering Assistant validates inputs (appears after Analyse)
//         → clears or flags issues → unlocks Generate
//   [Generate Pitch →] (enabled only after AI gives ✅ or ⚠️ acknowledged)
//
// On "← Edit Pitch" from PitchOutput, form is fully reconstructed from brief.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { sizeGenset, loadingLabel, LOAD_PROFILES, fuelTable } from '../lib/sizingEngine'
import { EDITABLE_TERMS, FIXED_TERMS, getWarrantyTerms, getDeliveryDefault, GEMINI_VALIDATION_CONTEXT } from '../data/termsPolicy'
import { PITCH_SEGMENTS, SPACE_CONSTRAINTS } from '../data/pitchSegments'
import { SEGMENT_CHALLENGES } from '../data/segmentChallenges'
import { repProfile } from '../lib/storage'
import { searchCities } from '../data/cityData'
import { askGemini, buildPitchContext } from '../lib/geminiChat'

// ── Segment-driven smart context fields ──────────────────────────────────────
// 3 questions per segment — the ones that most sharpen the pitch angle.
// Answers flow into brief.segmentContext → pitch personalisation.
const SEGMENT_SMART_FIELDS = {
  healthcare: [
    { id: 'critLoads',  label: 'Critical loads needing backup',    type: 'multi', options: ['OT / Surgical suite', 'ICU / Ventilators / ECMO', 'Radiology / MRI', 'Pharmacy refrigeration'] },
    { id: 'redundancy', label: 'Redundancy requirement',           type: 'radio', options: ['N+1 required', 'Single set acceptable', 'Future provision only'] },
    { id: 'nabh',       label: 'NABH accreditation',               type: 'radio', options: ['In process', 'Already accredited', 'Not planned'] },
  ],
  datacentre: [
    { id: 'tier',       label: 'DC Tier target',                   type: 'radio', options: ['Tier I / II', 'Tier III', 'Tier IV', 'Not classified'] },
    { id: 'redundancy', label: 'Generator redundancy',             type: 'radio', options: ['N+1', '2N (fully mirrored)', 'Single set', 'TBD with architect'] },
    { id: 'upsBattery', label: 'UPS battery autonomy',             type: 'radio', options: ['<5 min', '5–15 min', '>15 min', 'Unknown'] },
  ],
  industrial: [
    { id: 'dolMotors',  label: 'DOL motors on site',               type: 'radio', options: ['None / all VFD', '1–2 motors', '3–5 motors', '6+ motors'] },
    { id: 'restart',    label: 'Motor restart on power restore',   type: 'radio', options: ['Simultaneous (all at once)', 'Sequenced via AMF timer', 'VFD-controlled'] },
    { id: 'htSupply',   label: 'Incoming supply',                  type: 'radio', options: ['LT 415V', 'HT 11kV via transformer', 'Both'] },
  ],
  coldchain: [
    { id: 'product',    label: 'Cold storage product',             type: 'radio', options: ['Pharma / vaccines', 'Fresh produce / dairy', 'Frozen / ice cream', 'Mixed'] },
    { id: 'compressors',label: 'Compressor count',                 type: 'radio', options: ['1–2', '3–5', '6+'] },
    { id: 'restart',    label: 'Compressor restart on restore',    type: 'radio', options: ['Simultaneous', 'Staggered via timer', 'VFD-controlled'] },
  ],
  telecom: [
    { id: 'mode',       label: 'DG operating mode',                type: 'radio', options: ['Standby (grid available)', 'Prime power (grid unreliable)', 'Hybrid with BESS'] },
    { id: 'location',   label: 'Tower location',                   type: 'radio', options: ['Urban / Metro', 'Semi-urban / Tier 2', 'Rural / Remote'] },
    { id: 'scada',      label: 'Remote monitoring need',           type: 'radio', options: ['SCADA / API integration required', 'KRM acceptable', 'Not required'] },
  ],
  hospitality: [
    { id: 'guestDist',  label: 'DG room to nearest guest area',   type: 'radio', options: ['<20 m (strict acoustic)', '20–50 m', '>50 m (remote room)'] },
    { id: 'fbLoad',     label: 'F&B / kitchen on critical circuit', type: 'radio', options: ['Yes — kitchen + cold store', 'Cold store only', 'No'] },
    { id: 'chain',      label: 'Part of a hotel chain',            type: 'radio', options: ['Yes — fleet potential', 'Standalone property'] },
  ],
  retail: [
    { id: 'mode',       label: 'Power situation',                  type: 'radio', options: ['Reliable grid — pure standby', 'Unreliable grid — runs daily', 'Generator-only (prime power)'] },
    { id: 'rollout',    label: 'Rollout scope',                    type: 'radio', options: ['Single outlet', 'Pilot (5–20 outlets)', '20+ outlets (framework deal)'] },
    { id: 'coldPct',    label: 'Refrigerated load share',          type: 'radio', options: ['<20%', '20–50% (supermarket)', '>50% (hypermarket)'] },
  ],
  education: [
    { id: 'examCentre', label: 'Board / university exam centre',   type: 'radio', options: ['Yes — certified backup needed', 'No'] },
    { id: 'govtAided',  label: 'Institution type',                 type: 'radio', options: ['Government-aided (GeM/GFR)', 'Private / autonomous', 'PPP'] },
    { id: 'solar',      label: 'Rooftop solar',                    type: 'radio', options: ['Already active', 'Planned', 'None'] },
  ],
  banking: [
    { id: 'application',label: 'Application',                     type: 'radio', options: ['Retail branch', 'Core banking DC / server room', 'ATM cluster', 'Zonal office'] },
    { id: 'fleet',      label: 'Branches in this city',           type: 'radio', options: ['1 branch', '2–5', '6–20 (fleet AMC opportunity)', '20+'] },
    { id: 'itSecurity', label: 'IT security on monitoring',        type: 'radio', options: ['Strict — no internet devices', 'Standard policy', 'Not assessed'] },
  ],
  government: [
    { id: 'procurement',label: 'Procurement route',               type: 'radio', options: ['GeM portal', 'Open tender', 'Limited tender / direct'] },
    { id: 'perfBond',   label: 'Performance bond required',        type: 'radio', options: ['Yes', 'No', 'TBC'] },
    { id: 'cpcbAudit',  label: 'CPCB cert check at commissioning', type: 'radio', options: ['Yes — inspector will verify', 'Standard compliance only'] },
  ],
  realestate: [
    { id: 'buildingType', label: 'Project type',                  type: 'radio', options: ['Residential township', 'Commercial complex', 'Mixed-use', 'Industrial park'] },
    { id: 'dgConfig',   label: 'DG configuration',                type: 'radio', options: ['Centralised (one plant room)', 'Distributed per building', 'Not decided yet'] },
    { id: 'ocRisk',     label: 'OC / acoustic certificate needed', type: 'radio', options: ['Yes — OC pending', 'OC already obtained', 'Not applicable'] },
  ],
  infra: [
    { id: 'projectType',label: 'Project type',                    type: 'radio', options: ['Airport (DGCA compliance)', 'Metro / transit', 'Highway / tunnel', 'Port / SEZ'] },
    { id: 'epc',        label: 'Procurement structure',           type: 'radio', options: ['EPC contractor (spec-in early)', 'MEPF sub-contractor', 'Direct owner purchase'] },
    { id: 'htSupply',   label: 'Supply type',                     type: 'radio', options: ['HT 11kV via transformer', 'LT 415V', 'Both'] },
  ],
}

// ── Segment AI analysis notes ─────────────────────────────────────────────────
const SEG_NOTES = {
  telecom:     { minLoad: 3 },
  healthcare:  { minLoad: 40 },
  realestate:  { minLoad: 30 },
  datacentre:  { minLoad: 80 },
  industrial:  { minLoad: 50 },
  hospitality: { minLoad: 40 },
  retail:      { minLoad: 15 },
  education:   { minLoad: 10 },
  banking:     { minLoad: 10 },
  government:  { minLoad: 25 },
  infra:       { minLoad: 100 },
  coldchain:   { minLoad: 15 },
}

// ── AI analysis engine ────────────────────────────────────────────────────────
function analyzeInputs(customer, gensets, concerns, commercialTerms) {
  const msgs = []
  const filled = gensets.filter(g => g.blockLoad && g.selectedProduct)

  if (filled.length === 0) {
    return [{ type: 'warn', text: 'Please select at least one product before analysis.' }]
  }

  // ── Sizing checks ──────────────────────────────────────────────────────────
  filled.forEach((gs, i) => {
    const label = filled.length > 1 ? `DG Set ${i + 1}: ` : ''
    const lp  = gs.selectedProduct?.loadingPct || 0
    const kva = gs.selectedProduct?.kva || 0

    if (lp < 32)
      msgs.push({ type: 'warn', text: `${label}${kva} kVA will run at only ${lp}% block load — wet stacking risk (carbon buildup in cylinder bore at very low loads). Consider the next smaller model or confirm a quarterly load bank test is planned.` })

    if (lp > 78)
      msgs.push({ type: 'warn', text: `${label}${kva} kVA is tight at ${lp}%. DOL motor restart surge may cause a voltage dip below AMF re-transfer threshold. Recommend the next size up.` })

    if (gs.spaceConstraints?.includes('rooftop') && kva >= 160)
      msgs.push({ type: 'question', text: `${label}Rooftop installation for ${kva} kVA — dry weight will be 1,800–3,200 kg. Has the structural engineer certified the roof slab? KOEL can provide weight datasheet for the civil team.` })

    if (gs.spaceConstraints?.includes('basement') && gs.loadProfile === 'motors')
      msgs.push({ type: 'question', text: `${label}Basement + motor loads: exhaust routing must reach terrace via min 4" GI duct with silencer. Has the exhaust path been finalised with the architect?` })

    if (gs.spaceConstraints?.includes('acoustic') && kva >= 320)
      msgs.push({ type: 'info', text: `${label}Acoustic enclosure for ${kva} kVA: KOEL achieves <75 dB(A) @ 1m. For metro zones requiring <65 dB(A) (hospital, hotel) — double-wall canopy or acoustic room may be needed.` })
  })

  if (customer.segmentId === 'datacentre' && filled.length === 1)
    msgs.push({ type: 'question', text: 'Data centre: is N+1 redundancy required? Tier III+ mandates it. If yes, size two identical sets — either unit carries full site load independently.' })

  if (customer.segmentId === 'healthcare' && filled.some(g => (g.selectedProduct?.kva || 0) < 82))
    msgs.push({ type: 'info', text: 'For a full hospital, KOEL recommends min 125 kVA (OT + ICU + essential lighting). If this is a clinic or day-care, the selected size is appropriate — please confirm.' })

  if (customer.segmentId === 'coldchain' && !filled.some(g => g.loadProfile === 'motors'))
    msgs.push({ type: 'info', text: 'Cold chain is compressor-heavy (PF 0.72, high DOL start current). The "Pumps & Motors" load profile gives safer sizing for this segment.' })

  if (filled.length > 1)
    msgs.push({ type: 'info', text: 'Multiple DG sets configured — confirm: are these parallel (same bus, need synchronising panels) or feeding separate distribution boards?' })

  // ── Commercial terms checks ────────────────────────────────────────────────
  if (commercialTerms) {
    const ct = commercialTerms
    const mode = ct.paymentMode || 'supply'
    const adv  = ct.paymentAdvance ?? (mode === 'ic' ? 50 : 35)
    const validity = ct.offerValidity ?? 30
    const delivery = ct.deliveryWeeks
    const maxKva = Math.max(...filled.map(g => g.selectedProduct?.kva || 0))

    // Payment advance below policy minimum
    const advMin = mode === 'ic' ? 40 : 25
    if (adv < advMin)
      msgs.push({ type: 'warn', text: `Advance payment set at ${adv}% — below the ${advMin}% minimum for ${mode === 'ic' ? 'I&C' : 'supply-only'} orders. This requires Head Office approval before the quote goes out.` })
    else if (mode === 'supply' && adv < 35)
      msgs.push({ type: 'warn', text: `Advance at ${adv}% (standard is 35%). If customer has negotiated this, document the reason and confirm with RSM before quoting.` })

    // Extended offer validity
    if (validity > 30 && validity <= 60)
      msgs.push({ type: 'info', text: `Offer validity set to ${validity} days (standard is 30). This is permissible with RSM sign-off — confirm before sending quote.` })
    if (validity > 60)
      msgs.push({ type: 'warn', text: `Offer validity is ${validity} days — beyond the 60-day maximum. Requires HO approval. KOEL pricing may change within this window; consider a price-validity clause.` })

    // Delivery check vs product minimums
    if (delivery) {
      const minWeeks = maxKva >= 750 ? 12 : maxKva >= 320 ? 8 : 6
      const hasOp = filled.some(g => g.selectedProduct?.isOptiprime)
      const opMin = 16
      if (hasOp && delivery < opMin)
        msgs.push({ type: 'warn', text: `Delivery set to ${delivery} weeks but Optiprime units need minimum ${opMin} weeks (factory-tested as a unit). Confirm slot with KOEL production before committing this to the customer.` })
      else if (!hasOp && delivery < minWeeks)
        msgs.push({ type: 'warn', text: `Delivery set to ${delivery} weeks — below minimum ${minWeeks} weeks for this product size. Production lead times are fixed; committing shorter delivery creates cancellation and penalty risk.` })
    }

    // Custom clause present — always flag for review
    if (ct.customClause?.trim().length > 20)
      msgs.push({ type: 'question', text: `Scope amendment noted: "${ct.customClause.trim().slice(0, 80)}${ct.customClause.trim().length > 80 ? '…' : ''}". This is a non-standard term — has it been validated against KOEL policy and signed off by RSM? Use the Validate button in Section C to check.` })
  }

  // ── Concerns analysis ──────────────────────────────────────────────────────
  if (concerns?.selected?.length > 0)
    msgs.push({ type: 'info', text: `${concerns.selected.length} concern${concerns.selected.length > 1 ? 's' : ''} noted from the segment checklist. These will appear in the pitch as "Customer's identified challenges" — making the WHY KOEL slide highly relevant to this specific customer.` })

  if (concerns?.text?.trim().length > 30)
    msgs.push({ type: 'info', text: `Case notes received (${concerns.text.trim().split(/\s+/).length} words). The pitch will reference these to make the recommendation feel tailored, not generic.` })

  // ── Final verdict ──────────────────────────────────────────────────────────
  const warnings = msgs.filter(m => m.type === 'warn')
  const allOk = msgs.length === 0 || warnings.length === 0
  if (allOk)
    msgs.push({ type: 'ok', text: `✅ Sizing and commercial terms check out. ${concerns?.selected?.length > 0 ? 'Noted concerns will personalise the pitch.' : 'Ready to generate the pitch.'}` })
  else
    msgs.push({ type: 'warn_summary', text: `${warnings.length} concern${warnings.length > 1 ? 's' : ''} flagged above — review before proceeding. You can address them here, adjust inputs, or generate anyway (issues will be flagged for the application engineer).` })

  return msgs
}

// ── Quick replies per segment ─────────────────────────────────────────────────
const QUICK_REPLIES = {
  datacentre:  ['N+1 is required — I\'ll add a second set', 'Single set is fine for this edge site', 'App engineer will confirm on site visit'],
  healthcare:  ['This is a full hospital', 'This is a clinic/day-care — smaller size is correct', 'Will add critical load segregation'],
  coldchain:   ['Switching to Pumps & Motors profile now', 'Mix of cold storage + office loads', 'Confirm during site visit'],
  industrial:  ['DOL motors confirmed — 50% loading sufficient', 'Soft-start/VFD in use — lower start surge', 'Will sequence motor restarts via AMF panel'],
  default:     ['Noted — will address on site visit', 'Customer has already confirmed this', 'Will flag for app engineer'],
}

// ── AI keyword response engine ────────────────────────────────────────────────
function aiRespond(text, customer, gensets) {
  const t = text.toLowerCase()
  const prod = gensets.find(g => g.selectedProduct)?.selectedProduct

  if (t.match(/n\+1|redundan/))
    return 'For N+1, two identical sets — each rated for 100% block load. Either unit can carry the full site independently. KOEL can supply and commission matched pairs with a synchronising panel if parallel operation is needed.'
  if (t.match(/wet stack|carbon|unload/))
    return 'Wet stacking: diesel engine running below ~30% load leaves unburned fuel deposits in the exhaust. Fix options: (1) right-size the genset so block load sits 40–65%, (2) quarterly load bank test at 70–80% load for 30 min. KOEL service includes load bank hire in most AMC contracts.'
  if (t.match(/amf|transfer|changeover|mains fail/))
    return 'KOEL AMF panels: mains failure detected on all 3 phases within 0.3–1s, engine started, load transferred in <10 seconds total. Transfer delay is adjustable (3–5s standard, avoids nuisance trips on momentary dips). Back-feed protection and neutral sensing are standard.'
  if (t.match(/cpcb|pollution|emission|norm/))
    return 'KOEL full range is CPCB IV+ certified — India\'s latest and strictest emission standard. The 7.5–250 kVA range uses EGR (exhaust gas recirculation) — no AdBlue/urea required. Larger sets use SCR. No urea = lower running cost + one less consumable for facility teams.'
  if (t.match(/noise|db|acoustic|sound|decibel/))
    return 'Standard open-type KOEL genset: 78–85 dB(A) @ 1m. With KOEL acoustic canopy: <75 dB(A) @ 1m. For zones requiring <65 dB(A): double-wall canopy or a dedicated acoustic room. KOEL application engineers can provide a noise assessment for your specific site layout.'
  if (t.match(/fuel|bsfc|consumption|litre|lph/))
    return `KOEL CPCB IV+ engines: ~0.26–0.31 L/kWh BSFC at 75% load — competitive with Cummins, better than most Chinese-origin sets. At KOEL's 50% block loading standard, the engine runs at part-load, slightly increasing L/kWh but well within normal DG operating range.`
  if (t.match(/price|cost|budget|quote|quotation/))
    return 'Exact pricing needs a formal quotation — I\'ll note a pricing discussion for next steps. General guidance: KOEL is typically 10–15% below Cummins at equivalent kVA, with lower 5-yr cost on sub-250 kVA (no AdBlue running cost).'
  if (t.match(/optiprime|hph|twin/))
    return 'Optiprime HHP: two matched engines on one genset frame, load-sharing intelligently. At part-load, one engine sleeps while the other runs at optimal efficiency — delivering up to 40% fuel saving vs single-engine equivalents. Available from 1010 kVA. Ideal for data centres and large industrial.'
  if (t.match(/service|amc|maintenance|breakdown/))
    return 'KOEL AMC: 2 preventive service visits/year + emergency callout. Response SLA: 4h in metros, 8h in Tier-2 cities. OEM-backed (not third-party dealers). KRM remote monitoring included on new sets — push alerts before failures escalate.'
  if (t.match(/krm|remote|monitor|iot/))
    return 'KRM — KOEL Remote Monitoring: tracks fuel level, battery voltage, run hours, fault codes, and live load graph. Alerts pushed to facility team and KOEL service. No extra hardware cost on new sets. Helps catch low-fuel or battery drain before a planned outage turns into an emergency.'
  if (t.match(/single set|one set|solo/))
    return 'Single set is absolutely fine for non-critical backup applications, smaller facilities, or sites where parallel operation infrastructure isn\'t available. KOEL offers AMC with priority response to compensate for absence of redundancy.'

  const seg = PITCH_SEGMENTS.find(s => s.id === customer.segmentId)
  return `Good question. For the ${seg?.label || 'selected'} sector, this is a typical application engineering query — the KOEL application engineer will have a site-specific answer during the site visit. Should I note this as a discussion point in the pitch?`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ n, title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--teal)', color: 'white', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate)', margin: 0 }}>{title}</h3>
      </div>
      {subtitle && <p style={{ fontSize: '0.8125rem', color: 'var(--gray)', margin: '0 0 0 38px', lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  )
}

function TextInput({ label, value, onChange, placeholder, type = 'text', required }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{required && <span style={{ color: 'var(--teal)', marginLeft: 2 }}>*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.9375rem', color: 'var(--slate)', background: 'white', border: `1.5px solid ${focused ? 'var(--teal)' : 'var(--border)'}`, outline: 'none', transition: 'border-color 150ms' }}
      />
    </div>
  )
}

// ── City autocomplete input — async, 94k-city India database ─────────────────
function CityInput({ value, onChange, onCitySelect }) {
  const [open,        setOpen]        = useState(false)
  const [focused,     setFocused]     = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const wrapRef    = useRef(null)
  const debounceRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const runSearch = useCallback((q) => {
    clearTimeout(debounceRef.current)
    if (!q || q.length < 2) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      setOpen(true)
      searchCities(q, 8).then(results => {
        setSuggestions(results)
        setLoading(false)
      }).catch(() => setLoading(false))
    }, 160)
  }, [])

  const handleChange = (v) => {
    onChange(v)
    runSearch(v)
  }

  const select = (city) => {
    onChange(city.label)
    onCitySelect?.(city)   // fires with full object so parent can auto-fill district, state, temp, alt
    setSuggestions([])
    setOpen(false)
  }

  const showDrop = open && (loading || suggestions.length > 0)

  return (
    <div ref={wrapRef} style={{ display: 'flex', flexDirection: 'column', gap: 5, position: 'relative' }}>
      <label style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>City / Town</label>
      <input
        type="text" value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => { setFocused(true); if (value.length >= 2) runSearch(value) }}
        onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 150) }}
        placeholder="Mumbai, Nagpur, Leh…"
        style={{ padding: '10px 14px', borderRadius: showDrop ? '8px 8px 0 0' : 8, fontFamily: 'inherit', fontSize: '0.9375rem', color: 'var(--slate)', background: 'white', border: `1.5px solid ${focused || showDrop ? 'var(--teal)' : 'var(--border)'}`, borderBottom: showDrop ? '1px solid var(--border)' : undefined, outline: 'none', transition: 'border-color 150ms' }}
      />
      {showDrop && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1.5px solid var(--teal)', borderTop: 'none', borderRadius: '0 0 8px 8px', zIndex: 100, boxShadow: '0 6px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {loading && (
            <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Searching 94,000+ cities…
            </div>
          )}
          {!loading && suggestions.map(c => (
            <div key={c.label + c.district} onMouseDown={() => select(c)}
              style={{ padding: '9px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--teal-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--slate)' }}>{c.label}</span>
                <span style={{ marginLeft: 6, fontSize: '0.7rem', color: 'var(--muted)' }}>{c.district}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>{c.state}</span>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// Optiprime configuration explainer text — what series vs parallel means in plain English
const OPTIPRIME_CONFIG_NOTES = {
  'Series': 'Two engines, end-to-end. At <70% load, one engine auto-shuts down — the other carries full load at peak efficiency. This is how Optiprime delivers up to 40% fuel saving at part-load.',
  'Parallel': 'Two engines side-by-side on a shared bus. Both run simultaneously for maximum redundancy. Suited for loads where engine failure cannot interrupt supply.',
  'Series (Containerised)': 'Containerised twin-pack for large infrastructure sites. Series operation — one engine idles when load is low. Factory-tested as a unit before delivery.',
}

function ProductMatchCard({ model, onSelect, selected, stepLabel }) {
  const [showOpInfo,   setShowOpInfo]   = useState(false)
  const [showFuel,     setShowFuel]     = useState(false)
  const [dieselPrice,  setDieselPrice]  = useState(93)
  const ll = loadingLabel(model.loadingPct)
  const isOp = model.isOptiprime
  const configNote = isOp ? OPTIPRIME_CONFIG_NOTES[model.configuration] : null
  const kwForFuel = model.deratKw || model.kw
  const fuelRows = showFuel ? fuelTable(kwForFuel, dieselPrice) : []

  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => onSelect(model)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: isOp && showOpInfo ? '10px 10px 0 0' : 10, border: selected ? '2px solid var(--teal)' : `1px solid ${isOp ? 'rgba(0,123,127,0.35)' : 'var(--border)'}`, background: selected ? 'var(--teal-light)' : isOp ? 'linear-gradient(135deg,#0D1F2D,#0F2A38)' : 'white', cursor: 'pointer', transition: 'all 150ms', overflow: 'hidden' }}>
        <img src={model.image} alt={model.model} style={{ width: 52, height: 44, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isOp ? 'white' : 'var(--slate)', fontFamily: 'var(--font-mono)' }}>{model.kva} kVA</span>
            <span style={{ fontSize: '0.75rem', color: isOp ? 'rgba(255,255,255,0.5)' : 'var(--gray)' }}>/ {model.kw} kW</span>
            {stepLabel && !isOp && <span style={{ background: stepLabel === 'Best fit' ? 'var(--teal-light)' : '#f1f5f9', color: stepLabel === 'Best fit' ? 'var(--teal)' : 'var(--gray)', fontSize: '0.58rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stepLabel}</span>}
            {isOp && <span style={{ background: 'var(--teal)', color: 'white', fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Optiprime</span>}
            {isOp && model.configuration && <span style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem', fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>{model.configuration.replace(' (Containerised)', ' 📦')}</span>}
            {model.derationPct > 0 && <span style={{ background: '#fff7ed', color: '#92400e', fontSize: '0.6rem', fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>−{model.derationPct}%</span>}
          </div>
          <div style={{ fontSize: '0.72rem', color: isOp ? 'rgba(255,255,255,0.45)' : 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {model.model || model.id}
            {model.engineModel && !isOp && <span style={{ marginLeft: 6, color: isOp ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>· {model.engineModel.split(' ')[0]}{model.cylinders ? ` (${model.cylinders}-cyl)` : ''}</span>}
            {model.derationPct > 0 && <span style={{ color: '#92400e', marginLeft: 5 }}>→ {model.deratKva} kVA eff.</span>}
          </div>
          {model.engineNote && <div style={{ fontSize: '0.66rem', color: isOp ? 'rgba(255,255,255,0.4)' : '#64748b', marginTop: 2, lineHeight: 1.3, fontStyle: 'italic' }}>{model.engineNote.split('.')[0]}.</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 99, background: selected ? 'var(--teal)' : ll.bg, color: selected ? 'white' : ll.color, fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {model.loadingPct}% {ll.text}
          </div>
          {selected && <div style={{ fontSize: '0.65rem', color: 'var(--teal)', fontWeight: 700 }}>Selected ✓</div>}
          <button onClick={e => { e.stopPropagation(); setShowFuel(v => !v) }}
            style={{ background: isOp ? 'rgba(255,255,255,0.10)' : 'var(--off-white)', border: `1px solid ${isOp ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`, borderRadius: 4, color: isOp ? 'rgba(255,255,255,0.6)' : 'var(--gray)', fontSize: '0.62rem', cursor: 'pointer', padding: '2px 7px', fontFamily: 'inherit', fontWeight: 600 }}>
            {showFuel ? 'Fuel ▲' : '⛽ Fuel ▾'}
          </button>
          {isOp && configNote && (
            <button onClick={e => { e.stopPropagation(); setShowOpInfo(v => !v) }}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 4, color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', cursor: 'pointer', padding: '2px 7px', fontFamily: 'inherit', fontWeight: 600 }}>
              {showOpInfo ? 'Less ▲' : 'How it works ▾'}
            </button>
          )}
        </div>
      </div>

      {/* Fuel consumption table */}
      {showFuel && (
        <div style={{ padding: '12px 14px', background: isOp ? '#071520' : '#f8fafc', border: `1px solid ${isOp ? 'rgba(0,123,127,0.25)' : 'var(--border)'}`, borderTop: 'none', borderRadius: (isOp && (showOpInfo || configNote)) ? 0 : '0 0 10px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isOp ? 'rgba(255,255,255,0.5)' : 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Estimated fuel consumption — {kwForFuel} kW effective
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: '0.65rem', color: isOp ? 'rgba(255,255,255,0.4)' : 'var(--muted)' }}>₹</span>
              <input type="number" value={dieselPrice} onChange={e => setDieselPrice(+e.target.value || 93)}
                onClick={e => e.stopPropagation()}
                style={{ width: 48, padding: '2px 5px', borderRadius: 4, border: `1px solid ${isOp ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`, fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: isOp ? 'rgba(255,255,255,0.06)' : 'white', color: isOp ? 'rgba(255,255,255,0.7)' : 'var(--slate)', outline: 'none', textAlign: 'center' }} />
              <span style={{ fontSize: '0.65rem', color: isOp ? 'rgba(255,255,255,0.4)' : 'var(--muted)' }}>/L</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr>
                {['Load %', 'L / hr', '₹ / hr', 'Note'].map(h => (
                  <th key={h} style={{ padding: '4px 8px', textAlign: h === 'Load %' ? 'center' : 'right', color: isOp ? 'rgba(255,255,255,0.35)' : 'var(--muted)', fontWeight: 600, borderBottom: `1px solid ${isOp ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`, fontSize: '0.68rem' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fuelRows.map(row => {
                const isCurrentLoad = model.loadingPct && Math.abs(model.loadingPct - row.loadPct) <= 15
                const isOptimal = row.loadPct === 75
                return (
                  <tr key={row.loadPct} style={{ background: isCurrentLoad ? (isOp ? 'rgba(0,123,127,0.2)' : 'var(--teal-light)') : 'transparent' }}>
                    <td style={{ padding: '5px 8px', textAlign: 'center', color: isCurrentLoad ? 'var(--teal)' : (isOp ? 'rgba(255,255,255,0.6)' : 'var(--slate)'), fontWeight: isCurrentLoad ? 700 : 500, fontFamily: 'var(--font-mono)' }}>
                      {row.loadPct}%{isCurrentLoad ? ' ◀' : ''}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: isOp ? 'rgba(255,255,255,0.7)' : 'var(--slate)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.lph}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', color: isOp ? 'rgba(255,255,255,0.5)' : 'var(--gray)', fontFamily: 'var(--font-mono)' }}>₹{row.costPerHr.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontSize: '0.65rem', color: isOptimal ? '#16a34a' : (isOp ? 'rgba(255,255,255,0.3)' : 'var(--muted)') }}>
                      {isOptimal ? '✦ optimal efficiency' : row.loadPct === 100 ? 'peak / max load' : 'part load'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ marginTop: 6, fontSize: '0.63rem', color: isOp ? 'rgba(255,255,255,0.25)' : 'var(--muted)', lineHeight: 1.4 }}>
            Estimates based on KOEL CPCB IV+ BSFC curve. Actual consumption ±5% by model. Update diesel price above for your region.
          </div>
        </div>
      )}

      {/* Optiprime configuration explainer — expands below */}
      {isOp && showOpInfo && configNote && (
        <div style={{ padding: '10px 14px', background: '#0a1f2e', borderRadius: '0 0 10px 10px', border: '1px solid rgba(0,123,127,0.35)', borderTop: 'none' }}>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            <span style={{ color: 'var(--teal)', fontWeight: 700, marginRight: 6 }}>⚡ {model.configuration}:</span>
            {configNote}
          </div>
          {model.kvaPerPack && (
            <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>
              {model.kvaPerPack} kVA × 2 packs · Engine: {model.engineModel} · {model.cylinders} cyl × 2
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Segment Smart Fields ──────────────────────────────────────────────────────
function SegmentSmartFields({ segmentId, values, onChange }) {
  const fields = SEGMENT_SMART_FIELDS[segmentId] || []
  if (!fields.length) return null

  const set = (id, val) => onChange({ ...values, [id]: val })
  const toggleMulti = (id, opt) => {
    const cur = values[id] || []
    set(id, cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt])
  }

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />
        <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Segment context</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 400 }}>— these sharpen the pitch angle (optional but recommended)</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {fields.map(f => (
          <div key={f.id}>
            <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', marginBottom: 7, lineHeight: 1.3 }}>{f.label}</div>
            {f.type === 'radio' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {f.options.map(opt => {
                  const active = values[f.id] === opt
                  return (
                    <button key={opt} onClick={() => set(f.id, active ? null : opt)}
                      style={{ padding: '7px 11px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', fontSize: '0.775rem', lineHeight: 1.35, background: active ? 'var(--teal)' : 'var(--off-white)', border: `1.5px solid ${active ? 'var(--teal)' : 'var(--border)'}`, color: active ? 'white' : 'var(--slate)', fontWeight: active ? 600 : 400, transition: 'all 100ms' }}>
                      {opt}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {f.options.map(opt => {
                  const active = (values[f.id] || []).includes(opt)
                  return (
                    <button key={opt} onClick={() => toggleMulti(f.id, opt)}
                      style={{ padding: '7px 11px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', fontSize: '0.775rem', lineHeight: 1.35, background: active ? 'var(--teal-light)' : 'var(--off-white)', border: `1.5px solid ${active ? 'var(--teal)' : 'var(--border)'}`, color: active ? 'var(--teal)' : 'var(--slate)', fontWeight: active ? 600 : 400, transition: 'all 100ms', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, marginTop: 1, border: `2px solid ${active ? 'var(--teal)' : '#ccc'}`, background: active ? 'var(--teal)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </span>
                      {opt}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Genset row ─────────────────────────────────────────────────────────────────
function GensetRow({ index, value, onChange, onRemove, canRemove, siteTemp, siteAlt }) {
  const sizing = useMemo(() => {
    if (!value.blockLoad || !value.loadProfile) return null
    return sizeGenset(+value.blockLoad, value.loadProfile, siteTemp ?? null, siteAlt ?? null)
  }, [value.blockLoad, value.loadProfile, siteTemp, siteAlt])

  const set = (field, val) => onChange({ ...value, [field]: val })
  const toggleConstraint = (id) => {
    const cur = value.spaceConstraints || []
    set('spaceConstraints', cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id])
  }

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 16, background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'var(--off-white)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--slate)' }}>
          DG Set {index + 1}
          {value.selectedProduct && <span style={{ marginLeft: 10, fontWeight: 400, color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>→ {value.selectedProduct.kva} kVA / {value.selectedProduct.kw} kW ({value.selectedProduct.model || value.selectedProduct.id})</span>}
        </div>
        {canRemove && <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--gray)', fontSize: '0.8rem', cursor: 'pointer', padding: '2px 6px' }}>Remove</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
        <div style={{ padding: '20px', borderRight: '1px solid var(--border)' }}>
          {/* Block Load */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Block Load
              <span title="Sum of all loads running simultaneously when grid fails — not total installed capacity." style={{ cursor: 'help' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="number" min={1} max={2000} step={1} value={value.blockLoad} onChange={e => set('blockLoad', e.target.value)} placeholder="e.g. 75"
                style={{ flex: 1, padding: '12px 14px', borderRadius: '8px 0 0 8px', border: '1.5px solid var(--border)', borderRight: 'none', fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--slate)', outline: 'none', background: 'white' }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <div style={{ padding: '12px 14px', background: 'var(--off-white)', border: '1.5px solid var(--border)', borderLeft: 'none', borderRadius: '0 8px 8px 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray)' }}>kW</div>
            </div>
            <div style={{ marginTop: 5, fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.4 }}>Simultaneous running load — not total installed capacity</div>
          </div>

          {/* Load Profile */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Load Profile</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {LOAD_PROFILES.map(lp => (
                <button key={lp.id} onClick={() => set('loadProfile', lp.id)} style={{ padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 150ms', background: value.loadProfile === lp.id ? 'var(--teal)' : 'var(--off-white)', border: `1.5px solid ${value.loadProfile === lp.id ? 'var(--teal)' : 'var(--border)'}`, color: value.loadProfile === lp.id ? 'white' : 'var(--slate)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{lp.label}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 1 }}>{lp.sublabel}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Site Constraints — multi-select pills */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Site Constraints <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(select all that apply)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SPACE_CONSTRAINTS.filter(sc => sc.id !== 'none').map(sc => {
                const active = (value.spaceConstraints || []).includes(sc.id)
                return (
                  <button key={sc.id} onClick={() => toggleConstraint(sc.id)} style={{ padding: '6px 11px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.775rem', fontWeight: active ? 600 : 500, background: active ? 'var(--teal)' : 'var(--off-white)', border: `1.5px solid ${active ? 'var(--teal)' : 'var(--border)'}`, color: active ? 'white' : 'var(--slate)', transition: 'all 150ms' }}>
                    {sc.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: product matches */}
        <div style={{ padding: '20px', background: sizing ? 'white' : 'var(--off-white)', minHeight: 220 }}>
          {!value.blockLoad && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 160 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8, opacity: 0.3 }}>⚡</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Enter block load to see matching products</div>
              </div>
            </div>
          )}
          {sizing && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Matching products</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--teal)', background: 'var(--teal-light)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Min {sizing.requiredKva} kVA</div>
              </div>

              {/* Engine progression strip — shows rep the engine family stepping up */}
              {sizing.matches.length > 1 && (() => {
                const engines = sizing.matches.map(m => m.engineModel?.split(' ')[0] || m.engineVariant || `${m.kva}kVA`).filter(Boolean)
                const unique = [...new Set(engines)]
                return unique.length > 1 ? (
                  <div style={{ marginBottom: 8, padding: '6px 10px', background: 'var(--off-white)', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: '0.68rem', color: 'var(--gray)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--slate)', marginRight: 2 }}>Engine options:</span>
                    {sizing.matches.map((m, i) => {
                      const eng = m.engineModel?.split(' ')[0] || `${m.kva}kVA`
                      return (
                        <span key={m.model} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <span style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--teal)', fontSize: '0.65rem' }}>{eng}</span>
                          <span style={{ color: 'var(--muted)', fontSize: '0.63rem' }}>{m.kva} kVA</span>
                          {i < sizing.matches.length - 1 && <span style={{ color: 'var(--border)', margin: '0 2px' }}>→</span>}
                        </span>
                      )
                    })}
                    <span style={{ marginLeft: 4, color: 'var(--muted)', fontSize: '0.63rem', fontStyle: 'italic' }}>— all options shown below, all qualify for your load</span>
                  </div>
                ) : null
              })()}

              {/* Deration warning banner */}
              {sizing.isDerated && sizing.derationPct >= 5 && (
                <div style={{ marginBottom: 10, padding: '8px 11px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, fontSize: '0.72rem', color: '#92400e', lineHeight: 1.5 }}>
                  ⚠️ <strong>Site deration active — {sizing.derationPct}%</strong>
                  <span style={{ display: 'block', marginTop: 2 }}>
                    Sizes shown are matched on derated output. Rated kVA will be higher than effective output at this site.
                  </span>
                </div>
              )}

              {sizing.matches.map((m, i) => (
                <ProductMatchCard key={m.model} model={m}
                  stepLabel={i === 0 ? 'Best fit' : i === 1 ? 'Step up →' : 'Larger option →'}
                  onSelect={m => set('selectedProduct', value.selectedProduct?.model === m.model ? null : m)}
                  selected={value.selectedProduct?.model === m.model} />
              ))}
              {sizing.optiprime.length > 0 && <>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', margin: '10px 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Optiprime HHP — up to 40% fuel saving</div>
                {sizing.optiprime.map(m => (
                  <ProductMatchCard key={m.id} model={m}
                    onSelect={m => set('selectedProduct', value.selectedProduct?.id === m.id ? null : m)}
                    selected={value.selectedProduct?.id === m.id} />
                ))}
              </>}
              {sizing.tighter.length > 0 && !value.selectedProduct && <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Tighter sizing (budget option)</div>
                {sizing.tighter.map(m => (
                  <ProductMatchCard key={m.model} model={m}
                    onSelect={m => set('selectedProduct', value.selectedProduct?.model === m.model ? null : m)}
                    selected={value.selectedProduct?.model === m.model} />
                ))}
              </div>}
              <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--off-white)', borderRadius: 8, fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                KOEL standard: 50% block loading · PF {sizing.profile.pf} · {sizing.profile.label}
                {sizing.isDerated && <span style={{ color: '#92400e' }}> · {sizing.derationPct}% site deration applied</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section C: Concerns ───────────────────────────────────────────────────────
function ConcernsSection({ segmentId, concerns, onChange }) {
  const challenges = SEGMENT_CHALLENGES[segmentId] || []
  const segLabel = PITCH_SEGMENTS.find(s => s.id === segmentId)?.label || 'this segment'

  const toggleChallenge = (c) => {
    const cur = concerns.selected || []
    onChange({ ...concerns, selected: cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c] })
  }

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '28px 28px 24px', marginBottom: 16 }}>
      <SectionLabel
        n="D"
        title="Context & Concerns"
        subtitle="This shapes the pitch — the more context you give, the more personalised the WHY KOEL slide becomes."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: free text */}
        <div>
          <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Your case notes
          </label>
          <textarea
            value={concerns.text}
            onChange={e => onChange({ ...concerns, text: e.target.value })}
            placeholder={'Write freely — Hinglish works too!\n\nE.g. "Customer ka purana DG Cummins ka hai, warranty khatam ho gayi. Chief Engineer ne bataya ke budget tight hai but downtime afford nahi kar sakte. Hospital expansion ho raha hai 6 months me, load badhega. Competitor already in talks..."\n\nAnything you know about this lead — technical constraints, decision makers, budget signals, what the customer is worried about.'}
            rows={9}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 8,
              border: '1.5px solid var(--border)', fontFamily: 'inherit',
              fontSize: '0.875rem', color: 'var(--slate)', background: 'var(--off-white)',
              resize: 'vertical', lineHeight: 1.6, outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--teal)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <div style={{ marginTop: 6, fontSize: '0.68rem', color: 'var(--muted)', lineHeight: 1.4 }}>
            💡 These notes feed the AI analysis and will personalise the "Why KOEL" slide — not shown directly to customer.
          </div>
        </div>

        {/* Right: challenges checklist */}
        <div>
          <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Known challenges in {segLabel} sector
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>— select all that apply</span>
          </label>

          {challenges.length === 0 ? (
            <div style={{ padding: '20px', background: 'var(--off-white)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
              Select a segment in Section A to see relevant challenges
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {challenges.map((c, i) => {
                const active = (concerns.selected || []).includes(c)
                return (
                  <div
                    key={i}
                    onClick={() => toggleChallenge(c)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      border: `1.5px solid ${active ? 'var(--teal)' : 'var(--border)'}`,
                      background: active ? 'var(--teal-light)' : 'var(--off-white)',
                      transition: 'all 150ms',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      border: `2px solid ${active ? 'var(--teal)' : 'var(--border)'}`,
                      background: active ? 'var(--teal)' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: active ? 'var(--teal)' : 'var(--slate)', lineHeight: 1.5, fontWeight: active ? 500 : 400 }}>{c}</span>
                  </div>
                )
              })}
            </div>
          )}

          {(concerns.selected || []).length > 0 && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--teal-light)', borderRadius: 8, fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 600, lineHeight: 1.4 }}>
              ✅ {(concerns.selected || []).length} challenge{(concerns.selected || []).length > 1 ? 's' : ''} selected → will appear in the WHY KOEL slide
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Engineering Assistant Chat ─────────────────────────────────────────────────
function ChatSection({ customer, gensets, concerns, commercialTerms, chatKey, onStatusChange }) {
  const [phase,      setPhase]      = useState('typing')
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [isTyping,   setIsTyping]   = useState(false)
  const [geminiOn,   setGeminiOn]   = useState(false)   // true once we confirm the function is alive
  const chatHistory  = useRef([])   // [{role:'user'|'model', text}] for Gemini multi-turn
  const bottomRef    = useRef(null)
  const scroll = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)

  // Run analysis on mount (and remount via chatKey)
  useState(() => {
    const run = () => {
      setPhase('typing')
      setMessages([])
      setTimeout(() => {
        const msgs = analyzeInputs(customer, gensets, concerns, commercialTerms)
        setMessages(msgs.map(m => ({ ...m, role: 'ai' })))
        setPhase('active')
        const hasWarnings = msgs.some(m => m.type === 'warn')
        const hasSummaryWarn = msgs.some(m => m.type === 'warn_summary')
        onStatusChange(hasWarnings || hasSummaryWarn ? 'warned' : 'clear')
        scroll()
      }, 1300)
    }
    run()
  })

  const sendUserMessage = async (text) => {
    if (!text.trim()) return
    const userText = text.trim()
    setMessages(m => [...m, { role: 'user', text: userText, type: 'user' }])
    setInput('')
    setIsTyping(true)
    scroll()

    // Build history for Gemini multi-turn context
    chatHistory.current.push({ role: 'user', text: userText })

    try {
      const ctx   = buildPitchContext(customer, gensets, concerns, commercialTerms)
      const reply = await askGemini(userText, chatHistory.current.slice(-10), ctx)

      if (reply) {
        // Gemini responded — mark as live
        if (!geminiOn) setGeminiOn(true)
        chatHistory.current.push({ role: 'model', text: reply })
        setMessages(m => [...m, { role: 'ai', text: reply, type: 'info' }])
      } else {
        // Gemini not available (local dev) — use rule-based fallback
        const fallback = aiRespond(userText, customer, gensets)
        chatHistory.current.push({ role: 'model', text: fallback })
        setMessages(m => [...m, { role: 'ai', text: fallback, type: 'info' }])
      }
    } catch {
      const fallback = aiRespond(userText, customer, gensets)
      setMessages(m => [...m, { role: 'ai', text: fallback, type: 'info' }])
    } finally {
      setIsTyping(false)
      scroll()
    }
  }

  const msgStyle = (type, role) => {
    if (role === 'user')       return { bg: 'var(--teal)', color: 'white', border: 'none' }
    if (type === 'ok')         return { bg: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }
    if (type === 'warn' || type === 'warn_summary') return { bg: '#fff7ed', color: '#92400e', border: '1px solid #fed7aa' }
    if (type === 'question')   return { bg: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }
    return { bg: 'white', color: 'var(--slate)', border: '1px solid var(--border)' }
  }

  const icons = { ok:'✅', warn:'⚠️', warn_summary:'⚠️', question:'🤔', info:'💬' }
  const quickReplies = QUICK_REPLIES[customer.segmentId] || QUICK_REPLIES.default

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1.5px solid var(--teal)', overflow: 'hidden', marginBottom: 16, boxShadow: '0 4px 24px rgba(0,123,127,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'linear-gradient(135deg,#0D1F2D,#0a2a1a)', borderBottom: '1px solid rgba(0,123,127,0.3)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#007B7F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.875rem' }}>🤖</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'white', fontSize: '0.875rem' }}>KOEL Engineering Assistant</span>
            {geminiOn && <span style={{ fontSize: '0.6rem', background: '#16a34a', color: 'white', padding: '1px 6px', borderRadius: 99, fontWeight: 700, letterSpacing: '0.04em' }}>Gemini ●</span>}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
            {phase === 'typing' ? 'Analysing your inputs…' : geminiOn ? 'Powered by Gemini — ask me anything' : 'Analysis complete — ask me anything'}
          </div>
        </div>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {phase === 'typing' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ padding: '10px 16px', background: 'var(--off-white)', borderRadius: '4px 14px 14px 14px', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: '0.85rem', display: 'flex', gap: 6, alignItems: 'center' }}>
              Reviewing sizing and context
              {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', animation: `pulse 0.9s ${i*0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        {messages.map((m, i) => {
          const s = msgStyle(m.type, m.role)
          const isUser = m.role === 'user'
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 8 }}>
              {!isUser && <span style={{ fontSize: '0.9rem', flexShrink: 0, marginTop: 2 }}>{icons[m.type] || '💬'}</span>}
              <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: s.bg, color: s.color, border: s.border, fontSize: '0.8125rem', lineHeight: 1.55 }}>
                {m.text}
              </div>
            </div>
          )
        })}
        {isTyping && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>🤖</span>
            <div style={{ padding: '10px 14px', background: 'var(--off-white)', borderRadius: '4px 14px 14px 14px', border: '1px solid var(--border)', display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', animation: `pulse 0.9s ${i*0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {phase === 'active' && (
        <>
          <div style={{ padding: '0 20px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {quickReplies.map(qr => (
              <button key={qr} onClick={() => sendUserMessage(qr)} style={{ padding: '5px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.72rem', fontWeight: 500, background: 'var(--teal-light)', border: '1px solid rgba(0,123,127,0.3)', color: 'var(--teal)' }}>
                {qr}
              </button>
            ))}
          </div>
          <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendUserMessage(input)}
              placeholder="Ask about N+1, AMF timing, noise levels, acoustic options…"
              style={{ flex: 1, padding: '9px 14px', borderRadius: 8, fontFamily: 'inherit', fontSize: '0.875rem', color: 'var(--slate)', background: 'var(--off-white)', border: '1.5px solid var(--border)', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = 'var(--teal)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={() => sendUserMessage(input)} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--teal)', color: 'white', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, flexShrink: 0 }}>Send</button>
          </div>
        </>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

// ── Commercial Terms Section (Section D) ──────────────────────────────────────
// Shows after chat. Product-aware warranty, editable commercial terms, scope amendments.
// AI validation (Phase 2): custom clauses will be sent to Gemini with GEMINI_VALIDATION_CONTEXT.
function CommercialTermsSection({ selectedProducts, value, onChange }) {
  const [validating,    setValidating]    = useState(false)
  const [clauseResult,  setClauseResult]  = useState(null)  // null | { verdict, reason, alt }
  const [showFixed,     setShowFixed]     = useState(false)

  const warranty = getWarrantyTerms(selectedProducts.length ? selectedProducts : [{}])
  const maxKva   = selectedProducts.length ? Math.max(...selectedProducts.map(p => p.kva || 0)) : 0
  const hasOp    = selectedProducts.some(p => p.isOptiprime)
  const delivery = getDeliveryDefault(maxKva, hasOp)

  // Sync delivery default when product selection changes
  const effectiveDelivery = value.deliveryWeeks ?? delivery.weeks
  const effectiveMode     = value.paymentMode ?? 'supply'
  const modeObj           = EDITABLE_TERMS.paymentMode.options.find(o => o.id === effectiveMode)
  const advDefault        = EDITABLE_TERMS.paymentAdvance.default[effectiveMode]
  const advMin            = EDITABLE_TERMS.paymentAdvance.min[effectiveMode]
  const advMax            = EDITABLE_TERMS.paymentAdvance.max[effectiveMode]
  const effectiveAdv      = value.paymentAdvance ?? advDefault

  const set = (k, v2) => onChange({ ...value, [k]: v2 })

  const validateField = (termKey, val, extra) => {
    const t = EDITABLE_TERMS[termKey]
    if (!t?.validate) return null
    return t.validate(val, extra, maxKva)
  }

  // Validation results for each editable numeric field
  const vOffer    = validateField('offerValidity',  value.offerValidity  ?? 30)
  const vAdv      = validateField('paymentAdvance', effectiveAdv, effectiveMode)
  const vDelivery = validateField('deliveryWeeks',  effectiveDelivery, null, maxKva)

  // Phase 2: real Gemini call replaces this stub
  const validateCustomClause = async () => {
    if (!value.customClause?.trim()) return
    setValidating(true)
    setClauseResult(null)
    // --- Phase 2 Gemini call goes here ---
    // const result = await callGemini(value.customClause, GEMINI_VALIDATION_CONTEXT)
    // setClauseResult(result)
    // Stub: simulate a response after 1.2s
    setTimeout(() => {
      setClauseResult({
        verdict: 'warn',
        reason:  'AI validation will be available in Phase 2 (Gemini integration). The clause has been noted in the brief for RSM review.',
        alt:     'Attach a formal scope amendment note signed by RSM before committing this to the customer.',
      })
      setValidating(false)
    }, 1200)
  }

  const validationBadge = (result) => {
    if (!result) return null
    const map = {
      true:  { bg: '#f0fdf4', border: '#a7f3d0', color: '#065f46', icon: '✅' },
      warn:  { bg: '#fff7ed', border: '#fed7aa', color: '#92400e', icon: '⚠️' },
      false: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: '❌' },
    }
    const key = result.ok === true ? 'true' : result.ok === 'warn' ? 'warn' : 'false'
    const s = map[key]
    return (
      <div style={{ marginTop: 4, padding: '5px 9px', borderRadius: 6, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontSize: '0.7rem', lineHeight: 1.4 }}>
        {s.icon} {result.msg}
      </div>
    )
  }

  const inputStyle = (result) => ({
    width: '100%', padding: '8px 11px', borderRadius: 7,
    border: `1.5px solid ${result?.ok === false ? '#fca5a5' : result?.ok === 'warn' ? '#fcd34d' : 'var(--border)'}`,
    fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--slate)',
    background: 'white', outline: 'none', boxSizing: 'border-box',
  })

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '28px 28px 24px', marginBottom: 16 }}>
      <SectionLabel
        n="C"
        title="Commercial Terms"
        subtitle="Product-aware defaults from KOEL standard policy (Annexure 2 & 3). Edit within permitted limits — red fields need RSM approval."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Scope (supply vs I&C) */}
        <div>
          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Scope</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {EDITABLE_TERMS.paymentMode.options.map(opt => (
              <button key={opt.id} onClick={() => {
                set('paymentMode', opt.id)
                set('paymentAdvance', opt.advance)
              }}
                style={{ flex: 1, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.775rem', lineHeight: 1.3, textAlign: 'left', background: effectiveMode === opt.id ? 'var(--teal)' : 'var(--off-white)', border: `1.5px solid ${effectiveMode === opt.id ? 'var(--teal)' : 'var(--border)'}`, color: effectiveMode === opt.id ? 'white' : 'var(--slate)', fontWeight: effectiveMode === opt.id ? 600 : 400 }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.8 }}>{opt.advance}% adv + {opt.balance}% {opt.id === 'supply' ? 'before dispatch' : 'after commissioning'}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Advance % */}
        <div>
          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Advance Payment <span style={{ fontWeight: 400, textTransform: 'none' }}>(standard: {advDefault}%, range {advMin}–{advMax}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min={advMin} max={advMax} step={5} value={effectiveAdv}
              onChange={e => set('paymentAdvance', +e.target.value)}
              style={{ flex: 1, accentColor: 'var(--teal)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--slate)', minWidth: 36, textAlign: 'right' }}>{effectiveAdv}%</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
            Balance: {100 - effectiveAdv}% {modeObj?.balanceTrigger}
          </div>
          {validationBadge(vAdv)}
        </div>

        {/* Offer validity */}
        <div>
          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Offer Validity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={value.offerValidity ?? 30} min={15} max={90} step={5}
              onChange={e => set('offerValidity', +e.target.value)}
              style={{ ...inputStyle(vOffer), width: 80 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>days from quotation date</span>
          </div>
          {validationBadge(vOffer)}
        </div>

        {/* Delivery */}
        <div>
          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Delivery Estimate</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={effectiveDelivery} min={4} max={36} step={2}
              onChange={e => set('deliveryWeeks', +e.target.value)}
              style={{ ...inputStyle(vDelivery), width: 80 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--gray)' }}>weeks ex-works · <span style={{ color: 'var(--teal)', fontWeight: 600 }}>{delivery.label}</span></span>
          </div>
          {validationBadge(vDelivery)}
        </div>

        {/* Quoted price */}
        <div>
          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Quoted Price <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional — get from ERP/dealer)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>₹</span>
            <input type="text" value={value.quotedPrice ?? ''} placeholder="e.g. 83,91,079"
              onChange={e => set('quotedPrice', e.target.value)}
              style={{ ...inputStyle(null), width: '100%' }} />
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 4 }}>
            Ex-works, excl. GST 18% + freight. Internal use — appears in brief, not in customer slide.
          </div>
        </div>

        {/* Warranty — product-aware, not editable */}
        <div>
          <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Warranty</div>
          <div style={{ padding: '10px 12px', background: hasOp ? 'linear-gradient(135deg,#0D1F2D,#0a2a1a)' : 'var(--off-white)', borderRadius: 8, border: `1px solid ${hasOp ? 'rgba(0,123,127,0.4)' : 'var(--border)'}` }}>
            <div style={{ fontSize: '0.775rem', color: hasOp ? 'white' : 'var(--slate)', fontWeight: 600, marginBottom: 4 }}>{warranty.period}</div>
            <div style={{ fontSize: '0.68rem', color: hasOp ? 'rgba(255,255,255,0.5)' : 'var(--muted)', marginBottom: 3 }}>{warranty.note}</div>
            {warranty.serviceChecks && <div style={{ fontSize: '0.67rem', color: hasOp ? 'rgba(255,255,255,0.4)' : 'var(--gray)', borderTop: `1px solid ${hasOp ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`, paddingTop: 4, marginTop: 4 }}>🔧 {warranty.serviceChecks}</div>}
            {warranty.cspNote && <div style={{ fontSize: '0.65rem', color: hasOp ? 'rgba(0,210,220,0.6)' : 'var(--teal)', marginTop: 3 }}>📋 {warranty.cspNote}</div>}
            <div style={{ fontSize: '0.63rem', color: hasOp ? 'rgba(255,255,255,0.25)' : 'var(--gray)', marginTop: 5 }}>Source: {warranty.source}</div>
          </div>
        </div>
      </div>

      {/* Scope amendments / custom clauses — the "unprecedented change" provision */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
          <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scope Amendments & Custom Clauses</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 400 }}>— for any non-standard commitments or scope changes</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'flex-start' }}>
          <div>
            <textarea
              value={value.customClause ?? ''}
              onChange={e => { set('customClause', e.target.value); setClauseResult(null) }}
              placeholder={'Describe any deviation from standard terms or scope changes here.\n\nE.g. "Customer requested 45-day offer validity" or "Rep committed to include cable laying in KOEL scope (not standard)" or "Customer wants 3-year warranty on HHP set"\n\nHinglish is fine. AI validation checks this against KOEL permissible limits.'}
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #fcd34d', fontFamily: 'inherit', fontSize: '0.8rem', color: 'var(--slate)', background: '#fffbeb', resize: 'vertical', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#f59e0b'}
              onBlur={e => e.target.style.borderColor = '#fcd34d'}
            />
          </div>
          <button onClick={validateCustomClause} disabled={!value.customClause?.trim() || validating}
            style={{ padding: '10px 16px', borderRadius: 8, border: 'none', cursor: value.customClause?.trim() && !validating ? 'pointer' : 'not-allowed', background: value.customClause?.trim() ? '#f59e0b' : 'var(--border)', color: value.customClause?.trim() ? 'white' : 'var(--muted)', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap', marginTop: 0 }}>
            {validating ? 'Checking…' : '🤖 Validate'}
          </button>
        </div>
        {clauseResult && (
          <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 8, background: clauseResult.verdict === 'YES' ? '#f0fdf4' : clauseResult.verdict === 'NO' ? '#fef2f2' : '#fff7ed', border: `1.5px solid ${clauseResult.verdict === 'YES' ? '#a7f3d0' : clauseResult.verdict === 'NO' ? '#fecaca' : '#fcd34d'}`, fontSize: '0.775rem', color: 'var(--slate)', lineHeight: 1.55 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              {clauseResult.verdict === 'YES' ? '✅ Within policy' : clauseResult.verdict === 'NO' ? '❌ Outside standard policy' : '⚠️ Needs approval'}
            </div>
            <div>{clauseResult.reason}</div>
            {clauseResult.alt && clauseResult.alt !== 'N/A — clause is fine' && (
              <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(255,255,255,0.6)', borderRadius: 6, fontStyle: 'italic', color: 'var(--gray)' }}>
                💡 Suggested safe alternative: {clauseResult.alt}
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: '0.68rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          ⚡ AI validation (Phase 2) will check this clause against KOEL permissible limits in real time using Gemini. Currently shows policy guidance stub.
        </div>
      </div>

      {/* Fixed terms — collapsible */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 16 }}>
        <button onClick={() => setShowFixed(v => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.775rem', color: 'var(--gray)', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {showFixed ? '▲' : '▶'} Standard fixed terms (Annexure 2 — always apply, not negotiable)
        </button>
        {showFixed && (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FIXED_TERMS.map(t => (
              <div key={t.id} style={{ padding: '9px 12px', background: 'var(--off-white)', borderRadius: 7, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate)', marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray)', lineHeight: 1.45 }}>{t.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Blank genset factory ───────────────────────────────────────────────────────
const blankGenset = (id) => ({ id, blockLoad: '', loadProfile: 'mixed', selectedProduct: null, spaceConstraints: [] })

// ── Reconstruct gensets from brief ────────────────────────────────────────────
function briefToGensets(briefGensets) {
  if (!briefGensets?.length) return [blankGenset(1)]
  return briefGensets.map((gs, i) => ({
    id: i + 1,
    blockLoad: String(gs.blockLoadKw || ''),
    loadProfile: gs.loadProfile || 'mixed',
    selectedProduct: gs.product || null,
    spaceConstraints: gs.spaceConstraints || [],
  }))
}

// ── Main PitchBuilder component ────────────────────────────────────────────────
export default function PitchBuilder() {
  const navigate     = useNavigate()
  const { state }    = useLocation()
  const rb           = state?.brief || state?.returnBrief  // brief: from Edit / History; returnBrief: legacy

  const [customer, setCustomer] = useState(() => rb ? {
    name:      rb.customerName || '',
    segmentId: rb.segmentId || '',
    city:      rb.city || '',
    district:  rb.district || '',
    state:     rb.state || '',
    date:      rb.meetingDate || new Date().toISOString().slice(0, 10),
    pincode:   rb.pincode || '',
  } : {
    name: '', segmentId: '', city: '', district: '', state: '',
    date: new Date().toISOString().slice(0, 10), pincode: '',
  })

  const [gensets,        setGensets]        = useState(() => briefToGensets(rb?.gensets))
  const [concerns,       setConcerns]       = useState(() => ({ text: rb?.userConcerns || '', selected: rb?.selectedChallenges || [] }))
  const [segmentContext, setSegmentContext] = useState(() => rb?.segmentContext || {})
  const [showChat,       setShowChat]       = useState(false)
  const [chatStatus,     setChatStatus]     = useState('idle') // 'idle'|'typing'|'warned'|'clear'
  const [chatKey,        setChatKey]        = useState(0)      // increment to remount ChatSection
  const [error,          setError]          = useState('')
  const [commercialTerms, setCommercialTerms] = useState(() => rb?.commercialTerms || {})
  const chatRef = useRef(null)

  // Manual site conditions — auto-filled from city selection, but rep can override
  const [siteConditions, setSiteConditions] = useState(() => {
    const sc = rb?.siteConditions
    return { temp: sc?.temp ? String(sc.temp) : '', alt: sc?.alt ? String(sc.alt) : '' }
  })

  const setCustomerField = (f, v) => setCustomer(c => ({ ...c, [f]: v }))
  const updateGenset  = (i, updated) => setGensets(gs => gs.map((g, idx) => idx === i ? updated : g))
  const addGenset     = () => setGensets(gs => [...gs, blankGenset(gs.length + 1)])
  const removeGenset  = (i) => setGensets(gs => gs.filter((_, idx) => idx !== i))

  const handleSegmentSelect = (seg) => {
    setCustomerField('segmentId', seg.id)
    setGensets(gs => gs.map((g, i) => i === 0 && !g.blockLoad ? { ...g, loadProfile: seg.defaultLoad } : g))
    // Reset concerns and segment context when segment changes
    setConcerns(c => ({ ...c, selected: [] }))
    setSegmentContext({})
    setShowChat(false)
    setChatStatus('idle')
  }

  // When user picks a city from autocomplete, auto-populate pincode, district, state, site conditions
  const handleCitySelect = (city) => {
    setCustomer(c => ({
      ...c,
      district: city.district || '',
      state:    city.state    || '',
      pincode:  city.pincode  || c.pincode,  // only overwrite if city has pincode
    }))
    setSiteConditions({ temp: String(city.maxAmbientTemp), alt: String(city.altitudeMSL) })
  }

  // Effective deration — computed from siteConditions (which may be manually overridden)
  const effectiveDerationInfo = useMemo(() => {
    const t = parseFloat(siteConditions.temp)
    const a = parseFloat(siteConditions.alt)
    if (isNaN(t) && isNaN(a)) return null
    const tempDerate = isNaN(t) ? 0 : Math.max(0, t - 40) * 0.02
    const altDerate  = isNaN(a) ? 0 : Math.max(0, (a - 1000) / 100) * 0.01
    const factor = (1 - tempDerate) * (1 - altDerate)
    const totalPct = +((1 - factor) * 100).toFixed(1)
    if (totalPct <= 0) return null
    const parts = []
    if (tempDerate > 0) parts.push(`${+(tempDerate * 100).toFixed(1)}% heat (${t}°C)`)
    if (altDerate  > 0) parts.push(`${+(altDerate  * 100).toFixed(1)}% altitude (${a}m MSL)`)
    return { totalPct, breakdown: parts.join(' + '), isSignificant: totalPct >= 10 }
  }, [siteConditions.temp, siteConditions.alt])

  const dgHasLoad = gensets.some(g => g.blockLoad)

  const handleAnalyse = () => {
    if (!dgHasLoad) { setError('Enter at least one block load value first.'); return }
    setError('')
    setChatStatus('typing')
    setChatKey(k => k + 1)     // remount ChatSection → fresh analysis
    setShowChat(true)
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const canGenerate = customer.name && customer.segmentId && gensets.some(g => g.selectedProduct)
  const generateReady = canGenerate && (chatStatus === 'clear' || chatStatus === 'warned')

  const handleGenerate = () => {
    if (!customer.name)    { setError('Enter the customer name.'); return }
    if (!customer.segmentId) { setError('Select the industry segment.'); return }
    if (!gensets.some(g => g.selectedProduct)) { setError('Select at least one product.'); return }
    if (chatStatus === 'idle') { setError('Run the analysis first — click "Analyse inputs →" above.'); return }
    setError('')

    const rep     = repProfile.getForPitch()
    const segment = PITCH_SEGMENTS.find(s => s.id === customer.segmentId)

    const brief = {
      customerName:       customer.name,
      segment:            segment?.label || customer.segmentId,
      segmentId:          customer.segmentId,
      city:               customer.city,
      district:           customer.district,
      state:              customer.state,
      pincode:            customer.pincode,
      meetingDate:        customer.date,
      repName:            rep.repName,
      repDesignation:     rep.repDesignation,
      repRegion:          rep.repRegion,
      kva:                gensets.filter(g => g.selectedProduct).map(g => `${g.selectedProduct.kva} kVA`).join(', '),
      userConcerns:       concerns.text,
      selectedChallenges: concerns.selected,
      segmentContext,     // smart field answers
      commercialTerms,    // offer validity, payment mode/advance, delivery, price, custom clause
      siteConditions: {   // effective values used for sizing (may be overridden from city defaults)
        temp: parseFloat(siteConditions.temp) || null,
        alt:  parseFloat(siteConditions.alt)  || null,
      },
      gensets: gensets.filter(g => g.selectedProduct).map(g => ({
        blockLoadKw:      +g.blockLoad,
        loadProfile:      g.loadProfile,
        product:          g.selectedProduct,
        spaceConstraints: g.spaceConstraints || [],
      })),
    }

    navigate('/pitch/output', { state: { brief } })
  }

  // Generate button appearance
  const genBtnStyle = () => {
    if (!canGenerate || chatStatus === 'idle')
      return { bg: 'var(--border)', color: 'var(--muted)', cursor: 'not-allowed' }
    if (chatStatus === 'typing')
      return { bg: 'var(--border)', color: 'var(--muted)', cursor: 'not-allowed' }
    if (chatStatus === 'warned')
      return { bg: '#f59e0b', color: 'white', cursor: 'pointer' }
    return { bg: 'var(--teal)', color: 'white', cursor: 'pointer' }
  }
  const genBtn = genBtnStyle()

  const genBtnLabel = () => {
    if (!canGenerate)            return 'Select customer, segment, and at least one product'
    if (chatStatus === 'idle')   return 'Run analysis first → click "Analyse inputs" above'
    if (chatStatus === 'typing') return 'Analysing…'
    if (chatStatus === 'warned') return '⚠️ Issues flagged — review above, or generate anyway →'
    return 'Generate Customer Pitch →'
  }

  return (
    <div style={{ background: 'var(--off-white)', minHeight: 'calc(100vh - 64px - 80px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 60px' }}>

        <div style={{ marginBottom: 36 }}>
          <div className="section-eyebrow">Pitch Builder</div>
          <h1 style={{ fontSize: '1.875rem', marginBottom: 8 }}>Build a customer pitch</h1>
          <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
            Size the DG, capture the context, and generate a personalised 5-slide customer presentation.
          </p>
        </div>

        {/* ── Section A ── */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '28px 28px 24px', marginBottom: 16 }}>
          <SectionLabel n="A" title="Customer context" />

          {/* Row 1 — three user-filled inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 10 }}>
            <TextInput label="Customer name" value={customer.name} onChange={v => setCustomerField('name', v)} placeholder="Company or contact name" required />
            <CityInput value={customer.city} onChange={v => setCustomerField('city', v)} onCitySelect={handleCitySelect} />
            <TextInput label="Meeting date" value={customer.date} onChange={v => setCustomerField('date', v)} type="date" />
          </div>

          {/* Row 2 — auto-populated, visually lighter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Pincode',    key: 'pincode',  ph: 'Auto fetches' },
              { label: 'District',   key: 'district', ph: 'Auto fetches' },
              { label: 'State / UT', key: 'state',    ph: 'Auto fetches' },
            ].map(({ label, key, ph }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
                <input
                  type="text"
                  value={customer[key]}
                  onChange={e => setCustomerField(key, e.target.value)}
                  placeholder={ph}
                  style={{ padding: '7px 11px', borderRadius: 7, fontFamily: 'inherit', fontSize: '0.845rem', color: customer[key] ? 'var(--slate)' : 'var(--muted)', background: '#f8fafc', border: '1px solid #e2e8f0', outline: 'none', transition: 'border-color 150ms' }}
                  onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            ))}
          </div>
          {/* Site conditions — auto-filled from city, manually overrideable */}
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Site conditions</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Max temp</span>
              <input type="number" value={siteConditions.temp} onChange={e => setSiteConditions(s => ({ ...s, temp: e.target.value }))}
                placeholder="°C"
                style={{ width: 58, padding: '5px 8px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--slate)', background: 'white', outline: 'none', textAlign: 'center' }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>°C</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Altitude</span>
              <input type="number" value={siteConditions.alt} onChange={e => setSiteConditions(s => ({ ...s, alt: e.target.value }))}
                placeholder="m"
                style={{ width: 68, padding: '5px 8px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--slate)', background: 'white', outline: 'none', textAlign: 'center' }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>m MSL</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--muted)', fontStyle: 'italic' }}>
              {customer.city && (siteConditions.temp || siteConditions.alt)
                ? `Auto-filled from ${customer.city} — edit if your site differs`
                : 'Auto-fills when city is selected · leave blank for 40°C / sea level'}
            </span>
            {(siteConditions.temp || siteConditions.alt) && (
              <button onClick={() => setSiteConditions({ temp: '', alt: '' })}
                style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'inherit' }}>
                Clear ✕
              </button>
            )}
          </div>
          {/* Deration banner — updates dynamically with manual overrides */}
          {effectiveDerationInfo && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: effectiveDerationInfo.isSignificant ? '#fff7ed' : '#f0fdf4', border: `1.5px solid ${effectiveDerationInfo.isSignificant ? '#fed7aa' : '#a7f3d0'}`, borderRadius: 8, fontSize: '0.775rem', color: effectiveDerationInfo.isSignificant ? '#92400e' : '#065f46', lineHeight: 1.5 }}>
              {effectiveDerationInfo.isSignificant ? '⚠️' : 'ℹ️'} <strong>Site deration: −{effectiveDerationInfo.totalPct}%</strong>
              <span style={{ marginLeft: 6, fontWeight: 400 }}>{effectiveDerationInfo.breakdown}</span>
              <span style={{ display: 'block', marginTop: 2, opacity: 0.8 }}>Product recommendations below account for this — rated kVA is bumped up accordingly.</span>
            </div>
          )}

          <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Industry segment<span style={{ color: 'var(--teal)', marginLeft: 2 }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {PITCH_SEGMENTS.map(seg => (
              <button key={seg.id} onClick={() => handleSegmentSelect(seg)} style={{ padding: '10px 6px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', border: '1.5px solid', background: customer.segmentId === seg.id ? 'var(--teal)' : 'var(--off-white)', borderColor: customer.segmentId === seg.id ? 'var(--teal)' : 'var(--border)', color: customer.segmentId === seg.id ? 'white' : 'var(--slate)', transition: 'all 150ms' }}>
                <div style={{ fontSize: '1.25rem', marginBottom: 4 }}>{seg.icon}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, lineHeight: 1.2 }}>{seg.label}</div>
              </button>
            ))}
          </div>

          {/* Segment-driven smart context fields */}
          {customer.segmentId && (
            <SegmentSmartFields
              segmentId={customer.segmentId}
              values={segmentContext}
              onChange={setSegmentContext}
            />
          )}
        </div>

        {/* ── Section B ── */}
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', padding: '28px 28px 20px', marginBottom: 16 }}>
          <SectionLabel n="B" title="DG requirements" subtitle="Enter the block load for each set. KOEL sizes at 50% block loading — motor start headroom + future expansion built in." />
          {gensets.map((g, i) => (
            <GensetRow key={g.id} index={i} value={g} onChange={updated => updateGenset(i, updated)} onRemove={() => removeGenset(i)} canRemove={gensets.length > 1} siteTemp={parseFloat(siteConditions.temp) || null} siteAlt={parseFloat(siteConditions.alt) || null} />
          ))}
          <button onClick={addGenset} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, cursor: 'pointer', background: 'none', border: '1.5px dashed var(--border)', color: 'var(--teal)', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, transition: 'all 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--teal-light)'; e.currentTarget.style.borderColor='var(--teal)' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='var(--border)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add another DG set
          </button>
        </div>

        {/* ── Section C: Commercial Terms ── */}
        <CommercialTermsSection
          selectedProducts={gensets.filter(g => g.selectedProduct).map(g => g.selectedProduct)}
          value={commercialTerms}
          onChange={setCommercialTerms}
        />

        {/* ── Section D: Context & Concerns ── */}
        {customer.segmentId && (
          <ConcernsSection segmentId={customer.segmentId} concerns={concerns} onChange={setConcerns} />
        )}

        {/* ── Analyse button ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={handleAnalyse} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 8, cursor: 'pointer', background: 'var(--slate)', border: 'none', color: 'white', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700, transition: 'all 150ms' }}>
            {showChat ? 'Re-analyse →' : 'Analyse inputs →'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* ── Chat section ── */}
        {showChat && (
          <div ref={chatRef}>
            <ChatSection key={chatKey} customer={customer} gensets={gensets} concerns={concerns} commercialTerms={commercialTerms} chatKey={chatKey} onStatusChange={setChatStatus} />
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 18px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: '0.875rem', marginBottom: 16, fontWeight: 500 }}>{error}</div>
        )}

        {/* ── Generate CTA ── */}
        <button onClick={handleGenerate} disabled={!generateReady && chatStatus !== 'warned'}
          style={{ width: '100%', padding: '16px 24px', borderRadius: 10, border: 'none', cursor: genBtn.cursor, background: genBtn.bg, color: genBtn.color, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 700, transition: 'all 200ms', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          {genBtnLabel()}
        </button>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.75rem', color: 'var(--muted)' }}>
          Generates a 5-slide presentation — cover, sizing recommendation, TCO, why KOEL, next steps
        </div>

      </div>
    </div>
  )
}
