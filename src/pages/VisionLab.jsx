// ─────────────────────────────────────────────────────────────────────────────
// Vision Lab — Path to 2B2B · FY30
// Strategic segment × kVA-band view. Editable assumptions, grounded in AR data.
// Section 1: Market Anchors — the only sourced numbers you can trust today.
// Every figure flows from JSON in src/data/vision/. Hover any number → see source.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import Figure from '../components/Figure'
import koelData    from '../data/vision/koel_fy25_actuals.json'
import cumminsData from '../data/vision/cummins_fy25_actuals.json'
import greavesData from '../data/vision/greaves_fy25_actuals.json'

// Row lookup helper — keeps the JSX readable
const pick = (data, id) => data.rows.find(r => r.metricId === id) || null

// Which metrics to show in the Market Anchors comparison table
const ANCHOR_METRICS = [
  { id: 'totalRevenue',      label: 'Total revenue',         size: 'default' },
  { id: 'ebitda',            label: 'EBITDA',                size: 'default' },
  { id: 'netProfit',         label: 'Net profit',            size: 'default' },
  { id: 'powerGenRevenue',   label: 'Power Gen revenue',     size: 'default', hero: true },
  { id: 'b2bSegmentRevenue', label: 'B2B / Engines segment', size: 'default' },
  { id: 'exportRevenue',     label: 'Export revenue',        size: 'default' },
  { id: 'unitVolume',        label: 'Gensets sold',          size: 'default' },
]

