import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
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
import { auth, AUTH_BYPASS } from './lib/storage'

const BYPASS_SESSION = { name: 'Guest', role: 'rep', email: 'guest@koel' }

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Layout for all authenticated routes — checks session on every render
function ProtectedLayout() {
  const session = AUTH_BYPASS ? BYPASS_SESSION : auth.getSession()
  if (!session) return <Navigate to="/login" replace />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
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
          <Route path="/"               element={<Home />} />
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
