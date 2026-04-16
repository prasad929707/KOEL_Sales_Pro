// ─────────────────────────────────────────────────────────────────────────────
// INDIA CITY DATA — for genset deration calculations
//
// Data source: 94,240-city Kaggle dataset processed into compact tuple JSON.
// Format: [location, district, state, temp_C, alt_m]
// File:   /public/india-cities.json  (4 MB, lazy-fetched on first search)
//
// maxAmbientTemp : Peak ambient temperature (°C) — design condition per IS 10001.
//                  KOEL standard rating is at 40°C; above this a deration applies.
// altitudeMSL    : Metres above mean sea level. Deration kicks in above 1000m.
//
// Deration formula (IS 10001 / KOEL field standard):
//   tempDerate  = max(0, siteTemp - 40) × 0.02      (2% per °C above 40°C)
//   altDerate   = max(0, (altMSL - 1000) / 100) × 0.01  (1% per 100m above 1000m)
//   derationFactor = (1 - tempDerate) × (1 - altDerate)
//   deratedKVA  = ratedKVA × derationFactor
// ─────────────────────────────────────────────────────────────────────────────

// ── Lazy-fetch cache ──────────────────────────────────────────────────────────
let _cityCache = null        // null until first load; then Array of tuples
let _loadingPromise = null   // in-flight fetch promise — deduplicated

/**
 * Load the full city dataset from public/india-cities.json.
 * Safe to call multiple times — fetches only once, then returns cached data.
 * Returns: Promise<Array<[location, district, state, temp_C, alt_m]>>
 */
export function loadCityData() {
  if (_cityCache) return Promise.resolve(_cityCache)
  if (_loadingPromise) return _loadingPromise
  _loadingPromise = fetch('/india-cities.json')
    .then(r => {
      if (!r.ok) throw new Error(`Failed to load city data: ${r.status}`)
      return r.json()
    })
    .then(data => {
      _cityCache = data
      _loadingPromise = null
      return data
    })
    .catch(err => {
      _loadingPromise = null   // allow retry on next call
      throw err
    })
  return _loadingPromise
}

/**
 * Async city search — returns up to n matching cities.
 * Prioritises: exact match → starts-with → contains.
 * Searches location name, then district, then state.
 *
 * Returns: Promise<Array<{ label, district, state, pincode, maxAmbientTemp, altitudeMSL }>>
 */
export function searchCities(query, n = 8) {
  if (!query || query.length < 2) return Promise.resolve([])
  return loadCityData().then(cities => {
    const q = query.toLowerCase().trim()
    const exact    = []
    const starts   = []
    const contains = []

    for (const [location, district, state, temp, alt, pincode] of cities) {
      if (exact.length + starts.length + contains.length >= n * 3) break
      const loc = location.toLowerCase()
      const obj = { label: location, district, state, pincode: pincode || '', maxAmbientTemp: temp, altitudeMSL: alt }

      if (loc === q)         { exact.push(obj);   continue }
      if (loc.startsWith(q)) { starts.push(obj);  continue }
      if (
        loc.includes(q) ||
        district.toLowerCase().includes(q) ||
        state.toLowerCase().includes(q)
      )                       { contains.push(obj) }
    }

    return [...exact, ...starts, ...contains].slice(0, n)
  })
}

/**
 * Synchronous city lookup — only works after cache is primed (i.e., after
 * the user has typed in the search box at least once). Returns null if not found
 * or if cache isn't loaded yet.
 */
export function findCity(input) {
  if (!input || !_cityCache) return null
  const q = input.toLowerCase().trim()
  for (const [location, district, state, temp, alt, pincode] of _cityCache) {
    if (location.toLowerCase() === q)
      return { label: location, district, state, pincode: pincode || '', maxAmbientTemp: temp, altitudeMSL: alt }
  }
  // Fallback: starts-with match
  for (const [location, district, state, temp, alt, pincode] of _cityCache) {
    if (location.toLowerCase().startsWith(q))
      return { label: location, district, state, pincode: pincode || '', maxAmbientTemp: temp, altitudeMSL: alt }
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Deration helpers — pure math, no city data needed
// ─────────────────────────────────────────────────────────────────────────────

/** Deration factor for a given temp + altitude (returns 0–1 multiplier, e.g. 0.86 = 14% deration) */
export function derationFactor(tempC, altMsl) {
  const tempDerate = Math.max(0, tempC - 40) * 0.02
  const altDerate  = Math.max(0, (altMsl - 1000) / 100) * 0.01
  return +((1 - tempDerate) * (1 - altDerate)).toFixed(4)
}

/** Compute derated kVA */
export function deratedKva(ratedKva, tempC, altMsl) {
  return +(ratedKva * derationFactor(tempC, altMsl)).toFixed(1)
}

/**
 * Human-readable deration summary for a city-like object with
 * { maxAmbientTemp, altitudeMSL }. Returns null if no deration.
 */
export function derationSummary(city) {
  const { maxAmbientTemp: t, altitudeMSL: a } = city
  const tempDerPct = Math.max(0, (t - 40) * 2)
  const altDerPct  = Math.max(0, ((a - 1000) / 100) * 1)
  const totalDer   = +(100 * (1 - derationFactor(t, a))).toFixed(1)

  if (totalDer === 0) return null

  const parts = []
  if (tempDerPct > 0) parts.push(`${tempDerPct}% from heat (${t}°C ambient)`)
  if (altDerPct  > 0) parts.push(`${altDerPct.toFixed(1)}% from altitude (${a}m MSL)`)
  return {
    totalPct:      totalDer,
    breakdown:     parts.join(' + '),
    isSignificant: totalDer >= 10,
  }
}