export default function VisionLab() {
  const navigate = useNavigate()
  const accent = '#1E2D3D'
  const accentSoft = 'rgba(30,45,61,0.06)'

  // ── Key headlines: FY25 KOEL Power Gen + B2B + industry position ────────
  const koelPowerGen = pick(koelData, 'powerGenRevenue')
  const koelB2B      = pick(koelData, 'b2bSegmentRevenue')
  const cumminsTotal = pick(cumminsData, 'totalRevenue')
  const cumminsUnits = pick(cumminsData, 'unitVolume')

  const companies = [
    { key: 'koel',    name: 'KOEL',           data: koelData,    note: 'Cleanest disclosure — Power Gen broken out in MD&A' },
    { key: 'cummins', name: 'Cummins India',  data: cumminsData, note: 'Engines + Lubes only — no Power Gen split' },
    { key: 'greaves', name: 'Greaves Cotton', data: greavesData, note: 'Engines segment bundles auto + non-auto + farm' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off-white)', paddingBottom: 'var(--s12)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 var(--s6)' }}>

        {/* Header */}
        <div style={{ paddingTop: 'var(--s8)', marginBottom: 'var(--s6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <button
              onClick={() => navigate('/')}
              style={{
                fontSize: '0.68rem', color: 'var(--gray)', background: 'transparent',
                border: '1px solid var(--border)', padding: '3px 10px',
                borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ← Platform
            </button>
            <span style={{
              fontSize: '0.62rem', fontWeight: 800, color: accent,
              background: accentSoft, padding: '3px 10px', borderRadius: 99,
              letterSpacing: '0.1em',
            }}>
              BUILDING
            </span>
          </div>
          <h1 style={{
            margin: 0, fontSize: '1.7rem', fontWeight: 800,
            color: 'var(--slate)', letterSpacing: '-0.02em',
          }}>
            Vision Lab
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--gray)', fontSize: '0.88rem', lineHeight: 1.55 }}>
            Path to 2B2B · FY30 — segment-by-segment, grounded in AR data, assumptions exposed
          </p>
        </div>

        {/* ── Hero numbers — anchored on FY25 KOEL disclosure ─────────────── */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderLeft: `4px solid ${accent}`,
          borderRadius: 12,
          padding: '22px 26px',
          marginBottom: 'var(--s6)',
        }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 800, color: accent,
            letterSpacing: '0.12em', marginBottom: 14, textTransform: 'uppercase',
          }}>
            FY25 — Where KOEL stands today
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24,
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 4 }}>
                KOEL Power Gen revenue
              </div>
              <Figure entry={koelPowerGen} size="large" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 4 }}>
                KOEL B2B segment (consolidated)
              </div>
              <Figure entry={koelB2B} size="large" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 4 }}>
                Cummins India total revenue
              </div>
              <Figure entry={cumminsTotal} size="large" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: 4 }}>
                Cummins gensets sold FY25
              </div>
              <Figure entry={cumminsUnits} size="large" />
            </div>
          </div>

          <div style={{
            marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)',
            fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--slate)' }}>2B2B target </strong>
            = $2 billion aspiration by FY30 (MD's message, KOEL AR FY24-25, p.19).
            At FY25 Power Gen revenue of ₹1,969 Cr ≈ $240M, the Power Gen path to $2B
            is the single largest lever — which is why this lab exists.
          </div>
        </div>

        {/* ── Market Anchors — side-by-side comparison ─────────────────────── */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '22px 26px',
          marginBottom: 'var(--s6)',
        }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: '0.7rem', fontWeight: 800, color: accent,
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4,
            }}>
              Section 1 — Market anchors (FY25)
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate)' }}>
              KOEL vs Cummins India vs Greaves Cotton
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gray)', marginTop: 4, lineHeight: 1.55 }}>
              What each company discloses — and what they don't. "Needs data" is a
              disclosure gap, not a missing value. Hover any number to see source + confidence.
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem',
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: 'var(--slate)' }}>
                    Metric
                  </th>
                  {companies.map(c => (
                    <th key={c.key} style={{
                      textAlign: 'left', padding: '10px 12px',
                      fontWeight: 700, color: 'var(--slate)', minWidth: 200,
                    }}>
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ANCHOR_METRICS.map(metric => (
                  <tr key={metric.id} style={{
                    borderBottom: '1px solid var(--border)',
                    background: metric.hero ? 'rgba(232,119,34,0.04)' : 'transparent',
                  }}>
                    <td style={{
                      padding: '12px', color: 'var(--slate)',
                      fontWeight: metric.hero ? 700 : 500,
                    }}>
                      {metric.label}
                      {metric.hero && (
                        <span style={{
                          marginLeft: 8, fontSize: '0.6rem', fontWeight: 800,
                          color: '#E87722', background: 'rgba(232,119,34,0.12)',
                          padding: '2px 6px', borderRadius: 4, letterSpacing: '0.08em',
                        }}>
                          KEY
                        </span>
                      )}
                    </td>
                    {companies.map(c => {
                      const entry = pick(c.data, metric.id)
                      return (
                        <td key={c.key} style={{ padding: '12px' }}>
                          <Figure entry={entry} size="small" />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Disclosure notes — what each company does differently */}
          <div style={{ marginTop: 22, display: 'grid', gap: 10 }}>
            {companies.map(c => (
              <div key={c.key} style={{
                fontSize: '0.74rem', color: 'var(--gray)', lineHeight: 1.55,
                padding: '8px 12px', background: 'var(--off-white)',
                borderLeft: `2px solid ${accent}`, borderRadius: 4,
              }}>
                <strong style={{ color: 'var(--slate)' }}>{c.name}: </strong>
                {c.note}
              </div>
            ))}
          </div>
        </div>

        {/* ── Remaining building blocks (scaffolded, data pending) ─────────── */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray)',
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Next sections
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {[
            {
              label: 'Share Triangulation',
              desc: 'Per-kVA-band share estimates using revenue + realization method. Every number carries source + confidence.',
              status: 'Scaffold ready (6 kVA bands × 6 OEMs). Needs: volume disclosure from industry body or triangulation from dealer-level data.',
            },
            {
              label: 'Segment Economics',
              desc: 'For each of 12 canonical segments: market size, KOEL share today, industry CAGR, segment-specific dynamics.',
              status: 'Taxonomy locked (12 segments). Next: size + CAGR anchors per segment from industry reports.',
            },
            {
              label: 'Scenario Builder',
              desc: 'Editable knobs per segment: CAGR, KOEL share gain, realization growth. Live calculation of FY30 path.',
              status: 'Assumptions JSON scaffolded. Builds after Segment Economics is populated.',
            },
          ].map(card => (
            <div key={card.label} style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${accent}`,
              borderRadius: 10,
              padding: '18px 20px',
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--slate)', marginBottom: 8 }}>
                {card.label}
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.6 }}>
                {card.desc}
              </p>
              <div style={{
                fontSize: '0.72rem', color: 'var(--muted)',
                paddingTop: 8, borderTop: '1px solid var(--border)',
              }}>
                {card.status}
              </div>
            </div>
          ))}
        </div>

        {/* Source-truth banner */}
        <div style={{
          marginTop: 32,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '16px 20px',
          fontSize: '0.78rem',
          color: 'var(--gray)',
          lineHeight: 1.65,
        }}>
          <strong style={{ color: 'var(--slate)' }}>Source-strict numbers: </strong>
          Every number on this page flows from a JSON Entry in <code>src/data/vision/</code>, each
          carrying value + unit + source + page number + confidence + lastUpdated. Hover
          any figure to see its trace. Red "Needs data" badges mark what competitors do not disclose —
          which is as informative as the numbers they do.
        </div>

      </div>
    </div>
  )
}
