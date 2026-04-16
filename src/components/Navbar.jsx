import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { KOEL_RANGES } from '../data/koel'
import { auth, AUTH_BYPASS, repProfile } from '../lib/storage'

const BYPASS_SESSION = { name: 'Guest', role: 'rep', email: 'guest@koel' }

export default function Navbar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [session, setSession]           = useState(AUTH_BYPASS ? BYPASS_SESSION : auth.getSession())
  const [productsOpen, setProductsOpen] = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const productsRef = useRef(null)
  const profileRef  = useRef(null)

  // Refresh session on route change
  useEffect(() => {
    setSession(AUTH_BYPASS ? BYPASS_SESSION : auth.getSession())
  }, [location.pathname])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (productsRef.current && !productsRef.current.contains(e.target)) setProductsOpen(false)
      if (profileRef.current  && !profileRef.current.contains(e.target))  setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close both dropdowns on route change
  useEffect(() => {
    setProductsOpen(false)
    setProfileOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    auth.logout()
    setSession(null)
    setProfileOpen(false)
    navigate('/login')
  }

  const go = (path) => { setProfileOpen(false); navigate(path) }

  const initials = session
    ? session.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'KO'

  return (
    <nav className="navbar">
      <div className="navbar__inner">

        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <img src="/logo.jpg" alt="Kirloskar Oil Engines" />
          <div className="navbar__logo-divider" />
          <span className="navbar__logo-label">Sales Pro</span>
        </Link>

        {/* Nav links */}
        <div className="navbar__nav">

          {/* Products dropdown — click-based */}
          <div className="navbar__dropdown" ref={productsRef}>
            <button
              className="navbar__dropdown-toggle"
              onClick={() => setProductsOpen(p => !p)}
            >
              Products
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                style={{ transform: productsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {productsOpen && (
              <div className="navbar__dropdown-menu" style={{ display: 'block' }}>
                <div style={{ padding: '6px 14px 4px', fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Standard Range
                </div>
                {KOEL_RANGES.map(range => (
                  <div
                    key={range.id}
                    className="navbar__dropdown-item"
                    onClick={() => { setProductsOpen(false); navigate(`/range/${range.id}`) }}
                  >
                    <span className="navbar__dropdown-item-label">
                      {range.shortLabel} kVA
                    </span>
                    <span className="navbar__dropdown-item-sub">
                      {range.series ? `${range.series} · ` : ''}{range.models.length} models · CPCB {range.cpcb}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0', padding: '6px 14px 4px', fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  HHP Range
                </div>
                <div
                  className="navbar__dropdown-item"
                  onClick={() => { setProductsOpen(false); navigate('/optiprime') }}
                  style={{ borderLeft: '3px solid var(--teal)' }}
                >
                  <span className="navbar__dropdown-item-label" style={{ color: 'var(--teal)' }}>
                    Optiprime 117–2020 kVA
                  </span>
                  <span className="navbar__dropdown-item-sub">
                    7 models · Twin-pack · CPCB IV+
                  </span>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/compare"
            className={`navbar__link ${location.pathname === '/compare' ? 'navbar__link--active' : ''}`}
          >
            Competitor
          </Link>

          <Link
            to="/pitch"
            className={`navbar__link ${location.pathname.startsWith('/pitch') ? 'navbar__link--active' : ''}`}
          >
            Pitch
          </Link>

          <Link
            to="/segments"
            className={`navbar__link ${location.pathname.startsWith('/segments') ? 'navbar__link--active' : ''}`}
          >
            Segments
          </Link>

          <Link
            to="/track-record"
            className={`navbar__link ${location.pathname.startsWith('/track-record') ? 'navbar__link--active' : ''}`}
          >
            Track Record
          </Link>
        </div>

        <div className="navbar__spacer" />

        {/* Right: profile */}
        <div className="navbar__actions">
          <div className="navbar__profile" ref={profileRef}>
            <button
              className="navbar__profile-btn"
              onClick={() => setProfileOpen(p => !p)}
              title={session ? session.name : 'Account'}
            >
              {session ? initials : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
            </button>

            {profileOpen && (
              <div className="navbar__profile-menu" style={{ display: 'block' }}>
                {session ? (
                  <>
                    <div className="navbar__profile-header">
                      <div className="navbar__profile-name">{repProfile.get()?.name || session.name}</div>
                      {repProfile.get()?.designation && (
                        <div className="navbar__profile-role" style={{ fontWeight: 600, color: 'var(--slate)', fontSize: '0.8rem' }}>
                          {repProfile.get().designation}
                        </div>
                      )}
                      <div className="navbar__profile-role">
                        {repProfile.get()?.region ? `${repProfile.get().region} · ` : ''}
                        {session.role === 'admin' ? 'Admin' : 'Sales Rep'}
                      </div>
                      <div style={{ marginTop: 4, fontSize: '0.7rem', color: 'var(--muted)' }}>{session.email}</div>
                    </div>

                    <div className="navbar__profile-item" onClick={() => go('/profile')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                      My Profile
                    </div>

                    <div className="navbar__profile-item" onClick={() => go('/starred')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Starred Comparisons
                    </div>

                    <div className="navbar__profile-item" onClick={() => go('/settings')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      {session.role === 'admin' ? 'Pricing & Settings' : 'View Pricing'}
                    </div>

                    <div className="navbar__profile-item navbar__profile-item--danger" onClick={handleLogout}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Logout
                    </div>
                  </>
                ) : (
                  <>
                    <div className="navbar__profile-header">
                      <div className="navbar__profile-name">Not signed in</div>
                      <div className="navbar__profile-role">Session expired — please log in again</div>
                    </div>
                    <div className="navbar__profile-item" onClick={() => go('/login')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                      Login
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
