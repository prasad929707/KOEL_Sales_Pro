// ─────────────────────────────────────────────────────────────────────────────
// KOEL GENSET SIZING ENGINE
// Kirloskar Sales Pro
//
// KOEL SALES STANDARD: Size genset so block load ≈ 50% of rated kW.
// This gives headroom for:
//   · Motor starting surge (DOL motors draw 3-6× running current at startup)
//   · Future load additions
//   · Wet stacking prevention (running too light causes carbon buildup)
//   · CPCB IV+ engines perform best at 50-75% load
//
// Required kVA = BlockLoad(kW) × (1 / PowerFactor) × (1 / 0.50)
// At PF 0.8 (standard mixed load): Required kVA = BlockLoad × 2.5
//
// ── DERATION (IS 10001 / KOEL field standard) ─────────────────────────────
// Standard rating conditions: 40°C ambient, sea level (0m MSL)
// Temperature deration : 2% per °C above 40°C
// Altitude deration    : 1% per 100m above 1000m MSL
// Deration factor      = (1 - tempDerate) × (1 - altDerate)
// Derated kVA          = Rated kVA × derationFactor
//
// Examples:
//   Nagpur (47°C, 312m) → tempDerate 14%, no altDerate → factor 0.86
//   Leh    (33°C, 3524m) → no tempDerate, altDerate 25.24% → factor 0.748
//   Bengaluru (33°C, 920m) → no deration → factor 1.00
//
// Impact on sizing: when deration is significant, the app sizes up to a model
// whose DERATED output still covers the required kW, not just the rated kW.
// ─────────────────────────────────────────────────────────────────────────────

import { KOEL_RANGES } from '../data/koel'
import { OPTIPRIME_MODELS } from '../data/optiprime'
import { derationFactor as calcDerationFactor } from '../data/cityData'

export const LOAD_PROFILES = [
  {
    id: 'office',
    label: 'Offices & Retail',
    sublabel: 'Lighting, AC, computers',
    pf: 0.92,
    factor: +(1 / 0.92 / 0.50).toFixed(3),  // ≈ 2.17
    note: 'Near-unity power factor. No large motor starting current. Standard lighting + HVAC.',
  },
  {
    id: 'mixed',
    label: 'Mixed Loads',
    sublabel: 'Offices + pumps + HVAC',
    pf: 0.80,
    factor: +(1 / 0.80 / 0.50).toFixed(3),  // 2.50
    note: 'Typical commercial / institutional. Mix of resistive and inductive loads.',
  },
  {
    id: 'motors',
    label: 'Pumps & Motors',
    sublabel: 'DOL motors, compressors',
    pf: 0.72,
    factor: +(1 / 0.72 / 0.50).toFixed(3),  // ≈ 2.78
    note: 'Heavy inductive loads. DOL motors can pull 5-6× rated current at startup — size generously.',
  },
  {
    id: 'datacentre',
    label: 'Data Centre / UPS',
    sublabel: 'UPS-fed server loads',
    pf: 0.90,
    factor: +(1 / 0.90 / 0.50).toFixed(3),  // ≈ 2.22
    note: 'UPS presents near-unity PF to DG. For Tier III+, standard is N+1 redundancy.',
  },
]

// Flatten all standard KOEL models into one array
function getAllKoelModels() {
  const models = []
  for (const range of KOEL_RANGES) {
    for (const m of range.models) {
      models.push({
        ...m,
        rangeId:     range.id,
        rangeLabel:  range.label,
        series:      range.series,
        image:       range.image,
        cpcb:        range.cpcb,
        keyFeatures: range.keyFeatures,
        overload:    range.models[0]?.overloadCapacity || null,
        isOptiprime: false,
      })
    }
  }
  return models
}

// ── Deration helpers ──────────────────────────────────────────────────────────

// Compute deration factor for a city object or manual temp/alt values
export function getDerationFactor(siteTemp, siteAlt) {
  if (!siteTemp && !siteAlt) return 1
  return calcDerationFactor(siteTemp || 40, siteAlt || 0)
}

// Annotate a model with loading stats AND deration info
function annotate(model, blockLoadKw, deratFactor) {
  const factor   = deratFactor ?? 1
  const deratKva = +(model.kva * factor).toFixed(1)
  const deratKw  = +(model.kw  * factor).toFixed(1)
  const loadingPct = Math.round((blockLoadKw / deratKw) * 100)   // load vs DERATED kW

  const derationPct = +((1 - factor) * 100).toFixed(1)

  return {
    ...model,
    deratFactor,
    derationPct,         // e.g. 14 means 14% deration
    deratKva,            // effective kVA output at site conditions
    deratKw,             // effective kW output at site conditions
    loadingPct,
    isOptimal:    loadingPct >= 40 && loadingPct <= 65,
    isTight:      loadingPct > 65 && loadingPct <= 80,
    isOversized:  loadingPct < 35,
    isUndersized: loadingPct > 80,
  }
}

