import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { KOEL_RANGES } from '../data/koel'

const HERO_SLIDES = [
  {
    badge: 'Highest Demand',
    img: '/images/koel_82-160_cover.jpeg',
    label: 'KG4-82.5WS1 to KG4-160WS11',
    kva: '82.5 – 160 kVA',
    href: '/range/82-160',
    dark: false,
  },
  {
    badge: 'Optiprime HHP',
    img: '/images/optiprime/optiprime_cover.jpg',
    label: 'Twin-pack · Intelligent PMS · CPCB IV+',
    kva: '117 – 2020 kVA',
    href: '/optiprime',
    dark: true,
  },
]

export default function Home() {
  const navigate   = useNavigate()
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__two-col">
            {/* Left — text */}
            <div className="hero__left">
              <div className="hero__eyebrow">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <circle cx="5" cy="5" r="5"/>
                </svg>
                CPCB IV+ Compliant · All India
              </div>

              <h1 className="hero__title">
                Better Power for a<br />
                <span>Limitless Tomorrow</span>
              </h1>

              <p className="hero__subtitle">
                Product intel, competitor comparisons, segment knowledge, and customer-ready pitches — one platform for the field.
              </p>

              <div className="hero__actions">
                <button className="btn btn--white btn--lg" onClick={() => navigate('/pitch')}>
                  Build a Pitch
                </button>
                <button className="btn btn--lg" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => navigate('/compare')}>
                  Compare Models →
                </button>
              </div>
            </div>

            {/* Right — hero slider */}
            <div className="hero__right">
              {HERO_SLIDES.map((s, i) => (
                <div
                  key={i}
                  className="hero__product-card"
                  onClick={() => navigate(s.href)}
                  style={{
                    display: i === slide ? 'block' : 'none',
                    cursor: 'pointer',
                    ...(s.dark ? {
                      background: 'linear-gradient(135deg, #0D1F2D 0%, #0F2A38 100%)',
                      border: '1px solid rgba(0,123,127,0.35)',
                    } : {}),
                  }}
                >
                  <div className="hero__product-card__badge"
                    style={s.dark ? { background: 'var(--teal)', color: 'white' } : {}}>
                    {s.badge}
                  </div>
                  <img
                    src={s.img}
                    alt={s.kva}
                    style={s.dark ? { filter: 'brightness(0.9)' } : {}}
                  />
                  <div className="hero__product-card__label"
                    style={s.dark ? { color: 'rgba(255,255,255,0.6)' } : {}}>
                    {s.label}
                  </div>
                  <div className="hero__product-card__kva"
                    style={s.dark ? { color: 'var(--teal)' } : {}}>
                    {s.kva}
                  </div>
                </div>
              ))}
              {/* Slide dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {HERO_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    style={{
                      width: i === slide ? 20 : 8,
                      height: 8,
                      borderRadius: 4,
                      background: i === slide ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 300ms ease',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="hero__stats">
            {[
              { value: '1L+',       label: 'Gensets Under Active Monitoring' },
              { value: 'LHP–HHP',   label: '7.5 kVA to 2020 kVA Full Range' },
              { value: '24 Hr',     label: 'Breakdown Response Commitment' },
              { value: 'CPCB IV+',  label: 'Fully Compliant Range' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center', flex: '1 1 0', minWidth: 0 }}>
                <div className="hero__stat-value">{stat.value}</div>
                <div className="hero__stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Module Tiles ───────────────────────────────────────── */}
      <section style={{ padding: 'var(--s12) 0', background: 'var(--white)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Platform Modules</div>
            <h2>Everything a rep needs</h2>
            <p>Five modules, one platform. Each built for what actually happens in the field.</p>
          </div>

          {/* Row 1: 3 equal columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--s5)', marginBottom: 'var(--s5)' }}>

            {/* Pitch Builder — dark, primary */}
            <div className="module-card module-card--dark" onClick={() => navigate('/pitch')}>
              <div className="module-card__icon" style={{ background: 'var(--teal)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div className="module-card__title">Pitch Builder</div>
              <div className="module-card__desc">Block load input to customer-ready pitch in minutes. Live TCO calculator, auto-matched references, competitor counters.</div>
              <div className="module-card__cta">Build a pitch →</div>
            </div>

            {/* Competitor Analysis */}
            <div className="module-card" onClick={() => navigate('/compare')}>
              <div className="module-card__icon" style={{ background: 'var(--teal-light)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div className="module-card__title">Competitor Analysis</div>
              <div className="module-card__desc">Head-to-head spec comparison against Cummins, CAT, Greaves, Mahindra, Baudouin. Download as PDF.</div>
              <div className="module-card__cta">Open comparator →</div>
            </div>

            {/* Products */}
            <div className="module-card" onClick={() => document.getElementById('product-ranges').scrollIntoView({ behavior: 'smooth' })}>
              <div className="module-card__icon" style={{ background: 'var(--teal-light)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <div className="module-card__title">Products</div>
              <div className="module-card__desc">Full KOEL range with photos and specs. 7.5 kVA to 2020 kVA. Optiprime HHP twin-pack included.</div>
              <div className="module-card__cta">Browse range ↓</div>
            </div>

          </div>

          {/* Row 2: 2 wider columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--s5)' }}>

            {/* Segments */}
            <div className="module-card" onClick={() => navigate('/segments')} style={{ position: 'relative' }}>
              <div className="module-card__badge">Building</div>
              <div className="module-card__icon" style={{ background: 'var(--teal-light)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <div className="module-card__title">Segment Intelligence</div>
              <div className="module-card__desc">Deep cheat sheets for 12 industry segments. Buyer profiles, sizing norms, key talking points. India heatmap showing where each segment clusters.</div>
              <div className="module-card__cta">Explore segments →</div>
            </div>

            {/* Track Record */}
            <div className="module-card" onClick={() => navigate('/track-record')} style={{ position: 'relative' }}>
              <div className="module-card__badge">Building</div>
              <div className="module-card__icon" style={{ background: 'var(--teal-light)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <div className="module-card__title">Track Record</div>
              <div className="module-card__desc">KOEL's reference database. Searchable by segment, state, kVA range. The proof points reps use in meetings — auto-embedded in every pitch.</div>
              <div className="module-card__cta">Browse references →</div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Product Ranges ─────────────────────────────────────── */}
      <section id="product-ranges" style={{ padding: 'var(--s12) 0' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-eyebrow">Product Range</div>
            <h2>CPCB IV+ Compliant Gensets</h2>
            <p>7.5 kVA to 750 kVA, all prime-rated, all CPCB IV+ compliant. Click any range for full specifications.</p>
          </div>

          <div className="product-grid">
            {KOEL_RANGES.map(range => (
              <ProductCard key={range.id} range={range} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Optiprime HHP Promo ───────────────────────────────── */}
      <section style={{ padding: 'var(--s12) 0', background: 'var(--white)' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #0D1F2D 0%, #0F2A38 100%)',
            border: '1px solid rgba(0,123,127,0.25)',
            borderRadius: 16,
            overflow: 'hidden',
            display: 'flex',
            flexWrap: 'wrap',
          }}>
            {/* Left — image */}
            <div style={{
              flex: '1 1 320px',
              minHeight: 260,
              backgroundImage: 'url(/images/optiprime/optiprime_product.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right, transparent 60%, #0F2A38 100%)',
              }} />
            </div>

            {/* Right — text */}
            <div style={{ flex: '1 1 340px', padding: 'var(--s10) var(--s10)', color: 'white' }}>
              <div style={{
                display: 'inline-block',
                background: 'var(--teal)', color: 'white',
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '3px 10px', borderRadius: 4,
                marginBottom: 'var(--s4)',
              }}>
                HHP Range
              </div>
              <h2 style={{ color: 'white', margin: '0 0 var(--s3)', fontSize: '1.7rem', lineHeight: 1.2 }}>
                Optiprime<br />
                <span style={{ color: 'var(--teal)' }}>117 – 2020 kVA</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 var(--s6)' }}>
                Twin-pack parallel gensets with intelligent Power Management System. One enclosure, two independent engine-alternator sets — the PMS shuts off one pack under low load, cutting CO₂ by 40% and NOx by 50%.
              </p>
              <div style={{ display: 'flex', gap: 'var(--s6)', marginBottom: 'var(--s8)', flexWrap: 'wrap' }}>
                {[
                  { val: '40%', label: 'CO₂ reduction' },
                  { val: '50%', label: 'NOx reduction' },
                  { val: '7', label: 'Models available' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--teal)' }}>{s.val}</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <button
                className="btn btn--lg"
                style={{ background: 'var(--teal)', color: 'white', border: 'none' }}
                onClick={() => navigate('/optiprime')}
              >
                Explore Optiprime
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Kirloskar ─────────────────────────────────────── */}
      <section className="why-strip">
        <div className="container">
          <div className="why-strip__grid">
            <div className="why-item">
              <div className="why-item__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="why-item__value">Kirloskar</div>
              <div className="why-item__label">Manufactured Engines, not 3rd-party sourced</div>
            </div>
            <div className="why-item">
              <div className="why-item__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div className="why-item__value">250+</div>
              <div className="why-item__label">Expert service touch points across India</div>
            </div>
            <div className="why-item">
              <div className="why-item__icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div className="why-item__value">5-Year AMC</div>
              <div className="why-item__label">Declared maintenance pricing. No surprises.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Compare CTA ─────────────────────────────────── */}
      <section style={{ padding: 'var(--s12) 0', background: 'var(--white)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="section-eyebrow">Competitor Intelligence</div>
          <h2 style={{ marginBottom: 'var(--s3)' }}>Head-to-Head Comparison</h2>
          <p style={{ color: 'var(--gray)', maxWidth: 520, margin: '0 auto var(--s8)' }}>
            Compare any KOEL genset against Cummins, Mahindra Powerol, or Greaves Cotton —
            spec by spec, with field-tested remarks on what the numbers actually mean.
          </p>
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/compare')}>
            Open Comparator
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </section>
    </div>
  )
}
