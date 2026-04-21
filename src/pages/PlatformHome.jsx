// ─────────────────────────────────────────────────────────────────────────────
// PlatformHome — Kirloskar Intelligence Platform launcher
// 3 modules: Sales Pro · Opportunities · Vision Lab
// Light, confident theme. No dark cards.
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { auth } from '../lib/storage'
import { supabase } from '../lib/supabase'

const MODULES = [
  {
    id: 'sales-pro',
    path: '/sales-pro',
    name: 'Sales Pro',
    tagline: 'The field sales toolkit',
    tag: 'LIVE',
    accent: '#007B7F',           // KOEL teal
    accentSoft: 'rgba(0,123,127,0.08)',
    features: [
      'Pitch builder with TCO + competitor panel',
      'Product specs, Optiprime, comparisons',
      'Segment cheat sheets & track record',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    id: 'opportunities',
    path: '/opportunities',
    name: 'Opportunities',
    tagline: 'Where demand meets coverage',
    tag: 'BUILDING',
    accent: '#E87722',           // KOEL orange
    accentSoft: 'rgba(232,119,34,0.08)',
    features: [
      'India project pipeline by segment',
      'GOEM territory & coverage overlay',
      'White-space gaps for BD action',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    id: 'bd-center',
    path: '/bd-center',
    name: 'BD Center',
    tagline: 'Business development CRM',
    tag: 'NEW',
    accent: '#7c3aed',
    accentSoft: 'rgba(124,58,237,0.07)',
    features: [
      'Add leads from device GPS — city, district, state auto-filled',
      'India map showing live pipeline by territory',
      'Meeting notes, file uploads, visiting card capture',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'vision-lab',
    path: '/vision-lab',
    name: 'Vision Lab',
    tagline: 'Path to 2B2B · FY30',
    tag: 'BUILDING',
    accent: '#1E2D3D',           // KOEL slate
    accentSoft: 'rgba(30,45,61,0.06)',
    features: [
      'Segment × kVA-band market anchors',
      'Competitor share triangulation',
      'Scenario builder for FY30 target',
    ],
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18"/>
        <path d="M7 14l4-4 4 4 5-5"/>
      </svg>
    ),
  },
]

export default function PlatformHome() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)

  async function handleLogout() {
    auth.logout()
    if (supabase) await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--off-white)' }}>

      {/* ── Teal hero ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--teal-dark) 0%, var(--teal) 60%, var(--teal-mid) 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '56px 0 66px',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.045'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Sign out — top right of hero */}
          <div style={{ position: 'absolute', top: -36, right: 0 }}>
            <button onClick={handleLogout} style={{
              fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)', padding: '4px 12px',
              borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            >
              Sign out
            </button>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 999, padding: '5px 18px',
            fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'white', marginBottom: 22,
          }}>
            <svg width="7" height="7" viewBox="0 0 10 10" fill="white">
              <circle cx="5" cy="5" r="5"/>
            </svg>
            Kirloskar Oil Engines · PGBU
          </div>

          <h1 style={{
            fontSize: '2.8rem', fontWeight: 800, color: 'white',
            letterSpacing: '-0.03em', margin: '0 0 14px', lineHeight: 1.1,
          }}>
            KOEL Platform
          </h1>

          <p style={{
            fontSize: '1rem', color: 'rgba(255,255,255,0.78)',
            margin: 0, fontWeight: 400, lineHeight: 1.5,
          }}>
            Field sales · BD pipeline · Market opportunity · Strategic vision
          </p>
        </div>
      </div>

      {/* ── Module grid ─────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '56px 24px 72px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 420px))',
          gap: 22,
          maxWidth: 880,
          width: '100%',
        }}>
          {MODULES.map(mod => {
            const active = hovered === mod.id
            return (
              <div
                key={mod.id}
                onClick={() => navigate(mod.path)}
                onMouseEnter={() => setHovered(mod.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderLeft: `4px solid ${mod.accent}`,
                  borderRadius: 12,
                  padding: '28px 28px 26px',
                  cursor: 'pointer',
                  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
                  boxShadow: active
                    ? `0 10px 28px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)`
                    : '0 1px 3px rgba(0,0,0,0.04)',
                  transform: active ? 'translateY(-3px)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 286,
                  userSelect: 'none',
                }}
              >
                {/* Top: icon + tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: mod.accentSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: mod.accent,
                    flexShrink: 0,
                  }}>
                    {mod.icon}
                  </div>
                  <span style={{
                    fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.12em',
                    color: mod.accent,
                    background: mod.accentSoft,
                    padding: '4px 10px', borderRadius: 99,
                  }}>
                    {mod.tag}
                  </span>
                </div>

                {/* Name + tagline */}
                <h2 style={{
                  margin: '0 0 4px',
                  fontSize: '1.4rem', fontWeight: 800,
                  color: 'var(--slate)', letterSpacing: '-0.02em',
                }}>
                  {mod.name}
                </h2>
                <div style={{
                  fontSize: '0.78rem', color: mod.accent, fontWeight: 600,
                  marginBottom: 18,
                }}>
                  {mod.tagline}
                </div>

                {/* Features */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                  {mod.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: mod.accent, opacity: 0.8,
                        flexShrink: 0, marginTop: 7,
                      }} />
                      <span style={{ fontSize: '0.82rem', color: 'var(--gray)', lineHeight: 1.5 }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  color: active ? mod.accent : 'var(--gray-light)',
                  fontSize: '0.76rem', fontWeight: 700,
                  transition: 'color 180ms',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 16,
                  letterSpacing: '0.02em',
                }}>
                  Open {mod.name}
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
                    style={{ transform: active ? 'translateX(3px)' : 'none', transition: 'transform 180ms' }}>
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--white)',
        borderTop: '1px solid var(--border)',
        padding: '14px 0',
        textAlign: 'center',
        fontSize: '0.65rem',
        color: 'var(--gray-light)',
        letterSpacing: '0.06em',
        flexShrink: 0,
      }}>
        KOEL Platform · Power Generation Business Unit · Internal tool
      </div>

    </div>
  )
}
