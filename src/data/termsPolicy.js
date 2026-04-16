// ─────────────────────────────────────────────────────────────────────────────
// KOEL COMMERCIAL TERMS POLICY
// Kirloskar Sales Pro
//
// Source: Actual Enterprise Brain proposal output (Annexure 2 & 3, Terms of Supply)
// Captured: April 2026 from 750 kVA sample proposal (DV12ETA 4G2)
//
// ARCHITECTURE NOTE:
// This file IS the "permissible limits backend" for Phase 1.
// Phase 2: Fetch EDITABLE_TERMS from Google Sheets so Sales Director can update
//          limits without a code push.
// Phase 2: GEMINI_CONTEXT below becomes the system prompt for AI clause validation.
//
// VALIDATION TIERS:
//   numeric  → instant JS range check (no API)
//   select   → allowed values list (no API)
//   freetext → Gemini validates against GEMINI_CONTEXT (Phase 2)
// ─────────────────────────────────────────────────────────────────────────────

// ── Editable terms — rep can change these within defined limits ───────────────
export const EDITABLE_TERMS = {
  offerValidity: {
    label: 'Offer Validity',
    type: 'numeric',
    unit: 'days',
    default: 30,
    min: 15,
    max: 60,
    hint: 'Standard 30 days. Up to 60 days with RSM sign-off.',
    validate: (v) => {
      if (v < 15) return { ok: false, msg: 'Minimum 15 days — shorter validity creates contract risk.' }
      if (v > 60) return { ok: false, msg: 'Beyond 60 days requires Regional Sales Manager approval.' }
      if (v > 30) return { ok: 'warn', msg: 'Extended validity noted — confirm with RSM before sharing.' }
      return { ok: true }
    },
  },

  paymentMode: {
    label: 'Scope',
    type: 'select',
    options: [
      { id: 'supply',   label: 'Supply Only',                    advance: 35, balance: 65, balanceTrigger: 'proforma invoice, prior to dispatch' },
      { id: 'ic',       label: 'Supply + Installation & Commissioning', advance: 50, balance: 50, balanceTrigger: 'after successful installation & commissioning at site' },
    ],
    default: 'supply',
    hint: 'Changes advance % and balance trigger automatically.',
    validate: () => ({ ok: true }),
  },

  paymentAdvance: {
    label: 'Advance Payment',
    type: 'numeric',
    unit: '%',
    default: { supply: 35, ic: 50 },   // depends on paymentMode
    min:     { supply: 25, ic: 40 },
    max:     { supply: 50, ic: 60 },
    hint: 'Standard: 35% supply-only / 50% I&C. Minimum 25% for supply-only.',
    validate: (v, mode) => {
      const min = mode === 'ic' ? 40 : 25
      const max = mode === 'ic' ? 60 : 50
      if (v < min) return { ok: false, msg: `Minimum advance for ${mode === 'ic' ? 'I&C' : 'supply-only'} is ${min}% — requires HO approval below this.` }
      if (v > max) return { ok: false, msg: `Advance above ${max}% is unusual — confirm with finance.` }
      if (mode === 'supply' && v < 35) return { ok: 'warn', msg: "Below standard 35% — document customer's reason and get RSM note." }
      return { ok: true }
    },
  },

  deliveryWeeks: {
    label: 'Delivery',
    type: 'numeric',
    unit: 'weeks',
    // product-aware defaults — override via getDeliveryDefault(kva)
    default: 10,
    min: 6,
    max: 24,
    hint: 'Standard gensets: 8–12 wks. HHP (750+ kVA): 14–18 wks. Optiprime: 16–20 wks.',
    validate: (v, _, kva) => {
      const isHHP      = kva >= 750
      const isOptiprime = false  // caller passes this
      const hardMin = isHHP ? 12 : 6
      if (v < hardMin) return { ok: false, msg: `${kva} kVA cannot be delivered in under ${hardMin} weeks — factory lead time applies.` }
      if (v < 8 && !isHHP) return { ok: 'warn', msg: 'Under 8 weeks is tight — confirm slot availability with production planning.' }
      return { ok: true }
    },
  },

  quotedPrice: {
    label: 'Quoted Price (ex-works)',
    type: 'currency',
    unit: '₹',
    default: '',
    hint: 'Get from ERP/dealer quote. Enters pitch as "Indicative commercial" — internal rep use.',
    validate: (v) => {
      if (!v) return { ok: true }  // optional
      if (isNaN(+v.replace(/,/g, ''))) return { ok: false, msg: 'Enter a valid number (without ₹ symbol).' }
      return { ok: true }
    },
  },
}

