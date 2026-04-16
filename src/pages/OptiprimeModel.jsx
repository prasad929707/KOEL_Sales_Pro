import { useParams, useNavigate } from 'react-router-dom'
import { OPTIPRIME_MODELS } from '../data/optiprime'
import Badge from '../components/Badge'

const fmt = (n, unit = '') => n != null ? `${n}${unit}` : '—'

const SPEC_ROWS = [
  { section: 'Genset (Combined Output)' },
  { label: 'Prime Rating',               unit: 'kVA',  fn: m => m.kva },
  { label: 'Prime Rating',               unit: 'kW',   fn: m => m.kw },
  { label: 'Per Pack Rating',            unit: 'kVA',  fn: m => m.kvaPerPack },
  { label: 'Configuration',              unit: '',     fn: m => m.configuration },
  { label: 'Fuel Tank Capacity',         unit: 'L',    fn: m => m.fuelTank },
  { label: 'Weight (Dry)',               unit: 'kg',   fn: m => m.weightDry },
  { label: 'Weight (Wet)',               unit: 'kg',   fn: m => m.weightWet },
  { label: 'Overall Length',             unit: 'mm',   fn: m => m.dimensions.length },
  { label: 'Overall Width',              unit: 'mm',   fn: m => m.dimensions.width },
  { label: 'Height (without silencer)',  unit: 'mm',   fn: m => m.dimensions.heightNoSil },
  { label: 'Height (with silencer)',     unit: 'mm',   fn: m => m.dimensions.heightWithSil },
  { label: 'Noise Level',               unit: '',     fn: m => m.noiseLevel },
  { label: 'Sync Controller',           unit: '',     fn: m => m.syncController },
  { section: 'Fuel Consumption (L/hr, both packs)' },
  { label: 'At 100% Load',  unit: 'L/hr', fn: m => m.fuelConsumption.at100 },
  { label: 'At 75% Load',   unit: 'L/hr', fn: m => m.fuelConsumption.at75  },
  { label: 'At 50% Load',   unit: 'L/hr', fn: m => m.fuelConsumption.at50  },
  { label: 'At 25% Load',   unit: 'L/hr', fn: m => m.fuelConsumption.at25  },
  { section: 'Engine (per pack)' },
  { label: 'Engine Model',              unit: '',     fn: m => m.engineModel },
  { label: 'No. of Cylinders',          unit: '',     fn: m => m.cylinders },
  { label: 'Displacement',              unit: 'L',    fn: m => m.displacement },
  { label: 'Lube Oil Change Period',    unit: 'hrs',  fn: m => m.lubeOilChangePeriod },
  { label: 'Lube Oil Sump (total)',     unit: 'L',    fn: m => m.lubeOilSump },
  { label: 'Coolant Capacity (total)', unit: 'L',    fn: m => m.coolantCapacity },
  { label: 'AdBlue / DEF (total)',     unit: 'L',    fn: m => m.adblueCapacity },
  { label: 'Block Loading Capacity',   unit: '%',    fn: m => m.blockLoadingCapacity },
  { section: 'Alternator' },
  { label: 'Insulation Class',          unit: '',     fn: m => m.insulationClass },
  { label: 'Efficiency (rated load)',   unit: '%',    fn: m => m.alternatorEfficiency },
  { label: 'Max Voltage Dip',          unit: '',     fn: m => m.maxVoltageDip },
]

