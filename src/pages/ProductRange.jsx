import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRangeById } from '../data/koel'
import { auth, pricing } from '../lib/storage'
import Badge from '../components/Badge'

const fmt = (n, unit = '') => n != null ? `${n}${unit}` : '—'
const fmtMoney = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'

export default function ProductRange() {
  const { rangeId } = useParams()
  const navigate    = useNavigate()
  const range       = getRangeById(rangeId)
  const session     = auth.getSession()

  // TCO state
  const [selectedModel, setSelectedModel] = useState(0)
  const [hoursPerDay,   setHoursPerDay]   = useState(8)
  const [loadPct,       setLoadPct]       = useState(75)
  const [dieselPrice,   setDieselPrice]   = useState(92)
  const [years,         setYears]         = useState(5)
  const [prices,        setPrices]        = useState(pricing.getAll())

  useEffect(() => { if (range) setSelectedModel(0) }, [rangeId])

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

  // TCO Calculation
  const annualHours        = hoursPerDay * 365
  const fuelLphr           = (model.bsfcAt75 || 0.27) * model.kw * (loadPct / 100)
  const annualFuelL        = fuelLphr * annualHours
  const oilChangesPerYear  = annualHours / (model.lubeOilChangePeriod || 500)
  const annualOilCost      = oilChangesPerYear * (model.lubeOilSump || 10) * 350
  const annualAdblueCost   = model.adblueCapacity ? annualFuelL * 0.035 * 45 : 0

  const yearlyFuelCosts = Array.from({ length: years }, (_, i) =>
    annualFuelL * dieselPrice * Math.pow(1.05, i)
  )
  const totalFuelCost  = yearlyFuelCosts.reduce((a, b) => a + b, 0)
  const totalOilCost   = annualOilCost * years
  const totalAdblue    = annualAdblueCost * years
  const purchasePrice  = prices[model.model]?.exWorks || 0
  const totalTCO       = purchasePrice + totalFuelCost + totalOilCost + totalAdblue

  const handlePriceEdit = (modelName, val) => {
    pricing.set(modelName, parseFloat(val) || 0)
    setPrices(pricing.getAll())
  }

  return (
    <div className="page-content">
      <div className="container">

        {/* ── Range Hero ──────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--s8)', alignItems: 'flex-start', marginBottom: 'var(--s10)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <button className="btn btn--ghost btn--sm" style={{ marginBottom: 'var(--s4)' }} onClick={() => navigate('/')}>
              ← All Ranges
            </button>
            <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap', marginBottom: 'var(--s3)' }}>
              <Badge type="teal">CPCB {range.cpcb}</Badge>
              {range.series && <Badge type="gray">{range.series}</Badge>}
              {range.isHot && <Badge type="hot">🔥 Hot Seller</Badge>}
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
                onClick={() => setSelectedModel(i)}
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
              </tr>
            </thead>
            <tbody>
              {/* Genset */}
              <tr className="spec-table__section-header"><td colSpan={3}>Genset</td></tr>
              {[
                ['Model', model.model, ''],
                ['Rated Output', `${model.kva} kVA / ${model.kw} kW`, ''],
                ['Power Factor', '0.8', 'lagging'],
                ['Frequency', '50', 'Hz'],
                ['Voltage', range.voltage, ''],
                ['Governing Class', range.governingClass, ''],
                ['Noise Level', model.noiseLevel, 'dBA'],
                ['Fuel Tank', fmt(model.fuelTank), 'L'],
                ['Dimensions (L×W×H)', `${model.dimensions.length} × ${model.dimensions.width} × ${model.dimensions.height}`, 'mm'],
                ['Weight (Dry)', fmt(model.weightDry), 'kg'],
                ['Weight (Wet)', fmt(model.weightWet), 'kg'],
                ['Battery Starting', range.batteryVoltage || '12V DC', ''],
              ].map(([param, value, unit]) => (
                <tr key={param}>
                  <td className="spec-table__param">{param}</td>
                  <td className="spec-table__value">{value}</td>
                  <td className="spec-table__value" style={{ color: 'var(--gray-light)', fontSize: '0.75rem' }}>{unit}</td>
                </tr>
              ))}

              {/* Engine */}
              <tr className="spec-table__section-header"><td colSpan={3}>Engine</td></tr>
              {[
                ['Engine Model', model.engineModel, ''],
                ['Engine Make', model.engineMake, ''],
                ['Cylinders', fmt(model.cylinders), ''],
                ['Displacement', fmt(model.displacement), 'L'],
                ['Bore × Stroke', `${model.bore} × ${model.stroke}`, 'mm'],
                ['Aspiration', model.aspiration, ''],
                ['Rated Speed', '1500', 'RPM'],
                ['Cooling', model.cooling || 'Liquid', ''],
                ['Rated Output (Engine)', `${model.ratedOutputKw} kW / ${model.ratedOutputHp} HP`, ''],
                ['Lube Oil Change', fmt(model.lubeOilChangePeriod), 'hrs'],
                ['Lube Oil Sump', fmt(model.lubeOilSump), 'L'],
                ['Coolant Capacity', fmt(model.coolantCapacity), 'L'],
                ['AdBlue / DEF Tank', model.adblueCapacity ? fmt(model.adblueCapacity) : 'N/A (EGR)', 'L'],
              ].map(([param, value, unit]) => (
                <tr key={param}>
                  <td className="spec-table__param">{param}</td>
                  <td className="spec-table__value">{value}</td>
                  <td className="spec-table__value" style={{ color: 'var(--gray-light)', fontSize: '0.75rem' }}>{unit}</td>
                </tr>
              ))}

              {/* Alternator */}
              <tr className="spec-table__section-header"><td colSpan={3}>Alternator</td></tr>
              {[
                ['Insulation Class', model.insulationClass, ''],
                ['Efficiency @ 100% load, 0.8 PF', fmt(model.alternatorEfficiency), '%'],
                ['Max Voltage Dip at Full Load', model.maxVoltageDip, ''],
                ['Max Time to Rated Voltage', '< 2 sec', ''],
              ].map(([param, value, unit]) => (
                <tr key={param}>
                  <td className="spec-table__param">{param}</td>
                  <td className="spec-table__value">{value}</td>
                  <td className="spec-table__value" style={{ color: 'var(--gray-light)', fontSize: '0.75rem' }}>{unit}</td>
                </tr>
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
