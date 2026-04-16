import { useState } from 'react'

// ── Standalone demo page — not linked in nav ──────────────────────────
// Access via: /demo
// Shows 82.5 kVA and 750 kVA with marketing-language explainers per spec.
// Built for the Samir/Gaurav demo — July 2025.

const MODELS = {
  '82.5': {
    model:    'KG4-82.5WS1',
    kva:      82.5,
    kw:       66,
    range:    '82.5 – 160 kVA  ·  SL Series',
    image:    '/images/koel_82-160_cover.jpeg',
    datasheet: '/datasheets/KOEL/3_A4_CPCB IV+82.5-160 kVA_SL Series.pdf',
    specs: {
      noiseLevel:            '<75 dBA',
      engineMake:            'Kirloskar',
      engineModel:           '4R1190ETA 4G1',
      cylinders:             4,
      displacement:          '4.76 L',
      aspiration:            'Turbocharged (TA)',
      fuelTank:              '200 L',
      fuelRuntime:           '~15 hrs at 75% load',
      adblueCapacity:        '25 L',
      lubeOilChangePeriod:   '500 hrs',
      alternatorEfficiency:  '91.1%',
      maxVoltageDip:         '<20%',
      insulationClass:       'H',
      dimensions:            '3200 × 1350 × 1595 mm',
      weightDry:             '1800 kg',
      amc:                   '5-Year declared pricing',
      governingClass:        'G3',
      cpcb:                  'IV+',
    },
  },
  '750': {
    model:    'KG4-750WS',
    kva:      750,
    kw:       600,
    range:    '320 – 750 kVA',
    image:    '/images/koel_320-750_cover.jpeg',
    datasheet: '/datasheets/KOEL/5_A4_CPCB IV+320-750 kVA.pdf',
    specs: {
      noiseLevel:            '<75 dBA',
      engineMake:            'Kirloskar',
      engineModel:           'DV12ETA 4G2',
      cylinders:             12,
      displacement:          '23.88 L',
      aspiration:            'Turbocharged (TA)',
      fuelTank:              '990 L',
      fuelRuntime:           '~9 hrs at 75% load',
      adblueCapacity:        '90 L  (dual 45L tanks)',
      lubeOilChangePeriod:   '500 hrs',
      alternatorEfficiency:  '94.7%',
      maxVoltageDip:         '<20%',
      insulationClass:       'H',
      dimensions:            '6800 × 2300 × 2715 mm',
      weightDry:             '8760 kg',
      amc:                   '5-Year declared pricing',
      governingClass:        'G3',
      cpcb:                  'IV+',
    },
  },
}

