import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { starred } from '../lib/storage'

export default function Starred() {
  const navigate = useNavigate()
  const [items, setItems] = useState(starred.getAll())

  const handleRemove = (id) => {
    starred.remove(id)
    setItems(starred.getAll())
  }

  const handleOpen = (item) => {
    navigate(`/compare?koel=${encodeURIComponent(item.koelModel)}&brand=${encodeURIComponent(item.competitorBrand)}&model=${encodeURIComponent(item.competitorModel)}`)
  }

  const formatDate = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="page-content">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Saved</div>
          <h2>Starred Comparisons</h2>
          <p>Comparisons you've saved for quick access during sales meetings.</p>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">⭐</div>
            <h3>No saved comparisons yet</h3>
            <p>Star a comparison from the Compare page and it'll appear here.</p>
            <button className="btn btn--primary" style={{ marginTop: 'var(--s5)' }} onClick={() => navigate('/compare')}>
              Open Comparator
            </button>
          </div>
        ) : (
          <div>
            {items.map(item => (
              <div key={item.id} className="starred-item">
                <div className="starred-item__icon">⭐</div>
                <div className="starred-item__text">
                  <div className="starred-item__title">
                    {item.koelModel}
                    <span style={{ color: 'var(--gray)', fontWeight: 400, margin: '0 8px' }}>vs</span>
                    {item.competitorModel}
                    <span style={{ color: 'var(--gray)', fontWeight: 400, fontSize: '0.85rem', marginLeft: 6 }}>({item.competitorBrand})</span>
                  </div>
                  <div className="starred-item__sub">Saved on {formatDate(item.savedAt)}</div>
                </div>
                <div className="starred-item__actions">
                  <button className="btn btn--primary btn--sm" onClick={() => handleOpen(item)}>Open</button>
                  <button className="btn btn--ghost btn--sm" onClick={() => handleRemove(item.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
