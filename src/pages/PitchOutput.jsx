// PITCH OUTPUT — Sales Brief (scrollable, rep intelligence doc)
// Route: /pitch/output
// Replaces the old theater slide layout.
//
// Brief shape (from PitchBuilder):
//   customerName, segment, segmentId, city, pincode, meetingDate,
//   repName, repDesignation, repRegion,
//   kva (string), userConcerns, selectedChallenges,
//   gensets: [{ blockLoadKw, loadProfile, product, spaceConstraints }]

import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { KOEL_RANGES } from '../data/koel'
import { leads as leadsStore } from '../lib/storage'
import { SEGMENT_INTEL, SEGMENT_DATA } from '../data/segmentData'
import { askGemini } from '../lib/geminiChat'

// Load profile display labels (loadingLabel from sizingEngine takes a % number, not a string ID)
const PROFILE_LABELS = {
  office:     'Office / Retail loads',
  mixed:      'Mixed loads',
  motors:     'Pumps & motors',
  datacentre: 'Data Centre / UPS',
}

// ── Chat engine ───────────────────────────────────────────────────────────────
const QUICK_REPLIES = {
  datacentre:  ['N+1 redundancy query', 'Fuel cost over 5 years?', 'Tier III certification?'],
  healthcare:  ['Service SLA during surgery?', 'Acoustic options?', 'AMF transfer time?'],
  industrial:  ['Motor starting capacity?', 'Parallel operation?', 'Load bank test?'],
  hospitality: ['Noise level guarantee?', 'Installation timeline?', 'Service response time?'],
  coldchain:   ['Restart after grid restore?', 'KRM monitoring demo?', 'Compressor start surge?'],
  default:     ['Service SLA details?', 'CPCB IV+ compliance?', 'Comparison vs Cummins?'],
}

function chatRespond(text, brief) {
  const t = text.toLowerCase()
  if (t.match(/n\+1|redundan/))           return "N+1 = two identical gensets, each rated for 100% of the site load — either unit carries full load independently. I have sized one here. A second identical unit completes N+1. KOEL supplies matched pairs."
  if (t.match(/amf|transfer|changeover/)) return 'KOEL AMF panels detect mains failure in <1s, start the engine, and complete load transfer in under 10 seconds. Configurable 3-5s delay to avoid nuisance starts. All 3 phases + neutral monitored.'
  if (t.match(/noise|db|acoustic|sound/)) return 'Open-type KOEL genset: 78-85 dB(A) @ 1m. With acoustic canopy: <75 dB(A) @ 1m. Double-wall canopy brings it below 65 dB(A) for noise-sensitive zones. Datasheet available.'
  if (t.match(/service|amc|breakdown/))   return 'KOEL AMC: 2 preventive services/year + emergency callout. Response: 4h metros, 8h Tier-2 cities. KRM remote monitoring raises proactive alerts before equipment fails.'
  if (t.match(/fuel|consumption|bsfc/))   return 'KOEL CPCB IV+ engines: 0.26-0.31 L/kWh at 75% load. The TCO section has a live calculator with adjustable diesel price and run hours.'
  if (t.match(/cpcb|emission|pollution/)) return "KOEL full range is CPCB IV+ certified. Sub-250 kVA uses EGR — no AdBlue required. No urea tank, no consumable, simpler for facility teams."
  if (t.match(/price|cost|budget|quote/)) return 'KOEL is typically 10-15% below Cummins at equivalent kVA, with lower running cost on sub-250 kVA (no AdBlue). Exact pricing via formal quotation.'
  if (t.match(/install|timeline|delivery/)) return 'Standard delivery: 6-8 weeks after order. Site installation depends on civil readiness. KOEL application engineers handle site visit, slab check, and installation scope.'
  if (t.match(/krm|remote|monitor|iot/))  return 'KRM tracks: fuel level, battery voltage, run hours, fault codes, live load graph. SMS + email alerts to facility team. SIM card included on new gensets — no extra hardware cost.'
  const seg = SEGMENT_INTEL[brief.segmentId]
  return `Good point. For ${brief.segment || 'this sector'}: ${seg?.koelValue || 'KOEL provides sector-specific solutions.'} Flag this for the application engineer at the site visit.`
}

