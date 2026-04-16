import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRangeById } from '../data/koel'
import { auth, pricing } from '../lib/storage'
import Badge from '../components/Badge'

const fmt = (n, unit = '') => n != null ? `${n}${unit}` : '—'
const fmtMoney = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

// ── Marketing insights, keyed by param label ──────────────────────────────
// 'small' tier: ≤160 kVA   |   'large' tier: >160 kVA
const INSIGHTS = {
  small: {
    'Noise Level': {
      headline: 'Declared at 100% load — not the industry-standard 75%',
      body: "Most manufacturers test noise at 75% load — a lighter, quieter operating point that flatters the number. KOEL's <75 dBA is measured at full rated load. The number on our spec sheet is the worst case, not the best case. What you read is what you get on site.",
      callout: '⚠ Ask Cummins and Mahindra for their 100% load noise figure. It will be higher.',
    },
    'Engine Make': {
      headline: 'Engine and genset from the same manufacturer — one team, one warranty',
      body: 'Kirloskar makes both the engine inside and the genset around it. When something needs attention, there is no OEM vs. genset-OEM blame game. One call. One escalation path. This matters most at 2 AM during a critical outage.',
      callout: '↗ Cummins, Greaves, and Mahindra use third-party alternators. Kirloskar uses its own.',
    },
    'Displacement': {
      headline: '4.76 litres for 82.5 kVA — the engine is never working hard',
      body: 'Higher displacement at the same rated output means lower specific load per cylinder. This engine runs well within its design capacity — lower combustion temperatures, less friction wear per hour, and longer intervals between overhauls. Cheap to maintain, longer to need major work.',
      callout: 'Cummins QSB4.5 at equivalent kVA: 4.5L — 5.7% less displacement for the same output.',
    },
    'Fuel Tank': {
      headline: '200L on-board — approximately 15 hours without refuelling',
      body: 'At 75% load this tank runs for ~15 continuous hours before needing a top-up. For a commercial site averaging 6–8 hours of daily backup use, that is two full days without a fuel visit. Fewer site interventions, lower operational overhead.',
      callout: 'Cummins equivalent: verify from GA drawing. Mahindra: often not declared on spec sheet.',
    },
    'AdBlue / DEF Tank': {
      headline: '25L AdBlue tank — CPCB IV+ with minimal maintenance burden',
      body: 'SCR-based compliance eliminates PM2.5 and NOx at source — the right way to meet the standard. At typical consumption rates, the 25L tank lasts over a week of daily backup use before refilling. No daily interventions needed.',
      callout: 'Cummins 82.5 kVA: 20L DEF tank. KOEL carries 25% more, reducing refill frequency.',
    },
    'Lube Oil Change': {
      headline: 'One oil change per year for typical backup use',
      body: 'At 6 hours of backup per day, 500 hours is roughly 83 days of runtime — approximately one service per year. Predictable, schedulable, budgetable. No surprise maintenance events disrupting operations.',
      callout: 'This interval also covers the first-service oil change at 50 hours — included in warranty scope.',
    },
    'Efficiency @ 100% load, 0.8 PF': {
      headline: '91.1% — we publish this because it is worth publishing',
      body: "At 91.1% efficiency, 91.1% of the engine's mechanical output actually reaches your load as usable electricity. Over thousands of hours, this directly reduces fuel consumption for the same useful output. Most competitors do not declare this figure — ask why.",
      callout: '⚠ Cummins, Mahindra, Greaves do not declare alternator efficiency in their CPCB IV+ spec sheets.',
    },
    'Max Voltage Dip at Full Load': {
      headline: 'Motor loads start cleanly — no nuisance trips',
      body: "When a large motor starts, it draws 5–7x its running current for a fraction of a second. The genset's voltage dips during this event. If the dip exceeds tolerance, other equipment — UPS systems, medical devices, sensitive drives — can trip or fault. <20% dip ensures clean motor starting across the entire load board.",
      callout: 'Critical for hospitals, cold chains, and any site with large compressors or pump motors.',
    },
  },
  large: {
    'Noise Level': {
      headline: '<75 dBA at full load — not a lighter test point',
      body: 'At high kVA ratings, generating less than 75 dBA is a genuine engineering achievement. KOEL declares this at 100% load. Industrial sites, hospitals, and data centres operating these units at high utilisation can plan acoustic isolation accurately — no surprises when the load comes on.',
      callout: '⚠ Confirm load test point with any competitor quoting <75 dBA at this rating.',
    },
    'Engine Make': {
      headline: 'Kirloskar engine in a Kirloskar genset — complete OEM integration',
      body: "At high kVA tiers, engine and genset integration is critical. Thermal management, vibration isolation, and controls calibration are all co-designed. Sourcing an engine from one OEM and wrapping it in another manufacturer's canopy introduces integration risk. KOEL carries none of that.",
      callout: 'Cummins at this range uses externally sourced engines and integrates them. Verify genset-level warranty vs engine warranty.',
    },
    'Displacement': {
      headline: 'High displacement — the engine is operating well within capacity',
      body: 'Higher displacement at the same rated output means lower specific load per cylinder. Thermal stress per cylinder is low, bearing loads are distributed across more cylinders, and overhaul life is correspondingly longer. For mission-critical installations with high annual operating hours, this is the right architecture.',
      callout: 'Competitor equivalents at similar kVA ratings carry less displacement — higher load per cylinder.',
    },
    'Fuel Tank': {
      headline: 'Large on-board tank — extended runtime without refuelling',
      body: 'For a data centre or hospital running this genset as primary backup, the large on-board tank covers most extended outage scenarios. On large sites where access to the genset room requires permits or escorts, fewer fuel visits is a genuine operational advantage.',
      callout: 'At this rating, fuel consumption at 75% load is substantial. Verify competitor tank sizes from GA drawings.',
    },
    'AdBlue / DEF Tank': {
      headline: 'Large AdBlue tank — CPCB IV+ with extended runtime, no mid-operation refilling',
      body: 'Two independent DEF tanks ensure SCR system redundancy and extended runtime without refilling. For sites running extended backup hours — data centres, hospitals, grid-support installations — this means no mid-operation AdBlue intervention in any realistic outage scenario.',
      callout: 'Cummins at equivalent kVA: single smaller tank. KOEL carries significantly more, reducing refill frequency.',
    },
    'Lube Oil Change': {
      headline: '500-hour oil change interval — exceptional for the class',
      body: 'Maintaining 500-hour oil change intervals on a large engine requires careful calibration and oil system design. KOEL achieves this consistently across the high-kVA range. For a site running 1000+ hours annually, this is two planned outages per year — predictable, schedulable, minimally disruptive.',
      callout: 'Compare full service scope and AMC package costs vs competitors before evaluating interval differences.',
    },
    'Efficiency @ 100% load, 0.8 PF': {
      headline: 'At high kVA, every percentage point of efficiency is kilowatts and rupees',
      body: "At high rated outputs, 1% alternator efficiency difference equals significant useful output per hour. Over 1000 annual operating hours, the efficiency advantage translates directly to fuel savings worth lakhs per year. KOEL declares this figure. Most competitors don't.",
      callout: "KOEL's alternator efficiency at this range is among the highest declared figures in the class.",
    },
    'Max Voltage Dip at Full Load': {
      headline: '<20% voltage dip — UPS handover and motor starts remain stable',
      body: 'At high kVA ratings, a genset is likely handling large HVAC compressors, pumping stations, or UPS handover loads. Voltage dip during these transient events determines whether the load switches cleanly or trips. <20% ensures industrial motor starters, ATC controllers, and sensitive downstream equipment all operate within their tolerance bands.',
      callout: 'Critical for data centres (UPS handover), hospitals (surgical equipment), and factories (large drive loads).',
    },
  },
}

