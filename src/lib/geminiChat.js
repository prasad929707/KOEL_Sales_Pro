// ─────────────────────────────────────────────────────────────────────────────
// Gemini Chat — browser-side helper
//
// Calls /.netlify/functions/gemini-chat (works on Netlify prod + `netlify dev`)
// If the function is unreachable (local dev without netlify dev), returns null
// so the caller can fall back to rule-based responses.
// ─────────────────────────────────────────────────────────────────────────────

const FUNCTION_URL = '/.netlify/functions/gemini-chat'

/**
 * Send a message to Gemini via the Netlify function.
 *
 * @param {string}   message   - The user's message text
 * @param {Array}    history   - [{role:'user'|'model', text}] — previous turns
 * @param {object}   context   - Brief context: segment, products, concerns, etc.
 * @returns {Promise<string|null>} - AI response text, or null if unavailable
 */
export async function askGemini(message, history = [], context = null) {
  try {
    const res = await fetch(FUNCTION_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, history, context }),
    })

    if (!res.ok) {
      // 404 in local dev without netlify dev — not an error, just unavailable
      if (res.status === 404) return null
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    const data = await res.json()
    return data.text || null

  } catch (err) {
    // Network error = function not available (local dev) — return null for fallback
    if (err instanceof TypeError && err.message.includes('fetch')) return null
    // Real error from the function
    console.warn('Gemini chat error:', err.message)
    return null
  }
}

/**
 * Build context object from PitchBuilder state for Gemini.
 */
export function buildPitchContext(customer, gensets, concerns, commercialTerms) {
  return {
    customerName:       customer.name,
    segment:            customer.segmentId,
    segmentId:          customer.segmentId,
    city:               customer.city,
    district:           customer.district,
    state:              customer.state,
    concerns:           concerns?.text || '',
    selectedChallenges: concerns?.selected || [],
    commercialTerms:    commercialTerms || {},
    products: gensets
      .filter(g => g.selectedProduct)
      .map(g => ({
        kva:        g.selectedProduct.kva,
        kw:         g.selectedProduct.kw,
        model:      g.selectedProduct.model || g.selectedProduct.id,
        loadingPct: g.selectedProduct.loadingPct,
        isOptiprime:g.selectedProduct.isOptiprime,
      })),
  }
}