export default function OptiprimeModel() {
  const { modelId } = useParams()
  const navigate    = useNavigate()
  const model       = OPTIPRIME_MODELS.find(m => m.id === modelId)
  const modelIndex  = OPTIPRIME_MODELS.findIndex(m => m.id === modelId)

  if (!model) return (
    <div className="page-content">
      <div className="container">
        <div className="empty-state">
          <div className="empty-state__icon">⚠️</div>
          <h3>Model not found</h3>
          <button className="btn btn--primary" onClick={() => navigate('/optiprime')}>Back to Optiprime</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-content">
      <div className="container">

        {/* ── Breadcrumb / back ────────────────────────────────── */}
        <button
          className="btn btn--ghost btn--sm"
          style={{ marginBottom: 'var(--s4)' }}
          onClick={() => navigate('/optiprime')}
        >
          ← Optiprime Range
        </button>

        {/* ── Range Hero ──────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--s8)', alignItems: 'flex-start', marginBottom: 'var(--s8)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap', marginBottom: 'var(--s3)' }}>
              <Badge type="teal">CPCB IV+</Badge>
              <Badge type="gray">Optiprime HHP</Badge>
              <Badge type="gray">Twin-Pack</Badge>
            </div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--s2)' }}>{model.model}</h1>
            <p style={{ color: 'var(--gray)', marginBottom: 'var(--s2)' }}>
              {model.kvaPerPack} kVA × 2 packs · {model.configuration} · {model.engineModel}
            </p>
            <p style={{ color: 'var(--gray)', marginBottom: 'var(--s5)', fontSize: '0.88rem' }}>
              Kirloskar Powergen · CPCB IV+ Compliant
            </p>
            <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
              <a href={model.datasheet} target="_blank" rel="noreferrer" className="source-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                View Brochure
              </a>
              <button className="btn btn--outline btn--sm" onClick={() => navigate('/optiprime')}>
                All Optiprime Models
              </button>
            </div>
          </div>

          {/* Quick-stats card */}
          <div style={{
            background: 'var(--off-white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: 'var(--s5)',
            width: 320,
            flexShrink: 0,
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 'var(--s4)',
            }}>
              {[
                { label: 'Combined Output', val: `${model.kva} kVA` },
                { label: 'Per Pack',        val: `${model.kvaPerPack} kVA` },
                { label: 'Alt. Efficiency', val: `${model.alternatorEfficiency}%` },
                { label: 'Fuel @ 75%',      val: `${model.fuelConsumption.at75} L/hr` },
                { label: 'Block Load',      val: `${model.blockLoadingCapacity}%` },
                { label: 'Oil Interval',    val: `${model.lubeOilChangePeriod} hrs` },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--teal-dark)' }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Key Features strip ───────────────────────────────── */}
        <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap', marginBottom: 'var(--s8)' }}>
          {[
            'Twin-pack parallel system',
            '40% lower CO₂',
            '50% lower NOₓ',
            'Intelligent PMS',
            'Single enclosure',
            'IoT monitoring ready',
          ].map(f => (
            <div key={f} style={{
              background: 'var(--teal-light)',
              borderRadius: 'var(--r-md)',
              padding: 'var(--s2) var(--s4)',
              fontSize: '0.825rem',
              color: 'var(--teal-dark)',
              fontWeight: 500,
            }}>
              ✓ {f}
            </div>
          ))}
        </div>

        {/* ── Model Selector (other Optiprime models) ──────────── */}
        <div style={{ marginBottom: 'var(--s6)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--gray)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--s3)' }}>
            Other Optiprime Models
          </div>
          <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap' }}>
            {OPTIPRIME_MODELS.map((m, i) => (
              <button
                key={m.id}
                className={`btn ${i === modelIndex ? 'btn--primary' : 'btn--ghost'} btn--sm`}
                onClick={() => navigate(`/optiprime/${m.id}`)}
              >
                {m.kva} kVA
              </button>
            ))}
          </div>
        </div>

        {/* ── Spec Table ───────────────────────────────────────── */}
        <div style={{ overflowX: 'auto', marginBottom: 'var(--s8)' }}>
          <table className="spec-table">
            <tbody>
              {SPEC_ROWS.map((row, i) => {
                if (row.section) return (
                  <tr key={`sec-${i}`} className="spec-table__section-header">
                    <td colSpan={2}>{row.section}</td>
                  </tr>
                )
                const val = row.fn(model)
                return (
                  <tr key={row.label}>
                    <td className="spec-table__param">
                      {row.label}
                      {row.unit && <span className="spec-table__unit">({row.unit})</span>}
                    </td>
                    <td className="spec-table__value">
                      {fmt(val)}{val != null && row.unit ? ` ${row.unit}` : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Note ─────────────────────────────────────────────── */}
        <div style={{
          marginBottom: 'var(--s8)',
          padding: 'var(--s4) var(--s5)',
          background: 'var(--off-white)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          fontSize: '0.82rem',
          color: 'var(--gray)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--slate)' }}>Note on ×2 specs:</strong> All output ratings are combined (both packs active). Lube oil, coolant, and DEF capacities are totals across both packs. Engine specs (displacement, cylinders) are per pack. Source: Kirloskar Powergen Optiprime CPCB IV+ brochure.
        </div>

      </div>
    </div>
  )
}
