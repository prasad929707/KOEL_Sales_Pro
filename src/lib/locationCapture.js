// ─────────────────────────────────────────────────────────────────────────────
// locationCapture.js
// Device GPS → reverse geocode (Nominatim/OSM, free, no API key) → city/district/state
// Also generates a Google Maps permalink from lat/lon.
// ─────────────────────────────────────────────────────────────────────────────

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'

// ── Types ─────────────────────────────────────────────────────────────────────
//
// LocationResult {
//   lat:       number
//   lon:       number
//   city:      string   (village / town / city)
//   district:  string
//   state:     string
//   mapsUrl:   string   (Google Maps link — clicking opens exact pin in Maps)
//   raw:       object   (full Nominatim response, for debugging)
// }

// ── Google Maps link ──────────────────────────────────────────────────────────
export function mapsUrl(lat, lon) {
  return `https://www.google.com/maps?q=${lat},${lon}`
}

// ── Reverse geocode via Nominatim ─────────────────────────────────────────────
// Returns a LocationResult or throws.
async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
  const res = await fetch(url, {
    headers: {
      // Nominatim ToS requires a User-Agent identifying your app
      'User-Agent': 'KirloskarSalesPro/1.0 (prasad929707@gmail.com)',
    },
  })
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)
  const data = await res.json()

  const a = data.address || {}

  // Nominatim field precedence for Indian addresses:
  // city: city > town > village > municipality > county
  const city     = a.city || a.town || a.village || a.municipality || a.county || ''
  // district: county > state_district (varies by region)
  const district = a.county || a.state_district || a.suburb || ''
  // state: always present for India
  const state    = a.state || ''

  return {
    lat,
    lon,
    city,
    district,
    state,
    mapsUrl: mapsUrl(lat, lon),
    raw: data,
  }
}

// ── Main export: capture device location ─────────────────────────────────────
// Returns a Promise<LocationResult>.
// Throws with user-friendly messages on permission denial or timeout.
export function captureLocation({ timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location not supported on this device/browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        try {
          const result = await reverseGeocode(lat, lon)
          resolve(result)
        } catch (err) {
          // Geocode failed — still return raw coords so the form isn't blocked
          resolve({
            lat,
            lon,
            city: '',
            district: '',
            state: '',
            mapsUrl: mapsUrl(lat, lon),
            raw: null,
          })
        }
      },
      (err) => {
        const msgs = {
          1: 'Location permission denied. Please allow location access and try again.',
          2: 'Location unavailable. Check your network or GPS signal.',
          3: 'Location request timed out. Try again.',
        }
        reject(new Error(msgs[err.code] || 'Could not get location.'))
      },
      { enableHighAccuracy: true, timeout, maximumAge: 60_000 }
    )
  })
}

// ── React hook — useLocationCapture ──────────────────────────────────────────
// Usage:
//   const { capture, loading, error } = useLocationCapture()
//   const result = await capture()   → LocationResult
//
// Import hook separately if you're using React:
//   import { useLocationCapture } from '../lib/locationCapture'

import { useState, useCallback } from 'react'

export function useLocationCapture() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const capture = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await captureLocation()
      return result
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { capture, loading, error }
}
