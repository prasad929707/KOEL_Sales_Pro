// Pitch Builder — under construction
// Will become the full pitch builder with block load form, product selection, chatbot, and pitch output

export default function PitchPlaceholder() {
  return (
    <div className="container" style={{ padding: 'var(--s16) var(--s4)', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', background: 'var(--teal)', color: 'white',
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', padding: '3px 12px', borderRadius: 4, marginBottom: 'var(--s5)',
      }}>
        Under Development
      </div>
      <h1 style={{ fontSize: '2.2rem', marginBottom: 'var(--s4)' }}>Pitch Builder</h1>
      <p style={{ color: 'var(--gray)', maxWidth: 520, margin: '0 auto var(--s6)', lineHeight: 1.7 }}>
        Enter block load, select product rating, add customer context — get a structured, customer-ready pitch with live TCO calculator, references, and competitor talking points.
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--s4)', maxWidth: 720, margin: '0 auto', marginTop: 'var(--s8)',
      }}>
        {[
          { step: '01', label: 'Block load input', desc: 'Size the genset correctly from actual load' },
          { step: '02', label: 'Product selection', desc: 'KOEL products that match, with Optiprime option' },
          { step: '03', label: 'Customer pitch', desc: 'TCO calculator, references, next steps' },
        ].map(s => (
          <div key={s.step} style={{
            padding: 'var(--s6)', background: 'var(--off-white)',
            borderRadius: 12, textAlign: 'left', border: '1px solid var(--border)',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 700, marginBottom: 8 }}>{s.step}</div>
            <div style={{ fontWeight: 700, color: 'var(--slate)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray)', lineHeight: 1.55 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