// ── Marketing-language insights per spec key, per model ───────────────
const INSIGHTS = {
  '82.5': {
    noiseLevel: {
      headline: 'Declared at 100% load — not the industry-standard 75%',
      body: 'Most manufacturers test noise at 75% load — a lighter, quieter operating point that flatters the number. KOEL\'s <75 dBA is measured at full rated load. The number on our spec sheet is the worst case, not the best case. What you read is what you get on site.',
      callout: '⚠ Ask Cummins and Mahindra for their 100% load noise figure. It will be higher.',
    },
    engineMake: {
      headline: 'Engine and genset from the same manufacturer — one team, one warranty',
      body: 'Kirloskar makes both the engine inside and the genset around it. When something needs attention, there is no OEM vs. genset-OEM blame game. One call. One escalation path. This matters most at 2 AM during a critical outage.',
      callout: '↗ Cummins, Greaves, and Mahindra use third-party alternators. Kirloskar uses its own.',
    },
    displacement: {
      headline: '4.76 litres for 82.5 kVA — the engine is never working hard',
      body: 'Higher displacement at the same rated output means lower specific load per cylinder. This engine runs well within its design capacity — lower combustion temperatures, less friction wear per hour, and longer intervals between overhauls. Cheap to maintain, longer to need major work.',
      callout: 'Cummins QSB4.5 at equivalent kVA: 4.5L — 5.7% less displacement for the same output.',
    },
    fuelTank: {
      headline: '200L on-board — approximately 15 hours without refuelling',
      body: 'At 75% load this tank runs for ~15 continuous hours before needing a top-up. For a commercial site averaging 6–8 hours of daily backup use, that is two full days without a fuel visit. Fewer site interventions, lower operational overhead.',
      callout: 'Cummins equivalent: verify from GA drawing. Mahindra: often not declared on spec sheet.',
    },
    adblueCapacity: {
      headline: '25L AdBlue tank — CPCB IV+ with minimal maintenance burden',
      body: 'SCR-based compliance eliminates PM2.5 and NOx at source — the right way to meet the standard. At typical consumption rates, the 25L tank lasts over a week of daily backup use before refilling. No daily interventions needed.',
      callout: 'Cummins 82.5 kVA: 20L DEF tank. KOEL carries 25% more, reducing refill frequency.',
    },
    lubeOilChangePeriod: {
      headline: 'One oil change per year for typical backup use',
      body: 'At 6 hours of backup per day, 500 hours is roughly 83 days of runtime — approximately one service per year. Predictable, schedulable, budgetable. No surprise maintenance events disrupting operations.',
      callout: 'This interval also covers the first-service oil change at 50 hours — included in warranty scope.',
    },
    alternatorEfficiency: {
      headline: '91.1% — we publish this because it is worth publishing',
      body: 'At 91.1% efficiency, 91.1% of the engine\'s mechanical output actually reaches your load as usable electricity. Over thousands of hours, this directly reduces fuel consumption for the same useful output. Most competitors do not declare this figure — ask why.',
      callout: '⚠ Cummins, Mahindra, Greaves do not declare alternator efficiency in their CPCB IV+ spec sheets.',
    },
    maxVoltageDip: {
      headline: 'Motor loads start cleanly — no nuisance trips',
      body: 'When a large motor starts, it draws 5–7x its running current for a fraction of a second. The genset\'s voltage dips during this event. If the dip exceeds tolerance, other equipment — UPS systems, medical devices, sensitive drives — can trip or fault. <20% dip ensures clean motor starting across the entire load board.',
      callout: 'Critical for hospitals, cold chains, and any site with large compressors or pump motors.',
    },
    amc: {
      headline: 'Know your service cost for five years before you sign',
      body: 'Kirloskar declares AMC pricing upfront — for each of the five post-warranty years. No surprise rate increases after year 2, no renegotiation when you are dependent on them. The total cost of ownership is transparent at the point of sale. This is rare in this industry.',
      callout: 'Competitors provide AMC quotes only after warranty expires — at which point you have no leverage.',
    },
  },
  '750': {
    noiseLevel: {
      headline: '<75 dBA at full 750 kVA load — not a lighter test point',
      body: 'At 750 kVA, generating less than 75 dBA is a genuine engineering achievement. KOEL declares this at 100% load. Industrial sites, hospitals, and data centres operating these units at high utilisation can plan acoustic isolation accurately — no surprises when the load comes on.',
      callout: '⚠ Confirm load test point with any competitor quoting <75 dBA at 750 kVA.',
    },
    engineMake: {
      headline: 'V12 Kirloskar engine in a Kirloskar genset — complete OEM integration',
      body: 'At the 750 kVA tier, engine and genset integration is critical. Thermal management, vibration isolation, and controls calibration are all co-designed. Sourcing an engine from one OEM and wrapping it in another manufacturer\'s canopy introduces integration risk. KOEL carries none of that.',
      callout: 'Cummins at this range uses QSM15 or QSK23 — both external sourced and integrated. Verify genset-level warranty vs engine warranty.',
    },
    displacement: {
      headline: '23.88L V12 — one of the most displacement-dense platforms at 750 kVA',
      body: 'Twelve cylinders, 23.88 litres total displacement for 750 kVA rated output. The engine is operating at moderate specific load — thermal stress per cylinder is low, bearing loads are distributed across twelve cylinders, and the overhaul life is correspondingly long. For mission-critical installations with high annual operating hours, this is the right architecture.',
      callout: 'Cummins QSK23 at 650 kVA: 23L, 6-cylinder — higher load per cylinder. KOEL V12: smoother torque and lower stress per cylinder.',
    },
    fuelTank: {
      headline: '990L on-board — approximately 9 hours at 75% load, hands-free',
      body: 'For a data centre or hospital running this genset as primary backup, 9+ hours without a fuel intervention covers most extended outage scenarios. On large sites where access to the genset room requires permits or escorts, fewer fuel visits is a genuine operational advantage.',
      callout: 'At 750 kVA, fuel consumption at 75% load is approximately 108 L/hr. 990L = ~9.2 hours.',
    },
    adblueCapacity: {
      headline: 'Dual 45L AdBlue tanks — 90L total for extended mission-critical runs',
      body: 'Two independent 45L DEF tanks ensure SCR system redundancy and extended runtime without refilling. For sites running extended backup hours — data centres, hospitals, grid-support installations — 90L means no mid-operation AdBlue intervention in any realistic outage scenario.',
      callout: 'Cummins QSM15 at 500 kVA: single ~45L tank. KOEL 750 kVA: 2x that volume.',
    },
    lubeOilChangePeriod: {
      headline: '500-hour interval on a 12-cylinder engine — exceptional for the class',
      body: 'On a large V12, maintaining 500-hour oil change intervals requires careful engine calibration and oil system design. KOEL achieves this consistently across the 320–750 kVA range. For a site running 1000+ hours annually, this is two planned outages per year for oil changes — predictable, schedulable, minimally disruptive.',
      callout: 'Cummins QSM15: 750-hour interval — but verify full service scope vs KOEL\'s AMC package costs.',
    },
    alternatorEfficiency: {
      headline: '94.7% — at 750 kVA, every percentage point is kilowatts and rupees',
      body: 'At 750 kVA, 1% alternator efficiency difference equals 7.5 kW of useful output per hour. Over 1000 annual operating hours at ₹92/litre diesel, the difference between 93% and 94.7% efficiency is approximately ₹2.5–3 lakh per year in fuel savings. KOEL declares this. Others don\'t.',
      callout: 'At 94.7% efficiency, KOEL\'s 750 kVA alternator is among the highest declared figures in this class.',
    },
    maxVoltageDip: {
      headline: '<20% voltage dip — UPS handover and motor starts remain stable',
      body: 'At 750 kVA, a genset is likely handling large HVAC compressors, pumping stations, or UPS handover loads. Voltage dip during these transient events determines whether the load switches cleanly or trips. <20% ensures industrial motor starters, ATC controllers, and sensitive downstream equipment all operate within their tolerance bands.',
      callout: 'Critical for data centres (UPS handover), hospitals (surgical equipment), and factories (large drive loads).',
    },
    amc: {
      headline: 'Declared 5-year AMC pricing at the time of purchase — no renegotiation',
      body: 'For a ₹1Cr+ asset, knowing the maintenance cost for years 3, 4, and 5 is not a nice-to-have — it is a finance requirement. Kirloskar commits to AMC pricing at sale. By year 5, the asset is fully amortised and the team knows exactly what it costs to keep it running.',
      callout: 'At 750 kVA, unplanned maintenance events can run ₹3–5L per incident. AMC pricing protection matters.',
    },
  },
}

