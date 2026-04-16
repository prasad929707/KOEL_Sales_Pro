// Profile page — rep enters their designation, region, name
// These get used automatically in every Pitch Builder output

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, AUTH_BYPASS, repProfile, leads as leadsStore } from '../lib/storage'

const BYPASS_SESSION = { name: 'Guest', role: 'rep', email: 'guest@koel' }

export default function Profile() {
  const navigate = useNavigate()
  const session  = AUTH_BYPASS ? BYPASS_SESSION : auth.getSession()
  const saved    = repProfile.get() || {}

  const [allLeads, setAllLeads] = useState(() => leadsStore.getAll())
  const [form, setForm]   = useState({
    name:        saved.name        || session?.name || '',
    designation: saved.designation || '',
    region:      saved.region      || '',
    phone:       saved.phone       || '',
  })
  const [status, setStatus] = useState(null)

  const REGIONS = [
    'North — Delhi / NCR', 'North — UP / Uttarakhand', 'North — Punjab / Haryana / HP / J&K',
    'West — Maharashtra', 'West — Gujarat', 'West — Rajasthan / MP',
    'South — Karnataka', 'South — Tamil Nadu', 'South — Andhra / Telangana', 'South — Kerala',
    'East — West Bengal / Odisha', 'East — Bihar / Jharkhand / NE',
    'Central — HO / National',
  ]

  const save = () => {
    repProfile.set(form)
    setStatus('saved')
    setTimeout(() => setStatus(null), 2500)
  }

  const field = (label, key, type = 'text', placeholder = '') => (
    <div className="settings-field">
      <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{
          width: '100%', padding: '10px 14px',
          border: '1px solid var(--border)', borderRadius: 8,
          fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--slate)',
          background: 'white', outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--teal)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )

  return (
    <div className="page-content">
      <div className="container" style={{ maxWidth: 640 }}>

        <div style={{ marginBottom: 'var(--s8)' }}>
          <div className="section-eyebrow">Your Account</div>
          <h2>My Profile</h2>
          <p style={{ color: 'var(--gray)', marginTop: 'var(--s2)', fontSize: '0.9rem' }}>
            This information appears on every pitch you build. Fill it in once.
          </p>
        </div>

        {/* Account info (read-only from auth) */}
        <div className="settings-section" style={{ marginBottom: 'var(--s6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)', padding: 'var(--s5) var(--s6)', background: 'var(--teal-light)', borderRadius: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--teal)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.1rem', flexShrink: 0,
            }}>
              {(form.name || session?.name || 'KO').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--slate)' }}>{session?.email}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: 2 }}>
                {session?.role === 'admin' ? 'Admin account' : 'Sales Rep account'} · Login email cannot be changed here
              </div>
            </div>
          </div>
        </div>

        {/* Editable profile */}
        <div className="settings-section">
          <div className="settings-section__header">
            <h3>Profile Details</h3>
            <p>Used on pitch cover slides and rep notes. Saved to this device.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
            {field('Display name', 'name', 'text', 'Your full name as shown on pitches')}
            {field('Designation', 'designation', 'text', 'e.g. Senior Sales Engineer, Territory Manager')}

            <div className="settings-field">
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 6 }}>Territory / Region</label>
              <select
                value={form.region}
                onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid var(--border)', borderRadius: 8,
                  fontSize: '0.9rem', fontFamily: 'inherit', color: 'var(--slate)',
                  background: 'white', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Select your region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {field('Mobile', 'phone', 'tel', 'Your number — appears on pitch if filled')}
          </div>

          <button
            className="btn btn--primary"
            style={{ marginTop: 'var(--s6)' }}
            onClick={save}
          >
            {status === 'saved' ? '✓ Saved' : 'Save Profile'}
          </button>
        </div>

        {/* What this is used for */}
        <div style={{
          marginTop: 'var(--s6)', padding: 'var(--s5) var(--s6)',
          background: 'var(--off-white)', borderRadius: 12,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Where this appears
          </div>
          {[
            'Pitch Builder — cover slide "Presented by" section',
            'Pitch Builder — Next Steps slide contact card',
            'AI pitch generation — so the opener matches your role',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ fontSize: '0.825rem', color: 'var(--gray)' }}>{item}</span>
            </div>
          ))}
        </div>

        {/* ── Brief History ─────────────────────────────────── */}
        <div style={{ marginTop: 'var(--s10)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s5)' }}>
            <div>
              <div className="section-eyebrow">Activity</div>
              <h3 style={{ margin: 0 }}>Brief History</h3>
            </div>
            {allLeads.length > 0 && (
              <button className="btn btn--ghost btn--sm" onClick={() => { leadsStore.clear(); setAllLeads([]) }}>
                Clear all
              </button>
            )}
          </div>

          {allLeads.length === 0 ? (
            <div style={{ border: '1px dashed var(--border)', borderRadius: 12, padding: 'var(--s8)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 600, color: 'var(--slate)', marginBottom: 4 }}>No briefs yet</div>
              <p style={{ fontSize: '0.84rem', color: 'var(--gray)', margin: 0 }}>
                Every Sales Brief you generate is automatically logged here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s3)' }}>
              {allLeads.map(lead => (
                <div key={lead.id} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--s4)',
                  background: 'var(--white)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 'var(--s3) var(--s5)',
                  cursor: 'pointer',
                }}
                  onClick={() => navigate('/pitch', { state: { brief: lead._brief || lead } })}
                >
                  <div style={{ width: 10, height: 10, background: 'var(--teal)', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate)', marginBottom: 2 }}>{lead.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span>{lead.segment}</span>
                      {lead.city && <><span>·</span><span>{lead.city}</span></>}
                      {lead.kva  && <><span>·</span><span>{lead.kva}</span></>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                      {new Date(lead.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); leadsStore.remove(lead.id); setAllLeads(leadsStore.getAll()) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: 4, flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
