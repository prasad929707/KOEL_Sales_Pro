import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/storage'

export default function Login() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      const result = auth.login(email, password)
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else {
        navigate('/', { replace: true })
      }
    }, 350)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <img src="/logo.jpg" alt="Kirloskar" />
          <h2>Sales Portal</h2>
          <p>Sign in to access the Genset Builder</p>
        </div>
        <div className="login-card__body">
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="you@kirloskar.com"
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
              className="btn btn--primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--s2)' }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <p style={{ marginTop: 'var(--s5)', fontSize: '0.8rem', color: 'var(--gray)', textAlign: 'center' }}>
            Access restricted to authorised KOEL personnel only.
          </p>
        </div>
      </div>
    </div>
  )
}