// ── Parameter groups — defines priority order and grouping ────────────
const PARAM_GROUPS = [
  {
    id: 'performance',
    label: 'Performance',
    color: '#007B7F',
    bg: '#E8F5F5',
    params: [
      { key: 'noiseLevel',           label: 'Noise Level',            unit: '',     icon: '🔇' },
      { key: 'displacement',         label: 'Engine Displacement',    unit: '',     icon: '⚙️' },
      { key: 'engineMake',           label: 'Engine Manufacturer',    unit: '',     icon: '🏭' },
      { key: 'cylinders',            label: 'Cylinders',              unit: '',     icon: '🔩' },
      { key: 'maxVoltageDip',        label: 'Max Voltage Dip',        unit: '',     icon: '⚡' },
    ],
  },
  {
    id: 'autonomy',
    label: 'Operational Autonomy',
    color: '#E07B39',
    bg: '#FFF4ED',
    params: [
      { key: 'fuelTank',             label: 'Fuel Tank',              unit: '',     icon: '⛽' },
      { key: 'fuelRuntime',          label: 'Runtime (75% load)',     unit: '',     icon: '⏱' },
      { key: 'adblueCapacity',       label: 'AdBlue / DEF Tank',      unit: '',     icon: '💧' },
      { key: 'lubeOilChangePeriod',  label: 'Oil Change Interval',    unit: '',     icon: '🔧' },
    ],
  },
  {
    id: 'value',
    label: 'Value & Ownership',
    color: '#2D6A4F',
    bg: '#F0F7F4',
    params: [
      { key: 'alternatorEfficiency', label: 'Alternator Efficiency',  unit: '',     icon: '📊' },
      { key: 'amc',                  label: 'Service Contract',       unit: '',     icon: '📋' },
      { key: 'insulationClass',      label: 'Insulation Class',       unit: '',     icon: '🛡' },
      { key: 'cpcb',                 label: 'CPCB Standard',          unit: '',     icon: '✅' },
    ],
  },
]

