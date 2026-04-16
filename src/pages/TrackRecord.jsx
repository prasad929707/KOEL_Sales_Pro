// Track Record — searchable KOEL reference installation database
// Reps can submit references they know. Admins approve + add directly.
// Verified public entries seeded from trackRecord.js — always visible.

import { useState, useMemo } from 'react'
import { auth, AUTH_BYPASS, trackRefs } from '../lib/storage'
import { VERIFIED_REFS, TR_SEGMENTS, REF_SCHEMA } from '../data/trackRecord'

const BYPASS_SESSION = { name: 'Guest', role: 'rep', email: 'guest@koel' }

const SOURCE_BADGE = {
  verified: { label: 'Verified Public',  bg: '#dcfce7', color: '#166534' },
  admin:    { label: 'Admin-verified',   bg: '#dbeafe', color: '#1e40af' },
  user:     { label: 'Community',        bg: '#fef9c3', color: '#854d0e' },
}

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','J&K','Ladakh','Multiple',
]

// ── Ref Card ──────────────────────────────────────────────────────────────────
function RefCard({ ref: r, isAdmin, onApprove, onReject, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const badge = SOURCE_BADGE[r.source] || SOURCE_BADGE.user
  const isPending = r.status === 'pending'

  return (
    <div style={{
      background: 'var(--white)', border: `1px solid ${isPending ? '#fde68a' : 'var(--border)'}`,
      borderRadius: 14, overflow: 'hidden',
      opacity: r.status === 'rejected' ? 0.45 : 1,
    }}>
      {/* Dark header */}
      <div style={{ background: 'linear-gradient(135deg, #0B2318 0%, #0A2A38 100%)', padding: '18px 20px 14px', position: 'relative' }}>
        {/* Source + status badges */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ background: badge.bg, color: badge.color, fontSize: '0.62rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, letterSpacing: '0.06em' }}>
            {badge.label}
          </span>
          {isPending && (
            <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.62rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99 }}>
              Pending Review
            </span>
          )}
          {r.status === 'rejected' && (
            <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.62rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99 }}>
              Rejected
            </span>
          )}
        </div>

        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', marginBottom: 4, lineHeight: 1.3 }}>
          {r.customerName}
        </div>
        {r.organisation && r.organisation !== r.customerName && (
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{r.organisation}</div>
        )}

        {/* Location + year */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(r.city || r.state) && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {[r.city, r.state].filter(Boolean).join(', ')}
            </span>
          )}
          {r.year && (
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Since {r.year}</span>
          )}
        </div>
      </div>

      {/* White body */}
      <div style={{ padding: '14px 18px' }}>
        {/* Segment + size chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {r.segment && (
            <span style={{ background: 'var(--teal-light)', color: 'var(--teal)', fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
              {r.segment}
            </span>
          )}
          {(r.kvaRating || r.kwRating) && (
            <span style={{ background: 'var(--off-white)', border: '1px solid var(--border)', color: 'var(--slate)', fontSize: '0.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
              {r.kwRating ? `${r.kwRating.toLocaleString()} kW` : r.kvaRating}
            </span>
          )}
          {r.quantity > 1 && (
            <span style={{ background: 'var(--off-white)', border: '1px solid var(--border)', color: 'var(--gray)', fontSize: '0.68rem', padding: '3px 10px', borderRadius: 99 }}>
              {r.quantity.toLocaleString()} units
            </span>
          )}
        </div>

        {/* Application */}
        <p style={{ fontSize: '0.82rem', color: 'var(--gray)', lineHeight: 1.6, margin: '0 0 10px' }}>
          {r.application}
        </p>

        {/* Highlights */}
        {r.highlights?.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {(expanded ? r.highlights : r.highlights.slice(0, 3)).map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ width: 5, height: 5, background: 'var(--teal)', borderRadius: '50%', flexShrink: 0, marginTop: 7 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--slate)', lineHeight: 1.5 }}>{h}</span>
              </div>
            ))}
            {r.highlights.length > 3 && (
              <button onClick={() => setExpanded(e => !e)}
                style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginTop: 2 }}>
                {expanded ? '▲ Show less' : `+${r.highlights.length - 3} more`}
              </button>
            )}
          </div>
        )}

        {/* Product line */}
        {r.productLine && (
          <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontStyle: 'italic', marginBottom: 8 }}>
            {r.productLine}
          </div>
        )}

        {/* Verified source link */}
        {r.source === 'verified' && r.sourceUrl && (
          <a href={r.sourceUrl} target="_blank" rel="noreferrer"
            style={{ fontSize: '0.7rem', color: 'var(--teal)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Source: {r.sourceLabel || 'Public record'}
          </a>
        )}

        {/* Admin submitted by */}
        {r.source !== 'verified' && (
          <div style={{ fontSize: '0.7rem', color: 'var(--gray)', marginTop: 6 }}>
            Submitted by {r.submittedBy} · {new Date(r.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {r.approvedBy && r.source !== 'verified' && (
              <> · Approved by {r.approvedBy}</>
            )}
          </div>
        )}

        {/* Admin actions */}
        {isAdmin && r.source !== 'verified' && (
          <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {isPending && (
              <>
                <button className="btn btn--primary btn--sm" onClick={() => onApprove(r.id)}>✓ Approve</button>
                <button className="btn btn--ghost btn--sm" style={{ color: '#dc2626' }} onClick={() => onReject(r.id)}>Reject</button>
              </>
            )}
            <button className="btn btn--ghost btn--sm" style={{ marginLeft: 'auto', color: 'var(--gray)' }} onClick={() => onRemove(r.id)}>Remove</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Submit / Add Form ─────────────────────────────────────────────────────────
function RefForm({ onSubmit, onClose, isAdmin }) {
  const [form, setForm] = useState({ ...REF_SCHEMA, highlights: [] })
  const [hlInput, setHlInput] = useState('')
  const [err, setErr] = useState('')

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const addHighlight = () => {
    if (!hlInput.trim()) return
    setForm(p => ({ ...p, highlights: [...p.highlights, hlInput.trim()] }))
    setHlInput('')
  }

  const removeHl = (i) => setForm(p => ({ ...p, highlights: p.highlights.filter((_, idx) => idx !== i) }))

  const handleSubmit = () => {
    if (!form.customerName.trim()) return setErr('Customer name is required.')
    if (!form.segmentId) return setErr('Please select a segment.')
    if (!form.application.trim()) return setErr('Application description is required.')
    setErr('')
    onSubmit(form)
  }

  const inputStyle = {
    width: '100%', padding: '9px 13px', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: '0.875rem', color: 'var(--slate)', outline: 'none',
    fontFamily: 'inherit', background: 'white', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--s6)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s5)' }}>
          <div>
            <div className="section-eyebrow">{isAdmin ? 'Admin — Add Reference' : 'Submit a Reference'}</div>
            <h3 style={{ margin: 0 }}>{isAdmin ? 'Add directly to Track Record' : 'Share an installation you know'}</h3>
            {!isAdmin && (
              <p style={{ fontSize: '0.8rem', color: 'var(--gray)', margin: '4px 0 0' }}>
                Your submission will be reviewed by admin before appearing publicly.
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
          {/* Customer */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>Customer Name *</label>
            <input style={inputStyle} value={form.customerName} onChange={e => f('customerName', e.target.value)} placeholder="e.g. Apollo Hospitals, Bengaluru" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>Organisation / Group</label>
            <input style={inputStyle} value={form.organisation} onChange={e => f('organisation', e.target.value)} placeholder="e.g. Apollo Hospitals Group" />
          </div>

          {/* Segment + Year */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>Segment *</label>
              <select style={inputStyle} value={form.segmentId} onChange={e => f('segmentId', e.target.value)}>
                <option value="">Select segment</option>
                {TR_SEGMENTS.filter(s => s.id !== 'all').map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>Installation Year</label>
              <input type="number" style={inputStyle} value={form.year} onChange={e => f('year', +e.target.value)} min={1990} max={2030} />
            </div>
          </div>

          {/* Location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--s3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>City</label>
              <input style={inputStyle} value={form.city} onChange={e => f('city', e.target.value)} placeholder="e.g. Bengaluru" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>State</label>
              <select style={inputStyle} value={form.state} onChange={e => f('state', e.target.value)}>
                <option value="">Select state</option>
                {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Installation details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--s3)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>kVA Rating</label>
              <input style={inputStyle} value={form.kvaRating} onChange={e => f('kvaRating', e.target.value)} placeholder="e.g. 500 kVA" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>No. of Sets</label>
              <input type="number" style={inputStyle} value={form.quantity} onChange={e => f('quantity', +e.target.value)} min={1} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>Product Line</label>
              <input style={inputStyle} value={form.productLine} onChange={e => f('productLine', e.target.value)} placeholder="e.g. KG 500" />
            </div>
          </div>

          {/* Application */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>Application / What it powers *</label>
            <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }}
              value={form.application} onChange={e => f('application', e.target.value)}
              placeholder="e.g. Critical ICU and OT backup, N+1 configuration — 500 bed hospital" />
          </div>

          {/* Highlights */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate)', marginBottom: 5 }}>
              Key Highlights <span style={{ fontWeight: 400, color: 'var(--gray)' }}>(optional — what makes this notable)</span>
            </label>
            {form.highlights.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
                <div style={{ width: 5, height: 5, background: 'var(--teal)', borderRadius: '50%', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--slate)' }}>{h}</span>
                <button onClick={() => removeHl(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', padding: 2 }}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 'var(--s2)', marginTop: 4 }}>
              <input style={{ ...inputStyle, flex: 1 }} value={hlInput} onChange={e => setHlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                placeholder="Add a highlight and press Enter" />
              <button className="btn btn--ghost btn--sm" onClick={addHighlight}>+ Add</button>
            </div>
          </div>

          {/* Error */}
          {err && <div style={{ color: '#dc2626', fontSize: '0.82rem', background: '#fee2e2', padding: '8px 12px', borderRadius: 8 }}>{err}</div>}

          {/* Submit */}
          <div style={{ display: 'flex', gap: 'var(--s3)', justifyContent: 'flex-end', paddingTop: 'var(--s2)' }}>
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" onClick={handleSubmit}>
              {isAdmin ? 'Add to Track Record' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TrackRecord() {
  const session   = AUTH_BYPASS ? BYPASS_SESSION : auth.getSession()
  const isAdmin   = session?.role === 'admin'

  const [localRefs, setLocalRefs] = useState(() => trackRefs.getAll())
  const [showForm, setShowForm]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Filters
  const [search,      setSearch]      = useState('')
  const [segFilter,   setSegFilter]   = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [showPending, setShowPending] = useState(false)

  // Merge verified seed + localStorage entries
  const allRefs = useMemo(() => {
    const local = showPending && isAdmin
      ? localRefs
      : localRefs.filter(r => r.status === 'approved')
    return [...VERIFIED_REFS, ...local]
  }, [localRefs, showPending, isAdmin])

  // Apply filters
  const filtered = useMemo(() => {
    return allRefs.filter(r => {
      if (segFilter !== 'all' && r.segmentId !== segFilter) return false
      if (stateFilter !== 'all' && r.state !== stateFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          r.customerName?.toLowerCase().includes(q) ||
          r.organisation?.toLowerCase().includes(q) ||
          r.application?.toLowerCase().includes(q) ||
          r.city?.toLowerCase().includes(q) ||
          r.state?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allRefs, segFilter, stateFilter, search])

  const pendingCount = localRefs.filter(r => r.status === 'pending').length

  const handleSubmit = (formData) => {
    if (isAdmin) {
      trackRefs.adminAdd({ ...formData, segment: TR_SEGMENTS.find(s => s.id === formData.segmentId)?.label || formData.segmentId })
    } else {
      trackRefs.submit({ ...formData, segment: TR_SEGMENTS.find(s => s.id === formData.segmentId)?.label || formData.segmentId })
    }
    setLocalRefs(trackRefs.getAll())
    setShowForm(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  const handleApprove = (id) => { trackRefs.approve(id); setLocalRefs(trackRefs.getAll()) }
  const handleReject  = (id) => { trackRefs.reject(id);  setLocalRefs(trackRefs.getAll()) }
  const handleRemove  = (id) => { trackRefs.remove(id);  setLocalRefs(trackRefs.getAll()) }

  // Stats
  const approvedTotal   = VERIFIED_REFS.length + localRefs.filter(r => r.status === 'approved').length
  const segmentsCovered = new Set(allRefs.map(r => r.segmentId)).size
  const statesCovered   = new Set(allRefs.map(r => r.state).filter(s => s && s !== 'Multiple' && s !== 'Pan-India')).size

  return (
    <div className="page-content" style={{ background: 'var(--off-white)' }}>
      <div className="container--wide">

        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 'var(--s6)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--s4)' }}>
            <div>
              <div className="section-eyebrow">KOEL Reference Database</div>
              <h2 style={{ margin: '0 0 var(--s2)' }}>Track Record</h2>
              <p style={{ color: 'var(--gray)', fontSize: '0.875rem', margin: 0 }}>
                Verified installations, community submissions, and field-verified proof points.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--s3)', alignItems: 'center', flexWrap: 'wrap' }}>
              {isAdmin && pendingCount > 0 && (
                <button
                  className={`btn btn--sm ${showPending ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setShowPending(p => !p)}
                  style={{ position: 'relative' }}
                >
                  {showPending ? 'Hide Pending' : 'Review Pending'}
                  <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pendingCount}
                  </span>
                </button>
              )}
              <button className="btn btn--primary btn--sm" onClick={() => setShowForm(true)}>
                + {isAdmin ? 'Add Reference' : 'Submit Reference'}
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 'var(--s4)', marginTop: 'var(--s5)', flexWrap: 'wrap' }}>
            {[
              { val: approvedTotal,   label: 'References' },
              { val: segmentsCovered, label: 'Segments covered' },
              { val: statesCovered,   label: 'States' },
              { val: '45,000+',       label: 'Telecom sites alone' },
            ].map(({ val, label }) => (
              <div key={label} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: 'var(--s3) var(--s5)', textAlign: 'center', minWidth: 100 }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--teal)' }}>{val}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Success toast ─────────────────────────────────────── */}
        {submitted && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: 'var(--s3) var(--s5)', marginBottom: 'var(--s5)', color: '#166534', fontSize: '0.875rem', fontWeight: 600 }}>
            {isAdmin ? '✓ Reference added to Track Record.' : '✓ Submitted for review. Admin will approve shortly.'}
          </div>
        )}

        {/* ── Search + filters ──────────────────────────────────── */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 'var(--s4) var(--s5)', marginBottom: 'var(--s5)', display: 'flex', gap: 'var(--s3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search customer, city, application…"
              style={{ width: '100%', padding: '9px 13px 9px 32px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.875rem', color: 'var(--slate)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <select value={segFilter} onChange={e => setSegFilter(e.target.value)}
            style={{ padding: '9px 13px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.875rem', color: 'var(--slate)', background: 'white', outline: 'none', cursor: 'pointer' }}>
            {TR_SEGMENTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>

          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
            style={{ padding: '9px 13px', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.875rem', color: 'var(--slate)', background: 'white', outline: 'none', cursor: 'pointer' }}>
            <option value="all">All States</option>
            {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {(search || segFilter !== 'all' || stateFilter !== 'all') && (
            <button className="btn btn--ghost btn--sm" onClick={() => { setSearch(''); setSegFilter('all'); setStateFilter('all') }}>
              Clear
            </button>
          )}

          <span style={{ fontSize: '0.8rem', color: 'var(--gray)', flexShrink: 0 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Admin: pending banner ─────────────────────────────── */}
        {isAdmin && showPending && pendingCount > 0 && (
          <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 12, padding: 'var(--s4) var(--s5)', marginBottom: 'var(--s5)' }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
              {pendingCount} submission{pendingCount !== 1 ? 's' : ''} awaiting review
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a16207' }}>
              Pending entries are shown below with a yellow border. Approve or reject each one.
            </div>
          </div>
        )}

        {/* ── Cards grid ────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--s12)', background: 'var(--white)', border: '1px dashed var(--border)', borderRadius: 14 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700, color: 'var(--slate)', marginBottom: 6 }}>No references found</div>
            <p style={{ fontSize: '0.84rem', color: 'var(--gray)', margin: '0 0 var(--s5)' }}>Try different filters, or be the first to add one for this segment.</p>
            <button className="btn btn--primary btn--sm" onClick={() => setShowForm(true)}>+ Submit a Reference</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--s4)' }}>
            {filtered.map(r => (
              <RefCard
                key={r.id}
                ref={r}
                isAdmin={isAdmin}
                onApprove={handleApprove}
                onReject={handleReject}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}

        {/* ── Community note ────────────────────────────────────── */}
        <div style={{ marginTop: 'var(--s8)', padding: 'var(--s5) var(--s6)', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', gap: 'var(--s5)', alignItems: 'flex-start' }}>
          <div style={{ width: 36, height: 36, background: 'var(--teal-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--slate)', marginBottom: 4 }}>Help build this database</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--gray)', margin: 0, lineHeight: 1.6 }}>
              Every reference you submit makes the next pitch stronger. Know a KOEL installation — hospital, factory, data centre, hotel?
              Submit it. Admin will verify and approve. Once live, it auto-populates into pitch briefs for that segment.
            </p>
          </div>
          <button className="btn btn--outline btn--sm" style={{ flexShrink: 0 }} onClick={() => setShowForm(true)}>
            Submit →
          </button>
        </div>

      </div>

      {/* ── Submit / Add Form modal ───────────────────────────── */}
      {showForm && (
        <RefForm
          isAdmin={isAdmin}
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