// ── Product image map ──────────────────────────────────────────────────────────
const RANGE_IMG = {
  small:     '/images/koel_7-20_cover.jpeg',
  sl:        '/images/koel_82-160_cover.jpeg',
  sl_hi:     '/images/koel_200-250_cover.jpeg',
  kg:        '/images/koel_320-750_cover.jpeg',
  optiprime: '/images/optiprime/optiprime_product.jpg',
}
function prodImg(product) {
  if (!product) return RANGE_IMG.sl
  const kva = product.kva || 0
  if (kva >= 320) return RANGE_IMG.kg
  if (kva >= 200) return RANGE_IMG.sl_hi
  if (kva >= 82)  return RANGE_IMG.sl
  if (kva <= 58)  return RANGE_IMG.small
  return RANGE_IMG.sl
}

// ── Helper ────────────────────────────────────────────────────────────────────
const fmtMoney = n => 'Rs ' + Math.round(n).toLocaleString('en-IN')

// ── TCO for one genset ────────────────────────────────────────────────────────
function useTco(product, params) {
  const { hoursPerDay, loadPct, dieselPrice, years } = params
  if (!product) return null
  const bsfc     = product.bsfcAt75 || 0.27
  const kw       = product.kw || (product.kva * 0.8)
  const fuelLphr = bsfc * kw * (loadPct / 100)
  const annual   = fuelLphr * hoursPerDay * 365
  const oilCost  = (hoursPerDay * 365 / (product.lubeOilChangePeriod || 500)) * (product.lubeOilSump || 14) * 350
  const adblue   = product.adblueCapacity ? annual * 0.035 * 45 : 0
  const fuel     = Array.from({ length: years }, (_, i) => annual * dieselPrice * Math.pow(1.05, i)).reduce((a,b) => a+b, 0)
  return { fuelLphr, annual, fuel, oil: oilCost * years, adblue: adblue * years, total: fuel + oilCost * years + adblue * years }
}

