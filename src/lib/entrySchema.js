// ─────────────────────────────────────────────────────────────────────────────
// Entry schema — the contract every number in this app obeys.
//
// Rule: if it's a number the user sees, it lives in a JSON file as an Entry.
// Never a literal in a component. This is non-negotiable — see SPINE §2.
//
// An Entry:
// {
//   value:       number | string | null,      // null = "Needs data"
//   unit:        string,                       // "₹ Cr", "units", "%", "kVA", "MW"
//   source:      string,                       // human-readable source
//   sourceUrl:   string | null,                // local PDF path or URL (optional)
//   confidence:  'high' | 'medium' | 'low',    // high = disclosed / audited
//   lastUpdated: string,                       // ISO date "YYYY-MM-DD"
//   notes:       string | null,                // caveats, methodology, flags
// }
//
// End-state: `/_inputs_template.xlsx` is a workbook where each sheet is one
// JSON file here, each row is one Entry. Upload → SheetJS parses → JSONs
// overwrite → every figure in the app refreshes. Keep the shape flat and
// tabular so that mapping stays 1:1.
// ─────────────────────────────────────────────────────────────────────────────

export const CONFIDENCE_LEVELS = ['high', 'medium', 'low']

// Confidence badge colors (match brand: teal = high, amber = medium, red = low)
export const CONFIDENCE_STYLES = {
  high:   { bg: 'rgba(0,123,127,0.10)',  fg: '#007B7F', label: 'HIGH' },
  medium: { bg: 'rgba(232,119,34,0.10)', fg: '#E87722', label: 'MED'  },
  low:    { bg: 'rgba(220,38,38,0.10)',  fg: '#DC2626', label: 'LOW'  },
}

// Build a well-formed Entry. Used by tests + future Excel import code.
// Throws on invalid input — that's intentional. Bad data should never
// silently become a rendered figure.
export function makeEntry({
  value       = null,
  unit        = '',
  source      = '',
  sourceUrl   = null,
  confidence  = 'low',
  lastUpdated = '',
  notes       = null,
}) {
  if (!CONFIDENCE_LEVELS.includes(confidence)) {
    throw new Error(`Entry: invalid confidence "${confidence}"`)
  }
  if (value !== null && typeof value !== 'number' && typeof value !== 'string') {
    throw new Error(`Entry: value must be number | string | null`)
  }
  return { value, unit, source, sourceUrl, confidence, lastUpdated, notes }
}

// Sentinel for "we don't have this yet". Renders as "Needs data" in the UI.
export const NEEDS_DATA = makeEntry({
  value: null, unit: '', source: 'Needs data', confidence: 'low',
  lastUpdated: '', notes: 'No source yet — flag before presenting.',
})

// Is an Entry ready to present? (has value + source + any confidence)
export function isReady(entry) {
  return !!(entry && entry.value !== null && entry.source && entry.source !== 'Needs data')
}

// Pretty-format the value for display. Handles ₹ Cr, %, and plain numbers.
// Does NOT inject the unit — <Figure /> does that.
export function formatValue(entry) {
  if (!entry || entry.value === null || entry.value === undefined) return '—'
  const v = entry.value
  if (typeof v === 'string') return v
  // Integers → no decimal. Floats → 1-2 decimals based on magnitude.
  if (Number.isInteger(v)) return v.toLocaleString('en-IN')
  if (Math.abs(v) >= 100)  return v.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  if (Math.abs(v) >= 10)   return v.toLocaleString('en-IN', { maximumFractionDigits: 1 })
  return v.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}
