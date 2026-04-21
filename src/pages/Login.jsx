import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/storage'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function Login() {
  const navigate   = useNavigate()
  const [tab,      setTab]      = useState('bd')   // 'bd' | 'sales'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (tab === 'bd') {
      // ── BD Center: Supabase only ──────────────────────────────────────
      if (!isSupabaseConfigured || !supabase) {
        setError('BD Center login is not configured. Contact your admin.')
        setLoading(false)
        return
      }
      try {
        const { error: sbErr } = await supabase.auth.signInWithPassword({ email, password })
        if (sbErr) {
          setError('Invalid email or password. Use your BD Center team account.')
          setLoading(false)
        } else {
          navigate('/', { replace: true })
        }
      } catch (err) {
        setError('Login failed. Check your connection and try again.')
        setLoading(false)
      }
    } else {
      // ── Sales Pro: legacy hardcoded users ─────────────────────────────
      setTimeout(() => {
        const result = auth.login(email, password)
        if (result.error) {
          setError('Invalid email or password. Use your Sales Pro credentials.')
          setLoading(false)
        } else {
          navigate('/', { replace: true })
        }
      }, 300)
    }
  }

  const accent = tab === 'bd' ? '#7c3aed' : '#007B7F'

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 420 }}>
        {/* Logo + title */}
        <div className="login-card__header">
          <img src="/logo.jpg" alt="Kirloskar" />
          <h2>Kirloskar Sales Platform</h2>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', margin: '0 0 24px' }}>
          {[
            { id: 'bd',    label: 'BD Center',  color: '#7c3aed', hint: 'Team Supabase account' },
            { id: 'sales', label: 'Sales Pro',   color: '#007B7F', hint: 'Field rep credentials' },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setError('') }} style={{
              flex: 1, padding: '10px 0', fontSize: '0.78rem', fontWeight: 700,
              color: tab === t.id ? t.color : '#94a3b8',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
              marginBottom: -1, fontFamily: 'inherit', transition: 'color 150ms',
            }}>
              {t.label}
              <div style={{ fontSize: '0.58rem', fontWeight: 400, color: '#94a3b8', marginTop: 2 }}>{t.hint}</div>
            </button>
          ))}
        </div>

        <div className="login-card__body" style={{ paddingTop: 0 }}>
          {error && (
            <div style={{ padding: '9px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.78rem', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                placeholder={tab === 'bd' ? 'you@company.com' : 'rep@kirloskar.com'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '10px 0', borderRadius: 8,
                background: loading ? '#e2e8f0' : accent,
                color: loading ? '#94a3b8' : 'white',
                border: 'none', fontSize: '0.85rem', fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                fontFamily: 'inherit', marginTop: 8, transition: 'background 150ms',
              }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : `Sign in to ${tab === 'bd' ? 'BD Center' : 'Sales Pro'}`}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
            {tab === 'bd'
              ? 'BD Center accounts are created by your admin in Supabase dashboard.'
              : 'Sales Pro credentials — contact your manager if you need access.'}
          </p>
        </div>
      </div>
    </div>
  )
}
