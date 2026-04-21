// ─────────────────────────────────────────────────────────────────────────────
// AdminPanel — Team & Access Management
// Only visible to super_admin and admin roles.
//
// Features:
//   • List all team members (from profiles table)
//   • Change role  (super_admin | admin | user)
//   • Assign segments  (multi-select — which segments a user works on)
//   • Invite new member  (sends Supabase auth email)
//   • Quick stats strip
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import {
  fetchAllProfiles, updateProfile, inviteUser,
  ALL_SEGMENTS, ROLES, roleCfg, isAdminRole,
} from '../lib/userProfiles'

// ── Segment multi-select popover ──────────────────────────────────────────────
function SegmentPicker({ value = [], onChange, disabled = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function toggle(seg) {
    onChange(value.includes(seg) ? value.filter(s => s !== seg) : [...value, seg])
  }

  const allSelected = value.length === ALL_SEGMENTS.length

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.65rem', fontWeight: 600,
          color: disabled ? '#94a3b8' : '#334155',
          background: open ? 'var(--off-white)' : 'var(--white)',
          border: `1px solid ${open ? '#7c3aed' : 'var(--border)'}`,
          padding: '4px 10px', borderRadius: 7, cursor: disabled ? 'default' : 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}
      >
        {value.length === 0
          ? 'No segments'
          : allSelected
            ? 'All segments'
            : `${value.length} segment${value.length > 1 ? 's' : ''}`
        }
        {!disabled && <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>▾</span>}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 200,
          background: 'var(--white)', border: '1px solid var(--border)',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '8px 0', minWidth: 200, marginTop: 4,
        }}>
          {/* Select / deselect all */}
          <button
            onClick={() => onChange(allSelected ? [] : [...ALL_SEGMENTS])}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              fontSize: '0.63rem', fontWeight: 700,
              color: '#7c3aed', background: 'transparent',
              border: 'none', borderBottom: '1px solid var(--border)',
              padding: '5px 14px 8px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
          {ALL_SEGMENTS.map(seg => (
            <label
              key={seg}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '6px 14px', cursor: 'pointer',
                fontSize: '0.72rem', color: '#334155',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <input
                type="checkbox"
                checked={value.includes(seg)}
                onChange={() => toggle(seg)}
                style={{ width: 13, height: 13, accentColor: '#7c3aed', flexShrink: 0 }}
              />
              {seg}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = roleCfg(role)
  return (
    <span style={{
      fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em',
      color: cfg.color, background: cfg.bg,
      padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

// ── Role selector dropdown ────────────────────────────────────────────────────
function RoleSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{
        fontSize: '0.65rem', fontWeight: 600,
        color: roleCfg(value).color,
        background: roleCfg(value).bg,
        border: `1px solid ${roleCfg(value).color}44`,
        padding: '3px 8px', borderRadius: 7,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit', appearance: 'none',
        WebkitAppearance: 'none', paddingRight: 20,
      }}
    >
      {ROLES.map(r => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  )
}

// ── Invite modal ──────────────────────────────────────────────────────────────
function InviteModal({ onClose, onDone }) {
  const [email,  setEmail]  = useState('')
  const [name,   setName]   = useState('')
  const [status, setStatus] = useState('idle') // idle|loading|done|error
  const [errMsg, setErrMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    const { error } = await inviteUser(email.trim(), name.trim())
    if (error) {
      setErrMsg(error.message || 'Invite failed')
      setStatus('error')
    } else {
      setStatus('done')
      setTimeout(() => { onDone(); onClose() }, 1500)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--white)', borderRadius: 14, padding: '28px 32px',
        maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--slate)' }}>Invite team member</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1rem', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>

        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>✉️</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>Invite sent!</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 5 }}>
              {email} will receive a sign-up link.
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            {status === 'error' && (
              <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: '0.72rem', color: '#dc2626', marginBottom: 14 }}>
                {errMsg}
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                Name
              </label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Full name"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>
                Email *
              </label>
              <input
                type="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="team@kirloskar.com"
                autoFocus
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
            <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
              They'll receive an email with a link to set their password and join BD Center.
              You can assign their role and segments after they sign up.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose}
                style={{ fontSize: '0.7rem', color: '#64748b', background: 'transparent', border: '1px solid var(--border)', padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button type="submit" disabled={status === 'loading'}
                style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white',
                  background: status === 'loading' ? '#94a3b8' : '#7c3aed',
                  border: 'none', padding: '7px 20px', borderRadius: 8,
                  cursor: status === 'loading' ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {status === 'loading' ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Main AdminPanel component ─────────────────────────────────────────────────
export default function AdminPanel({ myProfile }) {
  const [profiles,     setProfiles]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [saving,       setSaving]       = useState({}) // { [id]: true }
  const [showInvite,   setShowInvite]   = useState(false)
  const [successId,    setSuccessId]    = useState(null) // flash green checkmark

  const isSuperAdmin = myProfile?.role === 'super_admin'

  useEffect(() => {
    setLoading(true)
    fetchAllProfiles()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setProfiles(data)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleUpdate(id, patch) {
    setSaving(s => ({ ...s, [id]: true }))
    const { data, error } = await updateProfile(id, patch)
    if (error) {
      alert('Save failed: ' + error.message)
    } else if (data) {
      setProfiles(ps => ps.map(p => p.id === id ? data : p))
      setSuccessId(id)
      setTimeout(() => setSuccessId(null), 2000)
    }
    setSaving(s => { const n = { ...s }; delete n[id]; return n })
  }

  // Stats
  const adminCount  = profiles.filter(p => isAdminRole(p.role)).length
  const activeCount = profiles.length

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: '0.82rem' }}>
      Loading team…
    </div>
  )

  if (error) return (
    <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#dc2626', fontSize: '0.82rem' }}>
      {error}
      <div style={{ marginTop: 6, fontSize: '0.7rem', color: '#64748b' }}>
        Make sure you've run the supabase_setup.sql script in your Supabase SQL editor.
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--slate)', letterSpacing: '-0.01em' }}>
            Team Management
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>
            Manage roles and segment access for your BD team
          </div>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 18px', borderRadius: 9,
            background: '#7c3aed', color: 'white',
            border: 'none', fontSize: '0.75rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 8h-8M8 4v8"/>
          </svg>
          Invite member
        </button>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
        marginBottom: 24,
      }}>
        {[
          { label: 'Team members',   value: activeCount,               color: '#7c3aed' },
          { label: 'Admins',         value: adminCount,                 color: '#2563eb' },
          { label: 'Regular members',value: activeCount - adminCount,   color: '#475569' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--white)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 18px',
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Profiles table */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>

        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1.6fr auto',
          gap: 16, padding: '9px 20px',
          background: '#f8fafc', borderBottom: '2px solid var(--border)',
        }}>
          {['Member', 'Role', 'Assigned Segments', ''].map(h => (
            <div key={h} style={{ fontSize: '0.58rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
              {h}
            </div>
          ))}
        </div>

        {profiles.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.78rem' }}>
            No team members yet. Invite someone to get started.
          </div>
        )}

        {profiles.map((p, i) => {
          const isMe = p.id === myProfile?.id
          const canEdit = isSuperAdmin || (myProfile?.role === 'admin' && p.role !== 'super_admin')
          const isSavingThis = !!saving[p.id]
          const saved = successId === p.id

          return (
            <div
              key={p.id}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1.6fr auto',
                gap: 16, padding: '14px 20px', alignItems: 'center',
                background: isMe ? 'rgba(124,58,237,0.03)' : i % 2 === 1 ? 'rgba(248,250,252,0.7)' : 'var(--white)',
                borderBottom: i < profiles.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 100ms',
              }}
            >
              {/* Member info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: `${roleCfg(p.role).color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.78rem', fontWeight: 800, color: roleCfg(p.role).color,
                }}>
                  {(p.name || p.email || '?').slice(0, 1).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name || '—'}
                    </div>
                    {isMe && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#7c3aed', background: 'rgba(124,58,237,0.1)', padding: '1px 6px', borderRadius: 99 }}>You</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.63rem', color: '#94a3b8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.email}
                    {p.designation && ` · ${p.designation}`}
                  </div>
                </div>
              </div>

              {/* Role */}
              <div>
                {canEdit && !isMe ? (
                  <RoleSelect
                    value={p.role}
                    disabled={isSavingThis}
                    onChange={role => handleUpdate(p.id, { role })}
                  />
                ) : (
                  <RoleBadge role={p.role} />
                )}
              </div>

              {/* Assigned segments */}
              <div>
                {canEdit ? (
                  <SegmentPicker
                    value={p.assignedSegments}
                    disabled={isSavingThis}
                    onChange={segs => handleUpdate(p.id, { assignedSegments: segs })}
                  />
                ) : (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.assignedSegments.length === 0 ? (
                      <span style={{ fontSize: '0.63rem', color: '#94a3b8', fontStyle: 'italic' }}>None assigned</span>
                    ) : p.assignedSegments.length === ALL_SEGMENTS.length ? (
                      <span style={{ fontSize: '0.63rem', color: '#64748b', fontWeight: 600 }}>All segments</span>
                    ) : (
                      p.assignedSegments.slice(0, 3).map(seg => (
                        <span key={seg} style={{
                          fontSize: '0.58rem', fontWeight: 600,
                          color: '#475569', background: 'rgba(71,85,105,0.08)',
                          padding: '1px 7px', borderRadius: 99,
                        }}>{seg}</span>
                      ))
                    )}
                    {p.assignedSegments.length > 3 && (
                      <span style={{ fontSize: '0.58rem', color: '#94a3b8' }}>+{p.assignedSegments.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Save indicator */}
              <div style={{ width: 20, textAlign: 'center' }}>
                {isSavingThis ? (
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>…</span>
                ) : saved ? (
                  <span style={{ fontSize: '0.82rem', color: '#16a34a' }}>✓</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div style={{ marginTop: 12, fontSize: '0.62rem', color: '#94a3b8', lineHeight: 1.7 }}>
        <strong>Roles:</strong> Super Admin can change anyone's role. Admin can manage Members.
        Members can only see and edit leads in their assigned segments (if no segments assigned, they see all).
        Changes save immediately.
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onDone={() => {
            // Reload profiles after invite
            fetchAllProfiles().then(({ data }) => data && setProfiles(data))
          }}
        />
      )}
    </div>
  )
}
