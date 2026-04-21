import { useEffect, useState, Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'

// Catches any render crash and shows the error instead of blank white page
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, fontFamily: 'monospace', color: '#dc2626', background: '#fef2f2', minHeight: '50vh' }}>
        <strong>Render error — check browser console for full trace</strong>
        <pre style={{ marginTop: 16, fontSize: 12, whiteSpace: 'pre-wrap', color: '#7f1d1d' }}>
          {this.state.error?.message}
          {'\n\n'}
          {this.state.error?.stack}
        </pre>
        <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: '6px 16px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    )
    return this.props.children
  }
}
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import ProductRange from './pages/ProductRange'
import Compare from './pages/Compare'
import Login from './pages/Login'
import Starred from './pages/Starred'
import Settings from './pages/Settings'
import Optiprime from './pages/Optiprime'
import OptiprimeModel from './pages/OptiprimeModel'
import DemoProductPage from './pages/DemoProductPage'
import DemoProductRange from './pages/DemoProductRange'
import PitchPlaceholder from './pages/PitchPlaceholder'
import PitchBuilder from './pages/PitchBuilder'
import PitchOutput from './pages/PitchOutput'
import SegmentsPlaceholder from './pages/SegmentsPlaceholder'
import TrackRecord from './pages/TrackRecord'
import Profile from './pages/Profile'
import PlatformHome from './pages/PlatformHome'
import Opportunities from './pages/Opportunities'
import BDCenter from './pages/BDCenter'
import LeadDetail from './pages/LeadDetail'
import VisionLab from './pages/VisionLab'
import { auth, AUTH_BYPASS } from './lib/storage'
import { supabase, isSupabaseConfigured } from './lib/supabase'

const BYPASS_SESSION = { name: 'Guest', role: 'rep', email: 'guest@koel' }

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Layout for all authenticated routes — checks session on every render.
// Navbar is hidden on the platform homepage (/) — it's a launcher, no chrome.
function ProtectedLayout() {
  const [sbSession, setSbSession] = useState(null)
  const [sbChecked, setSbChecked] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setSbChecked(true); return }
    supabase.auth.getSession()
      .then(({ data }) => setSbSession(data?.session ?? null))
      .catch(() => {})
      .finally(() => setSbChecked(true))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSbSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const legacySession = AUTH_BYPASS ? BYPASS_SESSION : auth.getSession()
  const location = useLocation()

  // Wait for Supabase check before redirecting
  if (!sbChecked) return null

  const hasSession = AUTH_BYPASS || legacySession || sbSession
  if (!hasSession) return <Navigate to="/login" replace />
  const hideNavbar = location.pathname === '/' || location.pathname.startsWith('/bd-center')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!hideNavbar && <Navbar />}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// BD Center requires a Supabase session (not just legacy Sales Pro login).
// Shows a clear prompt rather than silently failing with RLS errors.
function BDCenterGuard() {
  const [sbSession, setSbSession] = useState(null)
  const [checked,   setChecked]   = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Safety: supabase client could be null if env vars missing/malformed
    if (!supabase) { setChecked(true); return }

    supabase.auth.getSession()
      .then(({ data }) => { setSbSession(data?.session ?? null) })
      .catch(() => {})
      .finally(() => setChecked(true))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSbSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Show nothing while checking (avoids flash)
  if (!checked) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Loading BD Center…</div>
    </div>
  )

  if (!sbSession) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <div style={{ fontSize: '1.8rem' }}>🔒</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>BD Center requires a team account</div>
      <div style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
        You're logged in to Sales Pro but BD Center uses a separate team login.
        Sign in with your BD Center email to continue.
      </div>
      <button
        onClick={() => navigate('/login')}
        style={{ marginTop: 8, padding: '9px 24px', borderRadius: 8, background: '#7c3aed', color: 'white', border: 'none', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Sign in with team account
      </button>
    </div>
  )

  return <BDCenter />
}

// Same Supabase guard but renders LeadDetail at /bd-center/lead/:id
function BDLeadDetailGuard() {
  const [sbSession, setSbSession] = useState(null)
  const [checked,   setChecked]   = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!supabase) { setChecked(true); return }
    supabase.auth.getSession()
      .then(({ data }) => { setSbSession(data?.session ?? null) })
      .catch(() => {})
      .finally(() => setChecked(true))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSbSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (!checked) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Loading…</div>
    </div>
  )

  if (!sbSession) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <div style={{ fontSize: '1.8rem' }}>🔒</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>BD Center requires a team account</div>
      <button onClick={() => navigate('/login')}
        style={{ padding: '9px 24px', borderRadius: 8, background: '#7c3aed', color: 'white', border: 'none', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        Sign in with team account
      </button>
    </div>
  )

  return <LeadDetail />
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Demo (old standalone) — kept for reference */}
        <Route path="/demo-standalone" element={<DemoProductPage />} />

        {/* Login — standalone, no navbar/footer */}
        <Route path="/login" element={<Login />} />

        {/* All other routes — require auth */}
        <Route element={<ProtectedLayout />}>
          {/* Platform launcher — root */}
          <Route path="/"               element={<PlatformHome />} />
          {/* Opportunities — project-level demand × GOEM coverage */}
          <Route path="/opportunities"  element={<Opportunities />} />
          {/* BD Center — Supabase-authenticated CRM */}
          <Route path="/bd-center"            element={<ErrorBoundary><BDCenterGuard /></ErrorBoundary>} />
          <Route path="/bd-center/lead/:id"   element={<ErrorBoundary><BDLeadDetailGuard /></ErrorBoundary>} />
          {/* Vision Lab — path to 2B2B, strategic segment view */}
          <Route path="/vision-lab"     element={<VisionLab />} />
          {/* Old Marksight route → redirect to Opportunities for any stale bookmarks */}
          <Route path="/marksight"      element={<Navigate to="/opportunities" replace />} />
          {/* Sales Pro — field sales tool */}
          <Route path="/sales-pro"      element={<Home />} />
          <Route path="/range/:rangeId"      element={<ProductRange />} />
          <Route path="/optiprime"           element={<Optiprime />} />
          <Route path="/optiprime/:modelId"  element={<OptiprimeModel />} />
          <Route path="/compare"             element={<Compare />} />
          <Route path="/starred"             element={<Starred />} />
          <Route path="/settings"            element={<Settings />} />
          <Route path="/demo"                element={<DemoProductRange />} />
          <Route path="/demo/:rangeId"       element={<DemoProductRange />} />
          <Route path="/profile"             element={<Profile />} />
          <Route path="/pitch"               element={<PitchBuilder />} />
          <Route path="/pitch/output"        element={<PitchOutput />} />
          <Route path="/segments"            element={<SegmentsPlaceholder />} />
          <Route path="/track-record"        element={<TrackRecord />} />
          <Route path="*"              element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
