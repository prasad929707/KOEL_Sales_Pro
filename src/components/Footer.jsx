export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__inner">
          <div className="footer__brand">
            <img src="/logo.jpg" alt="Kirloskar" />
            <div className="footer__brand-text">
              <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.875rem' }}>
                Kirloskar Oil Engines Ltd
              </div>
              <div style={{ fontSize: '0.75rem' }}>Genset Builder | Internal Sales Tool</div>
            </div>
          </div>
          <div className="footer__links">
            <span className="footer__link">CPCB IV+ Compliant</span>
            <span className="footer__link">·</span>
            <span className="footer__link">Prototype v1.0</span>
            <span className="footer__link">·</span>
            <span className="footer__link">Confidential</span>
          </div>
        </div>
        <div className="footer__copy">
          © {new Date().getFullYear()} Kirloskar Oil Engines Limited. Internal use only. Not for external distribution..
          All specifications from official CPCB IV+ datasheets.
        </div>
      </div>
    </footer>
  )
}
