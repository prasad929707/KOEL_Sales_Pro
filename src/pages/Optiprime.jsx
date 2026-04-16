import { useNavigate } from 'react-router-dom'
import { OPTIPRIME_MODELS, OPTIPRIME_APPLICATIONS } from '../data/optiprime'

const FEATURES = [
  { label: 'Patented Twin-Pack Architecture',  desc: 'Two independent engine-alternator packs in one enclosure — a Kirloskar first.' },
  { label: '40% Lower CO₂ Emissions',          desc: 'Intelligent PMS shuts one engine off at low load. Cleaner, cheaper operation automatically.' },
  { label: '50% Lower NOₓ Emissions',          desc: 'O2E Series engines with CRDi for low-emission performance across all load conditions.' },
  { label: 'Optimal Fuel at Any Load',          desc: 'Best-in-class consumption from 25% to 100% loading — not just at rated output.' },
  { label: '20% Smaller Footprint',             desc: 'Single enclosure for prime + standby. Less real estate, same combined output.' },
  { label: 'KG1500 Sync Controller',            desc: 'Auto start-in-sync in 30 seconds. Load transfer when demand drops below 70%.' },
  { label: '500-Hour Oil Change Interval',      desc: 'Extended service intervals reduce downtime and total maintenance cost.' },
  { label: 'Remote IoT Monitoring',             desc: 'Monitor performance, receive alerts, and access service history from anywhere.' },
]

