// Track Record — under construction
// Will become: searchable/filterable reference database, embedded in pitch and standalone

export default function TrackRecordPlaceholder() {
  return (
    <div className="container" style={{ padding: 'var(--s16) var(--s4)', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', background: 'var(--teal)', color: 'white',
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', padding: '3px 12px', borderRadius: 4, marginBottom: 'var(--s5)',
      }}>
        Under Development
      </div>
      <h1 style={{ fontSize: '2.2rem', marginBottom: 'var(--s4)' }}>Track Record</h1>
      <p style={{ color: 'var(--gray)', maxWidth: 520, margin: '0 auto var(--s6)', lineHeight: 1.7 }}>
        KOEL's reference database — searchable by segment, state, kVA range, and product. The proof points reps actually use in meetings. Embedded automatically in every pitch.
      </p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--s4)', maxWidth: 760, margin: '0 auto', marginTop: 'var(--s8)',
      }}>
        {[
          { label: 'References being compiled', desc: 'Across all 12 segments, verified with field reps' },
          { label: 'Searchable by location', desc: 'Filter by state and city — closest reference to your customer' },
          { label: 'Auto-embedded in Pitch', desc: 'Pitch Builder pulls the best references automatically' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: 'var(--s6)', background: 'var(--off-white)',
            borderRadius: 12, textAlign: 'left', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--s3)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontWeight: 700, color: 'var(--slate)', marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--gray)', lineHeight: 1.55 }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