// ── Main sizing function ───────────────────────────────────────────────────────
// Accepts optional siteTemp (°C) and siteAlt (m MSL) for deration-aware sizing.
// When provided, product matching uses DERATED kVA, not rated kVA.
export function sizeGenset(blockLoadKw, loadProfileId, siteTemp = null, siteAlt = null) {
  if (!blockLoadKw || blockLoadKw <= 0) return null

  const profile    = LOAD_PROFILES.find(p => p.id === loadProfileId) || LOAD_PROFILES[1]
  const requiredKva = Math.ceil(blockLoadKw * profile.factor)

  // Deration factor (1.0 if no site conditions provided)
  const deratFactor = getDerationFactor(siteTemp, siteAlt)

  // For deration-aware matching: a product is only viable if its DERATED kVA ≥ required
  const allModels = getAllKoelModels()
  const matches = allModels
    .filter(m => (m.kva * deratFactor) >= requiredKva)
    .sort((a, b) => a.kva - b.kva)
    .slice(0, 3)
    .map(m => annotate(m, blockLoadKw, deratFactor))

  // One size down (compact fit alternative)
  const tighter = allModels
    .filter(m => {
      const dk = m.kva * deratFactor
      return dk < requiredKva && dk >= requiredKva * 0.75
    })
    .sort((a, b) => b.kva - a.kva)
    .slice(0, 1)
    .map(m => annotate(m, blockLoadKw, deratFactor))

  // Optiprime: deration-aware
  const optiprime = OPTIPRIME_MODELS
    .filter(m => (m.kva * deratFactor) >= requiredKva)
    .sort((a, b) => a.kva - b.kva)
    .slice(0, 2)
    .map(m => {
      const dk = +(m.kva * deratFactor).toFixed(1)
      return {
        ...m,
        rangeId: 'optiprime', isOptiprime: true, cpcb: 'IV+',
        image: '/images/optiprime/optiprime_product.jpg',
        deratFactor,
        derationPct: +((1 - deratFactor) * 100).toFixed(1),
        deratKva: dk,
        deratKw:  +(m.kw * deratFactor).toFixed(1),
        loadingPct: Math.round((blockLoadKw / (m.kw * deratFactor)) * 100),
        isOptimal: true, isTight: false, isOversized: false, isUndersized: false,
      }
    })

  // Deration context to display in UI
  const isDerated = deratFactor < 1
  const derationPct = +((1 - deratFactor) * 100).toFixed(1)

  return {
    blockLoadKw,
    profile,
    requiredKva,
    deratFactor,
    isDerated,
    derationPct,
    matches,
    tighter,
    optiprime,
  }
}

// ── Loading label + color ─────────────────────────────────────────────────────
export function loadingLabel(pct) {
  if (pct < 35)  return { text: 'Oversized',     color: '#b0bec5', bg: '#f6f8f9' }
  if (pct <= 65) return { text: 'KOEL standard', color: '#1a9e5a', bg: '#e8f8ef' }
  if (pct <= 80) return { text: 'Compact fit',   color: '#d97706', bg: '#fef3c7' }
  return           { text: 'Too tight',     color: '#dc2626', bg: '#fee2e2' }
}

// ── Deration badge text ───────────────────────────────────────────────────────
// Returns a string like "−14% heat deration" for display in product cards
export function derationBadge(model) {
  if (!model?.derationPct || model.derationPct <= 0) return null
  return `−${model.derationPct}% site deration applied`
}

// ── Fuel consumption estimate ─────────────────────────────────────────────────
// BSFC (Brake Specific Fuel Consumption) for KOEL CPCB IV+ diesel engines.
// Source: KOEL technical bulletins + IS 10001 test data.
// Values are representative estimates — actual BSFC varies ±5% by model.
//
// Diesel price default: ₹93/L (prevailing ex-pump, April 2026 — rep can override)
//
// Returns: { lph, costPerHr } for a given kW rating at a given load percentage.
export function estimateFuel(kw, loadPct, dieselPricePerL = 93) {
  if (!kw || kw <= 0) return null
  // BSFC curve — engines are most efficient at 70–80% load
  const bsfc =
    loadPct >= 90 ? 0.305 :   // 100% load: slightly rich, higher BSFC
    loadPct >= 65 ? 0.262 :   // 75% load: optimal efficiency band
    loadPct >= 40 ? 0.295 :   // 50% load: part-load, less efficient
                   0.370      // 25% load: very inefficient — wet-stacking risk
  const outputKw  = kw * loadPct / 100
  const lph       = +(outputKw * bsfc).toFixed(1)
  const costPerHr = +(lph * dieselPricePerL).toFixed(0)
  return { lph, costPerHr, bsfc, loadPct }
}

// Fuel table for a model — returns array of { loadPct, lph, costPerHr } for 50/75/100%
export function fuelTable(kw, dieselPricePerL = 93) {
  return [50, 75, 100].map(pct => ({ loadPct: pct, ...estimateFuel(kw, pct, dieselPricePerL) }))
}