export default function Optiprime() {
  const navigate = useNavigate()

  return (
    <div>

      {/* ── Dark Hero ────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: 480,
        background: '#0D1F2D',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}>
        <img
          src="/images/optiprime/optiprime_cover.jpg"
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center', opacity: 0.4,
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(13,31,45,0.96) 40%, rgba(13,31,45,0.3) 100%)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: 'var(--s16) var(--s6)' }}>
          <div style={{ maxWidth: 560 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(0,123,127,0.2)', border: '1px solid rgba(0,123,127,0.45)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 'var(--s5)',
              fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--teal)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block' }} />
              CPCB IV+ · Kirloskar Powergen · HHP Range
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '2.8rem', fontWeight: 700,
              letterSpacing: '0.1em', color: 'white', lineHeight: 1,
              marginBottom: 'var(--s3)',
            }}>
              OPTIPRIME
            </div>
            <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)', marginBottom: 'var(--s5)', letterSpacing: '0.03em' }}>
              The Versatile Infrastructure Power Solution · 117 – 2020 kVA
            </div>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 'var(--s8)', maxWidth: 460 }}>
              Two engines. One enclosure. One intelligent system that knows when to run both — and when one is enough.
              Reduces fuel consumption and CO₂ by up to 40% vs. conventional gensets.
            </p>

            <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap' }}>
              <button
                className="btn btn--lg"
                style={{ background: 'var(--teal)', color: 'white', borderColor: 'var(--teal)' }}
                onClick={() => document.getElementById('op-models').scrollIntoView({ behavior: 'smooth' })}
              >
                View All 7 Models
              </button>
              <a
                href="/datasheets/Optiprime/optiprime-brochure.pdf"
                target="_blank" rel="noreferrer"
                className="btn btn--lg"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'white', borderColor: 'rgba(255,255,255,0.22)' }}
              >
                Download Brochure
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section style={{ background: 'var(--white)', padding: 'var(--s14) 0' }}>
        <div className="container">
          {/* Two-col: text left, image right */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--s12)',
            alignItems: 'center',
          }}>
            <div>
              <div className="section-eyebrow">The Technology</div>
              <h2 style={{ marginBottom: 'var(--s5)' }}>Two Engines,<br />One Smart System</h2>
              <p style={{ color: 'var(--gray)', lineHeight: 1.75, marginBottom: 'var(--s5)' }}>
                Every Optiprime unit houses <strong>two independent engine-alternator packs</strong> in a single containerised enclosure.
                The integrated Power Management System monitors load in real time and seamlessly switches one pack on or off.
              </p>
              <p style={{ color: 'var(--gray)', lineHeight: 1.75, marginBottom: 'var(--s7)' }}>
                At low load, one engine runs at optimal efficiency instead of two running light.
                At peak demand, both packs engage in sync within 30 seconds. Fuel savings are automatic.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
                {[
                  { val: '40%',      desc: 'Lower CO₂ emissions' },
                  { val: '50%',      desc: 'Lower NOₓ emissions' },
                  { val: '30 sec',   desc: 'Sync start time' },
                  { val: '25–100%',  desc: 'Operating load range' },
                ].map(s => (
                  <div key={s.val} style={{
                    background: 'var(--teal-light)',
                    borderRadius: 'var(--r-lg)',
                    padding: 'var(--s4)',
                  }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', color: 'var(--teal-dark)', fontWeight: 700 }}>{s.val}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gray)', marginTop: 3 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img
                src="/images/optiprime/optiprime_product.jpg"
                alt="Optiprime twin-pack system"
                style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section style={{ background: 'var(--off-white)', padding: 'var(--s14) 0' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Features</div>
            <h2>Built for Demanding Applications</h2>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--s4)',
            marginTop: 'var(--s8)',
          }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-xl)',
                padding: 'var(--s5)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s3)', marginBottom: 'var(--s3)' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--teal-light)', flexShrink: 0, marginTop: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="var(--teal-dark)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--slate)', lineHeight: 1.4 }}>{f.label}</div>
                </div>
                <div style={{ color: 'var(--gray)', fontSize: '0.82rem', lineHeight: 1.6, paddingLeft: 28 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Engineering / Cutaway ────────────────────────────────── */}
      <section style={{ background: 'var(--white)', padding: 'var(--s14) 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--s12)',
            alignItems: 'center',
          }}>
            <div style={{ borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img
                src="/images/optiprime/optiprime_cutaway.jpg"
                alt="Optiprime cutaway engineering view"
                style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }}
              />
            </div>
            <div>
              <div className="section-eyebrow">Engineering</div>
              <h2 style={{ marginBottom: 'var(--s5)' }}>Beyond Efficiency.</h2>
              <p style={{ color: 'var(--gray)', lineHeight: 1.75, marginBottom: 'var(--s6)' }}>
                Both packs share an acoustically insulated enclosure with a base-mounted radiator system.
                A single KG1500 microprocessor controller manages both engines — protection, breaker monitoring, and load sharing in one unit.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
                {[
                  'CRDi fuel injection for lower emissions and smoother operation',
                  'O2E Series: optimal efficiency at partial loads',
                  'Microprocessor controller with graphical LCD display',
                  '500-hour lube oil change period on all models',
                  'Prime rating: unlimited hours, 10% temporary overload capacity',
                ].map(pt => (
                  <div key={pt} style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'var(--teal-light)', flexShrink: 0, marginTop: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="var(--teal-dark)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ color: 'var(--gray)', fontSize: '0.88rem', lineHeight: 1.6 }}>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Models ────────────────────────────────────────── */}
      <section id="op-models" style={{ background: 'var(--off-white)', padding: 'var(--s14) 0' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Product Range</div>
            <h2>7 Models · 117 to 2020 kVA</h2>
            <p style={{ color: 'var(--gray)', maxWidth: 520 }}>
              Each rating pairs two engine packs in a single enclosure. Click any model for full specifications.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--s4)',
            marginTop: 'var(--s8)',
          }}>
            {OPTIPRIME_MODELS.map(m => (
              <div
                key={m.id}
                className="product-card"
                onClick={() => navigate(`/optiprime/${m.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {/* Header strip */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--teal) 0%, var(--teal-dark) 100%)',
                  padding: 'var(--s4) var(--s5)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', marginBottom: 2 }}>
                      CPCB IV+
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                      {m.kva} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>kVA</span>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 6, padding: '3px 9px',
                    fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'white',
                    letterSpacing: '0.06em',
                  }}>
                    ×2 PACKS
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: 'var(--s4) var(--s5)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: 'var(--s1)' }}>
                    {m.kvaPerPack} kVA per pack · {m.configuration}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--slate)', marginBottom: 'var(--s4)' }}>
                    {m.engineModel}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: 'var(--s4)' }}>
                    {m.cylinders}-cyl · {m.displacement} L/pack
                  </div>

                  {/* Key stats */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 'var(--s2)',
                    paddingTop: 'var(--s3)',
                    borderTop: '1px solid var(--border)',
                  }}>
                    {[
                      { label: 'Fuel @75%',   val: `${m.fuelConsumption.at75} L/h` },
                      { label: 'Alt. Eff.',   val: `${m.alternatorEfficiency}%` },
                      { label: 'Block Load',  val: `${m.blockLoadingCapacity}%` },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--gray)', marginBottom: 2, letterSpacing: '0.03em' }}>{s.label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--teal-dark)' }}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    marginTop: 'var(--s4)', fontSize: '0.78rem',
                    color: 'var(--teal)', display: 'flex', alignItems: 'center', gap: 4,
                    fontWeight: 500,
                  }}>
                    Full specifications
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Applications ─────────────────────────────────────────── */}
      <section style={{ background: 'var(--white)', padding: 'var(--s12) 0' }}>
        <div className="container">
          <div className="section-eyebrow" style={{ textAlign: 'center' }}>Applications</div>
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--s8)' }}>Built for Critical Infrastructure</h2>
          <div style={{ display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap', justifyContent: 'center' }}>
            {OPTIPRIME_APPLICATIONS.map(app => (
              <div key={app} style={{
                background: 'var(--off-white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-full)',
                padding: 'var(--s2) var(--s5)',
                color: 'var(--slate)',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}>
                {app}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Back to standard range ───────────────────────────────── */}
      <section style={{ background: 'var(--off-white)', padding: 'var(--s10) 0', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 'var(--s4)',
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Looking for 7.5 – 750 kVA?</div>
            <div style={{ fontWeight: 600, color: 'var(--slate)' }}>See the standard KOEL CPCB IV+ range</div>
          </div>
          <button className="btn btn--outline" onClick={() => navigate('/')}>
            Back to Product Range →
          </button>
        </div>
      </section>

    </div>
  )
}
