import { useNavigate } from 'react-router-dom'
import Badge from './Badge'

export default function ProductCard({ range }) {
  const navigate = useNavigate()

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/range/${range.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/range/${range.id}`)}
    >
      <div className="product-card__image-wrap">
        <img
          src={range.image}
          alt={`KOEL ${range.label} genset`}
          loading="lazy"
        />
        <div className="product-card__badges">
          <Badge type="teal">CPCB {range.cpcb}</Badge>
          {range.series && <Badge type="gray">{range.series}</Badge>}
          {range.isHot && <Badge type="hot">🔥 Hot Seller</Badge>}
        </div>
      </div>
      <div className="product-card__body">
        <div className="product-card__range font-mono">{range.shortLabel} kVA</div>
        <div className="product-card__series">{range.series ? `${range.series} · ` : ''}{range.models.length} models</div>
        <div className="product-card__meta">
          <span className="product-card__meta-item">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {range.governingClass}
          </span>
          <span className="product-card__meta-item">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L2 14h12L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            {range.voltage.includes('1Ø') ? '1Ø / 3Ø' : '3Ø'}
          </span>
          <span className="product-card__meta-item text-xs">
            {range.batteryVoltage}
          </span>
        </div>
        <div className="product-card__footer">
          <span className="product-card__model-count">
            {range.models[0].kva} – {range.models[range.models.length - 1].kva} kVA
          </span>
          <span className="product-card__cta">
            View Range
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}