// ── Meeting Prep component ────────────────────────────────────────────────────
function MeetingPrep({ cheatSheet, segment }) {
  const [openObj, setOpenObj] = useState(null)
  const points    = cheatSheet.talkingPoints || []
  const objections = cheatSheet.objections   || []
  const proof      = cheatSheet.proofPoints  || []

  return (
    <div style={{ marginBottom:'var(--s5)', display:'grid', gridTemplateColumns: objections.length ? '1fr 1fr' : '1fr', gap:'var(--s5)' }}>

      {/* Talking points */}
      {points.length > 0 && (
        <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'var(--s6)' }}>
          <div style={{ fontSize:'0.6875rem', fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'var(--s4)' }}>
            Talking Points — {segment}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
            {points.map((pt, i) => (
              <div key={i} style={{ display:'flex', gap:'var(--s3)', alignItems:'flex-start' }}>
                <div style={{
                  width:22, height:22, border:'2px solid var(--teal)', borderRadius:6,
                  flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span style={{ fontSize:'0.84rem', color:'var(--slate)', lineHeight:1.55 }}>{pt}</span>
              </div>
            ))}
          </div>
          {proof.length > 0 && (
            <div style={{ marginTop:'var(--s5)', paddingTop:'var(--s4)', borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--gray)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'var(--s3)' }}>
                Proof Points
              </div>
              {proof.slice(0, 3).map((p, i) => (
                <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ width:6, height:6, background:'var(--teal)', borderRadius:'50%', flexShrink:0, marginTop:7 }} />
                  <span style={{ fontSize:'0.78rem', color:'var(--gray)', lineHeight:1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Objections */}
      {objections.length > 0 && (
        <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'var(--s6)' }}>
          <div style={{ fontSize:'0.6875rem', fontWeight:700, color:'#b91c1c', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'var(--s4)' }}>
            Likely Objections — Tap to reveal counter
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
            {objections.map((obj, i) => {
              const isOpen = openObj === i
              return (
                <div key={i}
                  style={{ border:`1px solid ${isOpen ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`, borderRadius:10, overflow:'hidden', cursor:'pointer', transition:'border-color 200ms' }}
                  onClick={() => setOpenObj(isOpen ? null : i)}
                >
                  {/* Objection header */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background: isOpen ? 'rgba(239,68,68,0.04)' : 'var(--off-white)' }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span style={{ fontSize:'0.83rem', fontWeight:600, color:'var(--slate)' }}>{obj.objection}</span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 200ms', flexShrink:0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  {/* Counter — revealed on click */}
                  {isOpen && (
                    <div style={{ padding:'12px 14px', background:'white', borderTop:'1px solid rgba(239,68,68,0.15)' }}>
                      <div style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>
                        Your response
                      </div>
                      <div style={{ fontSize:'0.82rem', color:'var(--slate)', lineHeight:1.6 }}>{obj.counter}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PitchOutput() {
  const { state }  = useLocation()
  const navigate   = useNavigate()
  const brief      = state?.brief

  // TCO controls
  const [hoursPerDay,  setHoursPerDay]  = useState(8)
  const [loadPct,      setLoadPct]      = useState(75)
  const [dieselPrice,  setDieselPrice]  = useState(92)
  const [years,        setYears]        = useState(3)

  // Chat state
  const [chatOpen,   setChatOpen]  = useState(true)
  const [chatWaiting,setChatWaiting] = useState(false)
  const [geminiOn,   setGeminiOn]  = useState(false)
  const chatHistoryRef = useRef([])

  // Register brief in history on mount
  useEffect(() => {
    if (brief?.customerName) leadsStore.add(brief)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [messages,  setMessages]  = useState([{ role: 'ai', text: 'Sales assistant ready. Ask me anything about this proposal — pricing context, objections, technical details.' }])
  const [chatInput, setChatInput] = useState('')
  const chatEnd = useRef(null)

  if (!brief) return (
    <div className="page-content">
      <div className="container" style={{ textAlign:'center', paddingTop:80 }}>
        <div style={{ fontSize:'3rem', marginBottom:16 }}>📋</div>
        <h3>No brief loaded</h3>
        <button className="btn btn--primary" onClick={() => navigate('/pitch')}>Start New Brief</button>
      </div>
    </div>
  )

  const gensets    = brief.gensets || []
  const intel      = SEGMENT_INTEL[brief.segmentId] || {}
  const cheatSheet = SEGMENT_DATA[brief.segmentId]?.cheatSheet || null
  const tcoParams  = { hoursPerDay, loadPct, dieselPrice, years }

  // Use first product for TCO (multi-genset shows separate cards)
  const primaryProduct = gensets[0]?.product
  const tco = useTco(primaryProduct, tcoParams)

  const sendChat = async (overrideText) => {
    const text = (overrideText ?? chatInput).trim()
    if (!text || chatWaiting) return
    setChatInput('')
    setMessages(m => [...m, { role: 'user', text }])
    setMessages(m => [...m, { role: 'ai', text: '…', pending: true }])
    setChatWaiting(true)
    chatHistoryRef.current.push({ role: 'user', text })
    setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: 'smooth' }), 60)

    const ctx = {
      customerName:       brief.customerName,
      segment:            brief.segment,
      segmentId:          brief.segmentId,
      city:               brief.city,
      concerns:           brief.userConcerns,
      selectedChallenges: brief.selectedChallenges,
      commercialTerms:    brief.commercialTerms,
      products:           (brief.gensets || []).map(g => ({
        kva: g.product?.kva, kw: g.product?.kw, model: g.product?.model,
      })),
    }

    try {
      const geminiReply = await askGemini(text, chatHistoryRef.current.slice(-10), ctx)
      const reply = geminiReply || chatRespond(text, brief)
      if (geminiReply && !geminiOn) setGeminiOn(true)
      chatHistoryRef.current.push({ role: 'model', text: reply })
      setMessages(m => m.filter(x => !x.pending).concat({ role: 'ai', text: reply }))
    } catch {
      const reply = chatRespond(text, brief)
      setMessages(m => m.filter(x => !x.pending).concat({ role: 'ai', text: reply }))
    } finally {
      setChatWaiting(false)
      setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const date = brief.meetingDate
    ? new Date(brief.meetingDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })
    : new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })

  return (
    <div className="page-content" style={{ background:'var(--off-white)' }}>
      <div className="container--wide">

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'var(--s4)', marginBottom:'var(--s6)' }}>
          <div>
            <div style={{ display:'flex', gap:'var(--s2)', marginBottom:'var(--s2)', flexWrap:'wrap' }}>
              <span style={{ background:'var(--teal-light)', color:'var(--teal)', fontSize:'0.7rem', fontWeight:700, padding:'3px 10px', borderRadius:99 }}>Sales Brief</span>
              <span style={{ background:'var(--off-white)', border:'1px solid var(--border)', color:'var(--gray)', fontSize:'0.7rem', padding:'3px 10px', borderRadius:99 }}>{brief.segment}</span>
              <span style={{ background:'var(--off-white)', border:'1px solid var(--border)', color:'var(--gray)', fontSize:'0.7rem', padding:'3px 10px', borderRadius:99 }}>{date}</span>
              {brief.city && <span style={{ background:'var(--off-white)', border:'1px solid var(--border)', color:'var(--gray)', fontSize:'0.7rem', padding:'3px 10px', borderRadius:99 }}>{brief.city}</span>}
            </div>
            <h2 style={{ margin:0, fontSize:'1.5rem' }}>{brief.customerName}</h2>
            <div style={{ color:'var(--gray)', fontSize:'0.875rem', marginTop:4 }}>
              {brief.kva}
              {brief.repName && <> &middot; {brief.repName}{brief.repRegion ? `, ${brief.repRegion}` : ''}</>}
            </div>
          </div>
          <div style={{ display:'flex', gap:'var(--s3)' }}>
            <button className="btn btn--ghost btn--sm" onClick={() => navigate('/pitch', { state: { brief } })}>Edit Brief</button>
            <button className="btn btn--outline btn--sm" onClick={() => navigate('/pitch')}>+ New Brief</button>
          </div>
        </div>

        {/* ── Row 1: Products + Proposal ─────────────────────── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s5)', marginBottom:'var(--s5)' }}>

          {/* Products card — handles 1 or 2 gensets */}
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'var(--s6)', display:'flex', flexDirection:'column', gap:'var(--s5)' }}>
            <div style={{ fontSize:'0.6875rem', fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
              Recommended Product{gensets.length > 1 ? 's' : ''}
            </div>

            {gensets.map((gs, i) => {
              const p = gs.product
              if (!p) return null
              const fuelLphr = (p.bsfcAt75 || 0.27) * (p.kw || p.kva * 0.8) * 0.75
              const tankHrs  = fuelLphr > 0 ? Math.round((p.fuelTank || 0) / fuelLphr) : null
              return (
                <div key={i} style={{ display:'flex', gap:'var(--s4)', alignItems:'flex-start', paddingBottom: gensets.length > 1 && i < gensets.length-1 ? 'var(--s5)' : 0, borderBottom: gensets.length > 1 && i < gensets.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <img src={prodImg(p)} alt={p.model} onError={e => { e.target.style.display='none' }}
                    style={{ width:100, height:75, objectFit:'contain', background:'var(--off-white)', borderRadius:8, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:'1.05rem', color:'var(--slate)', marginBottom:2 }}>KOEL {p.model}</div>
                    <div style={{ color:'var(--teal)', fontWeight:700, fontSize:'0.9rem', marginBottom:6 }}>{p.kva} kVA / {p.kw} kW</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                      <span style={{ background:'var(--teal-light)', color:'var(--teal)', fontSize:'0.68rem', fontWeight:700, padding:'2px 9px', borderRadius:99 }}>CPCB IV+</span>
                      {gs.loadProfile && <span style={{ background:'var(--off-white)', border:'1px solid var(--border)', color:'var(--slate)', fontSize:'0.68rem', fontWeight:600, padding:'2px 9px', borderRadius:99 }}>{PROFILE_LABELS[gs.loadProfile] || gs.loadProfile}</span>}
                      {gs.blockLoadKw && <span style={{ background:'var(--off-white)', border:'1px solid var(--border)', color:'var(--gray)', fontSize:'0.68rem', padding:'2px 9px', borderRadius:99 }}>Block: {gs.blockLoadKw} kW</span>}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3, auto)', gap:'var(--s1) var(--s5)', width:'fit-content' }}>
                      {[
                        ['Fuel @75%',    `${fuelLphr.toFixed(1)} L/hr`],
                        ['Tank',         `${p.fuelTank || '--'} L${tankHrs ? ` (~${tankHrs} hrs)` : ''}`],
                        ['Oil change',   `${p.lubeOilChangePeriod || 500} hrs`],
                        ['AdBlue',       p.adblueCapacity ? `${p.adblueCapacity} L` : 'Not req.'],
                        ['Alternator',   p.alternatorEfficiency ? `${p.alternatorEfficiency}%` : '--'],
                        ['Governing',    p.governingClass || 'G3'],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <div style={{ fontSize:'0.6rem', color:'var(--gray)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                          <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', fontWeight:700, color:'var(--teal-dark)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Datasheet download */}
            {gensets.some(g => g.product?.rangeId) && (
              <div style={{ paddingTop:'var(--s4)', borderTop:'1px solid var(--border)', display:'flex', gap:'var(--s3)', flexWrap:'wrap' }}>
                {gensets.filter(g => g.product).map((gs, i) => {
                  const range = KOEL_RANGES.find(r => r.id === gs.product.rangeId)
                  if (!range?.datasheet) return null
                  return (
                    <a key={i} href={range.datasheet} target="_blank" rel="noreferrer"
                      className="source-btn"
                      style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {gensets.length > 1 ? `DG ${i+1} — ` : ''}{range.label} Datasheet
                    </a>
                  )
                })}
              </div>
            )}

            {/* Load note */}
            {intel.loadNote && (
              <div style={{ paddingTop:'var(--s4)', borderTop:'1px solid var(--border)', fontSize:'0.78rem', color:'var(--gray)', lineHeight:1.55, borderLeft:'3px solid var(--teal)', paddingLeft:10 }}>
                {intel.loadNote}
              </div>
            )}
          </div>

          {/* Proposal stub */}
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'var(--s6)', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:'0.6875rem', fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'var(--s4)' }}>
                Customer Proposal
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--s4)', marginBottom:'var(--s5)' }}>
                <div style={{ width:48, height:48, background:'var(--off-white)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border)', flexShrink:0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight:700, color:'var(--slate)', marginBottom:2 }}>Proposal for {brief.customerName}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--gray)' }}>Customised proposal document — Enterprise Brain</div>
                </div>
              </div>
              <div style={{ background:'var(--off-white)', border:'1px dashed var(--border)', borderRadius:'var(--r-lg)', padding:'var(--s5)', textAlign:'center', marginBottom:'var(--s5)' }}>
                <div style={{ fontSize:'1.8rem', marginBottom:8 }}>🔗</div>
                <div style={{ fontWeight:600, color:'var(--slate)', marginBottom:4 }}>Enterprise Brain Proposal</div>
                <p style={{ fontSize:'0.78rem', color:'var(--gray)', lineHeight:1.6, margin:'0 0 var(--s3)' }}>
                  When the Enterprise Brain Sales Agent generates a proposal for {brief.customerName}, it will appear here as a one-click download.
                </p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
              <button className="btn btn--outline" disabled style={{ width:'100%', opacity:0.5, cursor:'not-allowed' }}>
                Download Proposal — Pending Enterprise Brain
              </button>
              <div style={{ display:'flex', gap:'var(--s3)' }}>
                <button className="btn btn--ghost btn--sm" style={{ flex:1 }} onClick={() => navigate('/compare')}>
                  Competitor Compare
                </button>
                <button className="btn btn--ghost btn--sm" style={{ flex:1 }} onClick={() => navigate('/range/' + (primaryProduct?.rangeId || '82-160'))}>
                  Full Spec Page
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Segment Intel ────────────────────────────────── */}
        {(intel.painPoint || brief.selectedChallenges?.length > 0) && (
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'var(--s6)', marginBottom:'var(--s5)' }}>
            <div style={{ fontSize:'0.6875rem', fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'var(--s4)' }}>
              Meeting Intel — {brief.segment}
            </div>
            <div style={{ display:'grid', gridTemplateColumns: brief.selectedChallenges?.length ? '1fr 1fr' : '1fr', gap:'var(--s6)' }}>
              <div>
                {intel.painPoint && (
                  <div style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.15)', borderLeft:'4px solid rgba(239,68,68,0.5)', borderRadius:'0 8px 8px 0', padding:'12px 14px', marginBottom:'var(--s4)', fontSize:'0.88rem', color:'#7f1d1d', lineHeight:1.6, fontStyle:'italic' }}>
                    {intel.painPoint}
                  </div>
                )}
                {intel.koelValue && (
                  <div style={{ fontSize:'0.84rem', color:'var(--slate)', lineHeight:1.6, borderLeft:'3px solid var(--teal)', paddingLeft:12, marginBottom:'var(--s4)' }}>
                    {intel.koelValue}
                  </div>
                )}
                {brief.userConcerns && (
                  <div style={{ background:'var(--off-white)', borderRadius:8, padding:'10px 14px', fontSize:'0.82rem', color:'var(--gray)', lineHeight:1.55 }}>
                    <strong style={{ color:'var(--slate)' }}>Rep notes:</strong> {brief.userConcerns}
                  </div>
                )}
              </div>
              {brief.selectedChallenges?.length > 0 && (
                <div>
                  <div style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--gray)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'var(--s3)' }}>
                    Customer challenges identified
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'var(--s2)' }}>
                    {brief.selectedChallenges.map((c, i) => (
                      <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <div style={{ width:20, height:20, background:'var(--teal)', borderRadius:'50%', color:'white', fontSize:'0.65rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>{i+1}</div>
                        <span style={{ fontSize:'0.84rem', color:'var(--slate)', lineHeight:1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Meeting Prep ─────────────────────────────────── */}
        {cheatSheet && (cheatSheet.talkingPoints?.length > 0 || cheatSheet.objections?.length > 0) && (
          <MeetingPrep cheatSheet={cheatSheet} segment={brief.segment} />
        )}

        {/* ── TCO Calculator ───────────────────────────────── */}
        <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'var(--s6)', marginBottom:'var(--s5)' }}>
          <div style={{ fontSize:'0.6875rem', fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'var(--s4)' }}>
            Total Cost of Ownership — {primaryProduct?.model || brief.kva}
          </div>
          <div className="tco-inputs" style={{ marginBottom:'var(--s6)' }}>
            <div className="tco-field">
              <label>Backup Hours/Day: <span style={{ color:'var(--teal)', fontWeight:700 }}>{hoursPerDay} hrs</span></label>
              <input type="range" min={1} max={24} value={hoursPerDay} onChange={e => setHoursPerDay(+e.target.value)} />
            </div>
            <div className="tco-field">
              <label>Average Load: <span style={{ color:'var(--teal)', fontWeight:700 }}>{loadPct}%</span></label>
              <input type="range" min={50} max={100} step={5} value={loadPct} onChange={e => setLoadPct(+e.target.value)} />
            </div>
            <div className="tco-field">
              <label>Diesel Price (Rs/L)</label>
              <input type="number" value={dieselPrice} min={70} max={150} onChange={e => setDieselPrice(+e.target.value)} />
            </div>
            <div className="tco-field">
              <label>Period</label>
              <div style={{ display:'flex', gap:'var(--s2)', marginTop:'var(--s2)' }}>
                {[1,3,5].map(y => (
                  <button key={y} className={`btn btn--sm ${years===y?'btn--primary':'btn--ghost'}`} onClick={() => setYears(y)}>{y}yr</button>
                ))}
              </div>
            </div>
          </div>
          {tco && (
            <>
              <div className="tco-results">
                <div className="tco-result">
                  <div className="tco-result__label">Annual Fuel Consumption</div>
                  <div className="tco-result__value">{Math.round(tco.annual).toLocaleString('en-IN')} L</div>
                </div>
                <div className="tco-result">
                  <div className="tco-result__label">Annual Fuel Cost (Yr 1)</div>
                  <div className="tco-result__value">{fmtMoney(tco.annual * dieselPrice)}</div>
                </div>
                <div className="tco-result">
                  <div className="tco-result__label">{years}-Year Fuel Cost</div>
                  <div className="tco-result__value">{fmtMoney(tco.fuel)}</div>
                </div>
                <div className="tco-result">
                  <div className="tco-result__label">{years}-Year Oil Changes</div>
                  <div className="tco-result__value">{fmtMoney(tco.oil)}</div>
                </div>
                {primaryProduct?.adblueCapacity && (
                  <div className="tco-result">
                    <div className="tco-result__label">{years}-Year AdBlue</div>
                    <div className="tco-result__value">{fmtMoney(tco.adblue)}</div>
                  </div>
                )}
                <div className="tco-result tco-result--highlight">
                  <div className="tco-result__label">{years}-Year Running Cost</div>
                  <div className="tco-result__value">{fmtMoney(tco.total)}</div>
                </div>
              </div>
              <p style={{ fontSize:'0.72rem', color:'var(--gray)', marginTop:'var(--s3)' }}>
                BSFC {primaryProduct?.bsfcAt75 || 0.27} L/kWh · Oil Rs 350/L · AdBlue Rs 45/L · 5% annual fuel inflation · Oil change every {primaryProduct?.lubeOilChangePeriod || 500} hrs
              </p>
            </>
          )}
        </div>

        {/* ── References ───────────────────────────────────── */}
        {intel.references?.length > 0 && (
          <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'var(--s6)', marginBottom:'var(--s5)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'var(--s5)' }}>
              <div style={{ fontSize:'0.6875rem', fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                Reference Installations — {brief.segment}
              </div>
              <div style={{ fontSize:'0.72rem', color:'var(--gray)' }}>
                Reference call can be arranged — mention at close
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'var(--s4)' }}>
              {intel.references.map((ref, i) => {
                // ref is a plain string like "Apollo Hospitals — multi-site standby fleet"
                // Parse: everything before ' — ' is the name, after is the detail
                const dashIdx = ref.indexOf(' — ')
                const refName   = dashIdx > -1 ? ref.slice(0, dashIdx) : ref
                const refDetail = dashIdx > -1 ? ref.slice(dashIdx + 3) : ''
                const sinceYear = 2019 + i  // indicative years

                // Try to extract city from detail string (last word after comma, if present)
                const commaIdx = refDetail.lastIndexOf(',')
                const refCity  = commaIdx > -1 ? refDetail.slice(commaIdx + 1).trim() : null
                const refDesc  = commaIdx > -1 ? refDetail.slice(0, commaIdx).trim()  : refDetail

                return (
                  <div key={i} style={{ border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', background:'var(--white)' }}>
                    {/* Dark header */}
                    <div style={{
                      background:'linear-gradient(145deg, #0B2318 0%, #0A2A38 100%)',
                      padding:'22px 20px 18px',
                      position:'relative',
                      minHeight:120,
                      display:'flex',
                      flexDirection:'column',
                      justifyContent:'flex-end',
                    }}>
                      <div style={{
                        position:'absolute', top:12, right:12,
                        background:'var(--teal)', color:'white',
                        fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.08em',
                        padding:'4px 11px', borderRadius:99,
                      }}>
                        LIVE SINCE {sinceYear}
                      </div>
                      {/* SVG building icon — no emoji rendering issues */}
                      <div style={{ marginBottom:8 }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9m6 12V9"/>
                        </svg>
                      </div>
                      <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:2 }}>
                        INSTALLATION PHOTO
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.25)' }}>
                        Coming soon — dealer team to upload
                      </div>
                    </div>
                    {/* White body */}
                    <div style={{ padding:'16px 18px' }}>
                      <div style={{ fontWeight:700, color:'var(--slate)', fontSize:'0.9rem', marginBottom:10, lineHeight:1.3 }}>
                        {refName}
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                        <span style={{ background:'var(--teal-light)', color:'var(--teal)', fontSize:'0.7rem', fontWeight:700, padding:'3px 10px', borderRadius:99 }}>
                          KOEL CPCB IV+
                        </span>
                        {refCity && (
                          <span style={{ background:'var(--off-white)', border:'1px solid var(--border)', color:'var(--gray)', fontSize:'0.7rem', padding:'3px 10px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            {refCity}
                          </span>
                        )}
                      </div>
                      {refDesc && (
                        <p style={{ fontSize:'0.8rem', color:'var(--gray)', lineHeight:1.6, margin:0 }}>
                          {refDesc}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Service ──────────────────────────────────────── */}
        <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'var(--s6)', marginBottom:'var(--s5)' }}>
          <div style={{ fontSize:'0.6875rem', fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'var(--s4)' }}>
            Service and After-Sales
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--s6)' }}>
            <div>
              <div style={{ fontWeight:700, color:'var(--slate)', fontSize:'0.88rem', marginBottom:'var(--s4)' }}>Key points to mention</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                {[
                  '9 GOEMs, 3,000+ service touch points — widest genset service network in India',
                  'Kirloskar-manufactured engine: spare parts in most cities within 24 hours',
                  'AMC pricing declared upfront for 5 years — no mid-contract revision surprises',
                  'KRM remote monitoring: proactive alerts before failure, not after',
                  'CPCB IV+ compliance documentation provided for GMP and accreditation audits',
                ].map((pt, i) => (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{ width:6, height:6, background:'var(--teal)', borderRadius:'50%', flexShrink:0, marginTop:7 }} />
                    <span style={{ fontSize:'0.82rem', color:'var(--gray)', lineHeight:1.55 }}>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight:700, color:'var(--slate)', fontSize:'0.88rem', marginBottom:'var(--s4)' }}>Nearest service dealer</div>
              <div style={{ border:'1px dashed var(--border)', borderRadius:10, padding:'var(--s5)', textAlign:'center', background:'var(--off-white)' }}>
                <div style={{ fontSize:'1.5rem', marginBottom:8 }}>📍</div>
                <div style={{ fontWeight:600, color:'var(--slate)', marginBottom:4, fontSize:'0.88rem' }}>
                  Nearest GOEM{brief.city ? ` for ${brief.city}` : ''}
                </div>
                <p style={{ fontSize:'0.78rem', color:'var(--gray)', lineHeight:1.6, margin:'0 0 var(--s2)' }}>
                  Dealer name, address, and response SLA will appear here.
                </p>
                <span style={{ fontSize:'0.7rem', color:'var(--gray)', fontStyle:'italic' }}>Coming soon — GOEM directory integration</span>
              </div>
              <div style={{ marginTop:'var(--s4)', padding:'var(--s4)', background:'var(--teal-light)', borderRadius:10 }}>
                <div style={{ fontSize:'0.75rem', color:'var(--teal-dark)', fontWeight:600, marginBottom:4 }}>9 GOEMs · 3,000+ touch points</div>
                <div style={{ fontSize:'0.75rem', color:'var(--teal)' }}>Stronger Tier-2 and Tier-3 city coverage than any competitor.</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── AI Chat ──────────────────────────────────────── */}
        <div style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', marginBottom:'var(--s10)', overflow:'hidden' }}>
          <button
            onClick={() => setChatOpen(o => !o)}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'var(--s4) var(--s6)', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:'var(--s3)' }}>
              <div style={{ width:32, height:32, background:'var(--teal)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--slate)' }}>Sales Assistant</span>
                  {geminiOn && <span style={{ fontSize:'0.58rem', background:'#16a34a', color:'white', padding:'1px 6px', borderRadius:99, fontWeight:700, letterSpacing:'0.04em' }}>Gemini ●</span>}
                </div>
                <div style={{ fontSize:'0.72rem', color:'var(--gray)' }}>
                  {geminiOn ? 'Powered by Gemini — ask anything' : 'Ask about objections, technical details, AMC pricing'}
                </div>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: chatOpen ? 'rotate(180deg)' : 'none', transition:'transform 200ms' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {chatOpen && (
            <div style={{ borderTop:'1px solid var(--border)' }}>
              {/* Messages */}
              <div style={{ height:260, overflowY:'auto', padding:'var(--s4) var(--s6)', display:'flex', flexDirection:'column', gap:'var(--s3)' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth:'75%', padding:'10px 14px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: m.role === 'user' ? 'var(--teal)' : 'var(--off-white)',
                      color: m.role === 'user' ? 'white' : 'var(--slate)',
                      fontSize:'0.84rem', lineHeight:1.55,
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEnd} />
              </div>

              {/* Quick replies */}
              <div style={{ padding:'0 var(--s6) var(--s3)', display:'flex', gap:'var(--s2)', flexWrap:'wrap' }}>
                {(QUICK_REPLIES[brief.segmentId] || QUICK_REPLIES.default).map((q, i) => (
                  <button key={i}
                    onClick={() => sendChat(q)}
                    disabled={chatWaiting}
                    style={{ background:'var(--off-white)', border:'1px solid var(--border)', borderRadius:99, padding:'4px 12px', fontSize:'0.75rem', color:'var(--slate)', cursor: chatWaiting ? 'not-allowed' : 'pointer', opacity: chatWaiting ? 0.5 : 1 }}>
                    {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{ padding:'var(--s3) var(--s6) var(--s5)', display:'flex', gap:'var(--s3)' }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Ask about this proposal..."
                  style={{ flex:1, padding:'var(--s3) var(--s4)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', fontSize:'0.875rem', color:'var(--slate)', outline:'none' }}
                />
                <button className="btn btn--primary btn--sm" onClick={() => sendChat()} disabled={!chatInput.trim() || chatWaiting}>
                  {chatWaiting ? '…' : 'Send'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Competitor Compare CTA ────────────────────────── */}
        <div style={{
          background:'linear-gradient(135deg, #0D1F2D 0%, #0F2A38 100%)',
          border:'1px solid rgba(0,123,127,0.25)',
          borderRadius:'var(--r-xl)',
          padding:'var(--s6) var(--s8)',
          marginBottom:'var(--s10)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexWrap:'wrap', gap:'var(--s5)',
        }}>
          <div>
            <div style={{ fontSize:'0.65rem', fontWeight:700, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
              Competitor Check
            </div>
            <h3 style={{ color:'white', margin:'0 0 6px', fontSize:'1.125rem' }}>
              How does the {brief.kva} stack up?
            </h3>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.84rem', lineHeight:1.6, margin:0, maxWidth:480 }}>
              See a full spec-by-spec comparison against Cummins, Mahindra Powerol, and Greaves Cotton — with sales talking points included.
            </p>
          </div>
          <button
            className="btn btn--lg"
            style={{ background:'var(--teal)', color:'white', borderColor:'var(--teal)', flexShrink:0 }}
            onClick={() => navigate('/compare')}
          >
            Compare with Competitor →
          </button>
        </div>

      </div>
    </div>
  )
}