export default function DemoProductRange() {
  const { rangeId: paramRangeId } = useParams()
  const rangeId  = paramRangeId || '82-160'
  const navigate = useNavigate()
  const range    = getRangeById(rangeId)
  const session  = auth.getSession()

  const [selectedModel, setSelectedModel] = useState(0)
  const [hoursPerDay,   setHoursPerDay]   = useState(8)
  const [loadPct,       setLoadPct]       = useState(75)
  const [dieselPrice,   setDieselPrice]   = useState(92)
  const [years,         setYears]         = useState(5)
  const [prices,        setPrices]        = useState(pricing.getAll())
  const [expandedParam, setExpandedParam] = useState(null)

  useEffect(() => { if (range) { setSelectedModel(0); setExpandedParam(null) } }, [rangeId])

  if (!range) return (
    <div className="page-content">
      <div className="container">
        <div className="empty-state">
          <div className="empty-state__icon">⚠️</div>
          <h3>Range not found</h3>
          <button className="btn btn--primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    </div>
  )

  const model = range.models[selectedModel]

  // Pick insight tier based on kva
  const insightTier = model.kva <= 160 ? 'small' : 'large'
  const insights    = INSIGHTS[insightTier]

  // TCO Calculation
  const annualHours       = hoursPerDay * 365
  const fuelLphr          = (model.bsfcAt75 || 0.27) * model.kw * (loadPct / 100)
  const annualFuelL       = fuelLphr * annualHours
  const oilChangesPerYear = annualHours / (model.lubeOilChangePeriod || 500)
  const annualOilCost     = oilChangesPerYear * (model.lubeOilSump || 10) * 350
  const annualAdblueCost  = model.adblueCapacity ? annualFuelL * 0.035 * 45 : 0

  const yearlyFuelCosts = Array.from({ length: years }, (_, i) =>
    annualFuelL * dieselPrice * Math.pow(1.05, i)
  )
  const totalFuelCost = yearlyFuelCosts.reduce((a, b) => a + b, 0)
  const totalOilCost  = annualOilCost * years
  const totalAdblue   = annualAdblueCost * years
  const purchasePrice = prices[model.model]?.exWorks || 0
  const totalTCO      = purchasePrice + totalFuelCost + totalOilCost + totalAdblue

  const handlePriceEdit = (modelName, val) => {
    pricing.set(modelName, parseFloat(val) || 0)
    setPrices(pricing.getAll())
  }

  const toggleParam = (param) => {
    setExpandedParam(prev => prev === param ? null : param)
  }

  // Renders a spec row + optional expandable insight sub-row
  const SpecRow = ({ param, value, unit }) => {
    const insight   = insights[param] || null
    const isOpen    = expandedParam === param
    return (
      <>
        <tr>
          <td className="spec-table__param">{param}</td>
          <td className="spec-table__value">{value}</td>
          <td className="spec-table__value" style={{ color: 'var(--gray-light)', fontSize: '0.75rem' }}>{unit}</td>
          <td style={{ textAlign: 'center', width: 90, padding: '0 var(--s3)' }}>
            {insight ? (
              <button
                onClick={() => toggleParam(param)}
                style={{
                  background: isOpen ? 'var(--teal)' : 'transparent',
                  border: `1px solid ${isOpen ? 'var(--teal)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-md)',
                  color: isOpen ? 'white' : 'var(--teal)',
                  cursor: 'pointer',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '3px 8px',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {isOpen ? '▲ Less' : '↓ Why?'}
              </button>
            ) : null}
          </td>
        </tr>
        {isOpen && insight && (
          <tr>
            <td colSpan={4} style={{ padding: 0, borderBottom: '2px solid var(--teal)' }}>
              <div style={{
                background: 'var(--teal-light)',
                borderLeft: '3px solid var(--teal)',
                padding: 'var(--s5) var(--s8)',
              }}>
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--teal-dark)',
                  marginBottom: 'var(--s2)',
                  lineHeight: 1.4,
                }}>
                  {insight.headline}
                </div>
                <div style={{
                  fontSize: '0.825rem',
                  color: 'var(--gray)',
                  lineHeight: 1.7,
                  marginBottom: insight.callout ? 'var(--s3)' : 0,
                }}>
                  {insight.body}
                </div>
                {insight.callout && (
                  <div style={{
                    background: 'white',
                    border: '1px solid rgba(0,123,127,0.35)',
                    borderLeft: '3px solid var(--teal)',
                    borderRadius: 'var(--r-md)',
                    padding: 'var(--s2) var(--s4)',
                    fontSize: '0.78rem',
                    color: 'var(--gray)',
                    lineHeight: 1.55,
                    fontStyle: 'italic',
                  }}>
                    {insight.callout}
                  </div>
                )}
              </div>
            </td>
          </tr>
        )}
      </>
    )
  }

  return (
    <div className="page-content">
      <div className="container">

        {/* ── Demo mode banner ───────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(90deg, var(--teal-light) 0%, rgba(0,123,127,0.08) 100%)',
          border: '1px solid rgba(0,123,127,0.3)',
          borderRadius: 'var(--r-md)',
          padding: 'var(--s2) var(--s5)',
          marginBottom: 'var(--s6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--s3)',
          fontSize: '0.8rem',
          color: 'var(--teal-dark)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            <strong>Sales Intelligence View</strong> — Click <strong>↓ Why?</strong> on any highlighted row to reveal the customer-facing talking point.
          </span>
        </div>

        {/* ── Range Hero ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--s8)', alignItems: 'flex-start', marginBottom: 'var(--s10)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <button className="btn btn--ghost btn--sm" style={{ marginBottom: 'var(--s4)' }} onClick={() => navigate('/')}>
              ← All Ranges
            </button>
            <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap', marginBottom: 'var(--s3)' }}>
              <Badge type="teal">CPCB {range.cpcb}</Badge>
              {range.series && <Badge type="gray">{range.series}</Badge>}
              {range.isHot && <Badge type="hot">Hot Seller</Badge>}
            </div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--s3)' }}>{range.label} kVA</h1>
            <p style={{ color: 'var(--gray)', marginBottom: 'var(--s5)' }}>{range.description}</p>
            <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
              <a href={range.datasheet} target="_blank" rel="noreferrer" className="source-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                View Datasheet
              </a>
              <button className="btn btn--primary btn--sm" onClick={() => navigate('/compare')}>
                Compare with Competitor →
              </button>
            </div>
          </div>
          <div style={{ background: 'var(--off-white)', borderRadius: 'var(--r-xl)', padding: 'var(--s4)', width: 340, flexShrink: 0 }}>
            <img src={range.image} alt={range.label} style={{ width: '100%', maxHeight: 240, objectFit: 'contain' }} />
          </div>
        </div>

        {/* ── Key Features ────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap', marginBottom: 'var(--s8)' }}>
          {range.keyFeatures.map(f => (
            <div key={f} style={{ background: 'var(--teal-light)', borderRadius: 'var(--r-md)', padding: 'var(--s2) var(--s4)', fontSize: '0.825rem', color: 'var(--teal-dark)', fontWeight: 500 }}>
              ✓ {f}
            </div>
          ))}
        </div>

        {/* ── Model Selector ───────────────────────────────────── */}
        <div style={{ marginBottom: 'var(--s6)' }}>
          <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap' }}>
            {range.models.map((m, i) => (
              <button key={m.model}
                className={`btn ${selectedModel === i ? 'btn--primary' : 'btn--ghost'} btn--sm`}
                onClick={() => { setSelectedModel(i); setExpandedParam(null) }}
              >
                {m.kva} kVA
              </button>
            ))}
          </div>
        </div>

        {/* ── Spec Table ───────────────────────────────────────── */}
        <div style={{ overflowX: 'auto', marginBottom: 'var(--s8)' }}>
          <table className="spec-table">
            <thead>
              <tr>
                <th style={{ width: 220 }}>Parameter</th>
                <th style={{ textAlign: 'right' }}>Value</th>
                <th style={{ textAlign: 'right' }}>Unit</th>
                <th style={{ width: 90, textAlign: 'center', color: 'var(--teal)', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Why it matters
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Genset */}
              <tr className="spec-table__section-header"><td colSpan={4}>Genset</td></tr>
              {[
                ['Model',              model.model,                                                                       ''],
                ['Rated Output',       `${model.kva} kVA / ${model.kw} kW`,                                              ''],
                ['Power Factor',       '0.8',                                                                             'lagging'],
                ['Frequency',          '50',                                                                              'Hz'],
                ['Voltage',            range.voltage,                                                                     ''],
                ['Governing Class',    range.governingClass,                                                              ''],
                ['Noise Level',        model.noiseLevel,                                                                  'dBA'],
                ['Fuel Tank',          fmt(model.fuelTank),                                                               'L'],
                ['Dimensions (L×W×H)', `${model.dimensions.length} × ${model.dimensions.width} × ${model.dimensions.height}`, 'mm'],
                ['Weight (Dry)',        fmt(model.weightDry),                                                             'kg'],
                ['Weight (Wet)',        fmt(model.weightWet),                                                             'kg'],
                ['Battery Starting',   range.batteryVoltage || '12V DC',                                                 ''],
              ].map(([param, value, unit]) => (
                <SpecRow key={param} param={param} value={value} unit={unit} />
              ))}

              {/* Engine */}
              <tr className="spec-table__section-header"><td colSpan={4}>Engine</td></tr>
              {[
                ['Engine Model',        model.engineModel,                                                                     ''],
                ['Engine Make',         model.engineMake,                                                                     ''],
                ['Cylinders',           fmt(model.cylinders),                                                                 ''],
                ['Displacement',        fmt(model.displacement),                                                              'L'],
                ['Bore × Stroke',       `${model.bore} × ${model.stroke}`,                                                    'mm'],
                ['Aspiration',          model.aspiration,                                                                     ''],
                ['Rated Speed',         '1500',                                                                                'RPM'],
                ['Cooling',             model.cooling || 'Liquid',                                                            ''],
                ['Rated Output (Engine)', `${model.ratedOutputKw} kW / ${model.ratedOutputHp} HP`,                           ''],
                ['Lube Oil Change',      fmt(model.lubeOilChangePeriod),                                                      'hrs'],
                ['Lube Oil Sump',        fmt(model.lubeOilSump),                                                              'L'],
                ['Coolant Capacity',     fmt(model.coolantCapacity),                                                          'L'],
                ['AdBlue / DEF Tank',    model.adblueCapacity ? fmt(model.adblueCapacity) : 'N/A (EGR)',                      'L'],
              ].map(([param, value, unit]) => (
                <SpecRow key={param} param={param} value={value} unit={unit} />
              ))}

              {/* Alternator */}
              <tr className="spec-table__section-header"><td colSpan={4}>Alternator</td></tr>
              {[
                ['Insulation Class',                     model.insulationClass,              ''],
                ['Efficiency @ 100% load, 0.8 PF',      fmt(model.alternatorEfficiency),    '%'],
                ['Max Voltage Dip at Full Load',          model.maxVoltageDip,               ''],
                ['Max Time to Rated Voltage',             '< 2 sec',                         ''],
              ].map(([param, value, unit]) => (
                <SpecRow key={param} param={param} value={value} unit={unit} />
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <div className="card" style={{ padding: 'var(--s6)', marginBottom: 'var(--s8)' }}>
          <h3 style={{ marginBottom: 'var(--s4)', display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Ex-Works Pricing
          </h3>
          {session ? (
            <div style={{ display: 'flex', gap: 'var(--s4)', flexWrap: 'wrap' }}>
              {range.models.map(m => (
                <div key={m.model} style={{ minWidth: 180 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 'var(--s1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {m.kva} kVA
                  </label>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--teal-dark)' }}>
                    {fmtMoney(prices[m.model]?.exWorks)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
              <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>Login to view and update pricing.</p>
              <a href="/login" className="btn btn--outline btn--sm">Login</a>
            </div>
          )}
        </div>

        {/* ── TCO Calculator ───────────────────────────────────── */}
        <div className="tco-card">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            5-Year Total Cost of Ownership: {model.model}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginBottom: 'var(--s6)' }}>
            Fuel costs include 5% annual inflation. BSFC estimates based on industry standard for turbocharged diesel gensets. Adjust inputs for your scenario.
          </p>

          <div className="tco-inputs">
            <div className="tco-field">
              <label>Backup Hours per Day: <span style={{ color: 'var(--teal)' }}>{hoursPerDay} hrs</span></label>
              <input type="range" min={1} max={24} value={hoursPerDay} onChange={e => setHoursPerDay(+e.target.value)} />
            </div>
            <div className="tco-field">
              <label>Average Load: <span style={{ color: 'var(--teal)' }}>{loadPct}%</span></label>
              <input type="range" min={50} max={100} step={5} value={loadPct} onChange={e => setLoadPct(+e.target.value)} />
            </div>
            <div className="tco-field">
              <label>Diesel Price (₹/L)</label>
              <input type="number" value={dieselPrice} min={70} max={150} onChange={e => setDieselPrice(+e.target.value)} />
            </div>
            <div className="tco-field">
              <label>Period</label>
              <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 'var(--s2)' }}>
                {[1, 3, 5].map(y => (
                  <button key={y} className={`btn btn--sm ${years === y ? 'btn--primary' : 'btn--ghost'}`} onClick={() => setYears(y)}>
                    {y} yr
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="tco-results">
            <div className="tco-result">
              <div className="tco-result__label">Annual Fuel Consumption</div>
              <div className="tco-result__value">{Math.round(annualFuelL).toLocaleString('en-IN')} L</div>
            </div>
            <div className="tco-result">
              <div className="tco-result__label">Annual Fuel Cost (Yr 1)</div>
              <div className="tco-result__value">₹{Math.round(annualFuelL * dieselPrice).toLocaleString('en-IN')}</div>
            </div>
            <div className="tco-result">
              <div className="tco-result__label">{years}-Year Fuel Cost</div>
              <div className="tco-result__value">₹{Math.round(totalFuelCost).toLocaleString('en-IN')}</div>
            </div>
            <div className="tco-result">
              <div className="tco-result__label">{years}-Year Oil Changes</div>
              <div className="tco-result__value">₹{Math.round(totalOilCost).toLocaleString('en-IN')}</div>
            </div>
            {model.adblueCapacity && (
              <div className="tco-result">
                <div className="tco-result__label">{years}-Year AdBlue Cost</div>
                <div className="tco-result__value">₹{Math.round(totalAdblue).toLocaleString('en-IN')}</div>
              </div>
            )}
            <div className="tco-result tco-result--highlight">
              <div className="tco-result__label">{years}-Year TCO {!purchasePrice && '(excl. purchase price)'}</div>
              <div className="tco-result__value">₹{Math.round(totalTCO).toLocaleString('en-IN')}</div>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: 'var(--s4)' }}>
            * Assumptions: BSFC {model.bsfcAt75} L/kWh at {loadPct}% load · Lube oil ₹350/L · AdBlue ₹45/L · 5% annual fuel inflation · Oil change every {model.lubeOilChangePeriod} hrs
          </p>
        </div>

        {/* ── Compare CTA ──────────────────────────────────────── */}
        <div style={{
          marginTop: 'var(--s10)',
          background: 'linear-gradient(135deg, var(--slate) 0%, #0F2A38 100%)',
          borderRadius: 'var(--r-xl)',
          padding: 'var(--s10) var(--s10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--s6)',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: 'var(--s2)' }}>
              Competitor Check
            </div>
            <h3 style={{ color: 'white', margin: '0 0 var(--s2)', fontSize: '1.4rem' }}>
              How does the {model.kva} kVA stack up?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.9rem', maxWidth: 420 }}>
              See a full spec-by-spec comparison against Cummins, Mahindra Powerol, and Greaves Cotton — with sales talking points included.
            </p>
          </div>
          <button
            className="btn btn--lg"
            style={{ background: 'var(--teal)', color: 'white', border: 'none', flexShrink: 0, fontSize: '1rem' }}
            onClick={() => navigate(`/compare?koel=${model.model}`)}
          >
            Compare with Competitor →
          </button>
        </div>

      </div>
    </div>
  )
}