// ── Product-aware warranty defaults ──────────────────────────────────────────
export function getWarrantyTerms(selectedProducts) {
  const hasOptiprime = selectedProducts.some(p => p.isOptiprime)
  const maxKva = Math.max(...selectedProducts.map(p => p.kva || 0))

  if (hasOptiprime) {
    return {
      period:         '5 years from date of commissioning',
      note:           'Optiprime premium warranty — covers twin-pack components.',
      serviceChecks:  '3 mandatory service checks through authorised KIRLOSKAR Care Centre during warranty period.',
      cspNote:        'Customer Service Packages (CSPs) available for extended scheduled servicing (SL & DV series).',
      source:         'Optiprime policy (5-yr standard)',
    }
  }
  return {
    period:         '2 years or 5,000 hours from commissioning, or 30 months from date of supply — whichever is earlier',
    note:           '5-year warranty on 5C engine components. All servicing must be through authorised KIRLOSKAR dealers.',
    serviceChecks:  '3 mandatory service checks through authorised KIRLOSKAR Care Centre during warranty period. Additional maintenance between scheduled visits is chargeable.',
    cspNote:        'Customer Service Packages (CSPs) available for extended scheduled servicing — ask KOEL service team for CSP quotation.',
    source:         'KIRLOSKAR standard warranty (Annexure 3)',
  }
}

// ── Delivery estimate by product kVA ─────────────────────────────────────────
export function getDeliveryDefault(kva, isOptiprime = false) {
  if (isOptiprime)   return { weeks: 18, label: '16–20 weeks (Optiprime factory-tested unit)' }
  if (kva >= 750)    return { weeks: 16, label: '14–18 weeks (HHP — confirm slot with production)' }
  if (kva >= 320)    return { weeks: 12, label: '10–14 weeks' }
  if (kva >= 82)     return { weeks: 10, label: '8–12 weeks' }
  return               { weeks: 8,  label: '6–10 weeks' }
}

// ── Fixed terms — always shown, never editable ────────────────────────────────
// Source: Annexure 2 (Commercial T&C) + Terms of Supply + Annexure 3 (Warranty)
export const FIXED_TERMS = [
  { id: 'gst',          label: 'GST',                    text: '18% extra on ex-works price.' },
  { id: 'freight',      label: 'Freight & Insurance',    text: 'Freight charges & transit insurance are customer\'s liability.' },
  { id: 'exclusions',   label: 'Price Excludes',         text: 'Unloading, shifting, erection, earthing, power cables, first-fill diesel cost, and load bank testing.' },
  { id: 'civil',        label: 'Civil Works',            text: 'DG foundation, cable trench, and all civil works are within customer\'s scope.' },
  { id: 'cancellation', label: 'Order Cancellation',     text: '2% cancellation charges on order value if PO is cancelled.' },
  { id: 'storage',      label: 'Storage Charges',        text: '₹10,000/month + 15% p.a. inventory burden if delivery not collected after inspection clearance.' },
  { id: 'arbitration',  label: 'Arbitration',            text: 'Disputes referred to Arbitration. Proceedings at Krishnagiri, Tamil Nadu.' },
  { id: 'statutory',    label: 'Statutory Variations',   text: 'Any change in applicable taxes/duties by government shall apply.' },
  { id: 'forcemajeure', label: 'Force Majeure',          text: 'KOEL not liable for damages arising from force majeure conditions.' },
]

// ── Gemini system prompt context — used for free-text clause validation ───────
// Phase 2: This string feeds into the Gemini system prompt when rep enters a custom clause.
// Structure: readable policy rules that Gemini can reason about.
export const GEMINI_VALIDATION_CONTEXT = `
You are a commercial terms compliance checker for Kirloskar Oil Engines Ltd (KOEL).
Your role: assess whether a proposed custom clause or scope amendment is within standard KOEL sales policy.

STANDARD POLICY LIMITS (do not go beyond these without explicit approval):
- Offer validity: 15–30 days standard. Up to 60 days with RSM approval. Beyond 60: HO approval.
- Payment advance (supply-only): 25–50%. Standard is 35%.
- Payment advance (with I&C): 40–60%. Standard is 50%.
- Delivery — standard gensets (<320 kVA): minimum 6 weeks. HHP (750+ kVA): minimum 12 weeks. Optiprime: minimum 16 weeks.
- Warranty (standard): 2 years / 5000 hours from commissioning, or 30 months from supply (whichever earlier).
- Warranty (Optiprime): 5 years standard.
- Extended warranty beyond policy maximums: requires explicit Head Office approval, cannot be committed by rep.
- Cable laying, civil work, earthing, erection: always customer's scope. KOEL cannot commit to these without formal amendment signed by GM-Sales.
- First-fill diesel: always customer's scope.
- Price validity: quoted price valid for 30 days standard. KOEL prices at delivery apply (not quotation date).
- KOEL does NOT offer unconditional buy-back guarantees.
- KOEL warranty is void if installation is not by KOEL-authorized service dealer.

SCOPE CHANGES (unprecedented):
- Any scope change not listed in the standard Terms of Supply requires written approval from the Regional Sales Manager (RSM) minimum, or GM-Sales for changes valued above ₹2L.
- Client scope changes (customer requests KOEL to take over their scope items): possible, but must be formally scoped, priced, and approved — not oral commitments.
- KOEL scope reductions (KOEL proposes to not do something it normally does): need finance and legal sign-off.

When assessing a clause, respond with:
VERDICT: YES (within policy) / WARN (possible but needs approval) / NO (outside policy)
REASON: [one sentence]
SAFE ALTERNATIVE: [reworded clause that IS within policy, or "N/A — clause is fine"]
`