// ── Single param card ─────────────────────────────────────────────────
function ParamCard({ paramKey, label, icon, value, insight, groupColor, groupBg }) {
  const [open, setOpen] = useState(false)
  const hasInsight = !!insight

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${open ? groupColor : '#E5E7EB'}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      boxShadow: open ? `0 4px 20px ${groupColor}22` : '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Main row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 18px',
          cursor: hasInsight ? 'pointer' : 'default',
          gap: 14,
        }}
        onClick={() => hasInsight && setOpen(o => !o)}
      >
        <div style={{ fontSize: '1.3rem', width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>
            {label}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0D1F2D' }}>
            {value ?? '—'}
          </div>
        </div>
        {hasInsight && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.72rem',
            fontWeight: 600,
            color: open ? groupColor : '#9CA3AF',
            background: open ? groupBg : '#F9FAFB',
            border: `1px solid ${open ? groupColor + '66' : '#E5E7EB'}`,
            borderRadius: 20,
            padding: '4px 10px',
            flexShrink: 0,
            transition: 'all 0.2s',
            userSelect: 'none',
          }}>
            What this means
            <span style={{ transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s', lineHeight: 1 }}>▾</span>
          </div>
        )}
      </div>

      {/* Insight accordion */}
      {hasInsight && open && (
        <div style={{
          borderTop: `1px solid ${groupColor}33`,
          background: groupBg,
          padding: '16px 18px 16px 60px',
          animation: 'none',
        }}>
          <div style={{ fontSize: '0.925rem', fontWeight: 700, color: '#0D1F2D', marginBottom: 8, lineHeight: 1.35 }}>
            {insight.headline}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: 1.65, marginBottom: insight.callout ? 12 : 0 }}>
            {insight.body}
          </div>
          {insight.callout && (
            <div style={{
              background: 'white',
              border: `1px solid ${groupColor}55`,
              borderLeft: `3px solid ${groupColor}`,
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: '0.8rem',
              color: '#374151',
              lineHeight: 1.55,
            }}>
              {insight.callout}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────
export default function DemoProductPage() {
  const [activeModel, setActiveModel] = useState('82.5')
  const m = MODELS[activeModel]
  const insights = INSIGHTS[activeModel]

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div style={{ background: '#0D1F2D', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/logo.jpg" alt="KOEL" style={{ height: 28, background: 'rgba(255,255,255,0.9)', borderRadius: 4, padding: '2px 6px' }} />
          <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 500 }}>KG4 Series — Sales Intelligence</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href="/compare" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20 }}>
            Competitor Check →
          </a>
        </div>
      </div>

      {/* ── Model switcher ────────────────────────────────────── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 0, maxWidth: 1100, margin: '0 auto' }}>
          {Object.entries(MODELS).map(([key, mod]) => (
            <button
              key={key}
              onClick={() => setActiveModel(key)}
              style={{
                padding: '16px 28px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: activeModel === key ? '#007B7F' : '#9CA3AF',
                borderBottom: activeModel === key ? '3px solid #007B7F' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {mod.kva} kVA — {mod.model}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #0D1F2D 0%, #0F2A38 100%)', padding: '40px 32px', color: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 40, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#007B7F', textTransform: 'uppercase', marginBottom: 8 }}>
              CPCB {m.specs.cpcb}  ·  {m.range}
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {m.model}
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)' }}>
              {m.kva} kVA  ·  {m.kw} kW  ·  {m.specs.governingClass} Governing  ·  Class H Insulation
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a
                href={m.datasheet}
                target="_blank"
                rel="noreferrer"
                style={{ background: '#007B7F', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}
              >
                View Official Datasheet →
              </a>
              <a
                href={`/compare?koel=${m.model}`}
                style={{ color: 'rgba(255,255,255,0.7)', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}
              >
                Compare vs Competitor
              </a>
            </div>
          </div>
          {/* Key stats strip */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { val: m.specs.noiseLevel, lbl: 'Noise @ 100% load' },
              { val: m.specs.displacement, lbl: 'Engine Displacement' },
              { val: m.specs.alternatorEfficiency, lbl: 'Alternator Efficiency' },
              { val: m.specs.fuelRuntime, lbl: 'Fuel Autonomy' },
            ].map(s => (
              <div key={s.lbl} style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#007B7F' }}>{s.val}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.3 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Param groups ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 32px 60px' }}>

        <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: 32, fontStyle: 'italic' }}>
          Click "What this means" on any parameter to see the customer-facing explanation and competitive context.
        </p>

        {PARAM_GROUPS.map(group => (
          <div key={group.id} style={{ marginBottom: 40 }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ height: 3, width: 28, background: group.color, borderRadius: 2 }} />
              <h2 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: group.color }}>
                {group.label}
              </h2>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>

            {/* Param cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {group.params.map(p => (
                <ParamCard
                  key={p.key}
                  paramKey={p.key}
                  label={p.label}
                  icon={p.icon}
                  value={m.specs[p.key]}
                  insight={insights[p.key]}
                  groupColor={group.color}
                  groupBg={group.bg}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ── All specs reference table ────────────────────────── */}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
          <div
            style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E5E7EB', fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
          >
            <span>Full Specification Reference</span>
            <span style={{ fontWeight: 400 }}>All data from official CPCB IV+ datasheet</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {Object.entries(m.specs).map(([k, v], i) => (
              <div key={k} style={{
                padding: '10px 20px',
                borderBottom: '1px solid #F3F4F6',
                background: i % 2 === 0 ? 'white' : 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}>
                <span style={{ fontSize: '0.8rem', color: '#9CA3AF', textTransform: 'capitalize' }}>
                  {k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0D1F2D', textAlign: 'right', fontFamily: 'monospace' }}>
                  {v ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
