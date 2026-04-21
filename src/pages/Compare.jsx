// Kirloskar Sales Pro — Compare page
// Uses shared CompareModule (Supabase-backed, full 7.5–1500 kVA range).
// Legacy JSON-file comparison data has been superseded by this Supabase-driven module.
import CompareModule from '../components/CompareModule'

export default function Compare() {
  return (
    <div className="page-content">
      <div className="container--wide">
        <CompareModule />
      </div>
    </div>
  )
}
