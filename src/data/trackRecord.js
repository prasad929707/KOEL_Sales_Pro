// ── KOEL Verified Reference Installations ────────────────────────────────────
// These are publicly confirmed from cited sources. Read-only seed data.
// Source tier: 'verified' — always shown, cannot be deleted by any user.
//
// To add more: must be backed by a public citation (news article, press release,
// government notice, annual report). No unverifiable entries.
//
// User/admin submitted refs are stored separately in localStorage (trackRefs).
// The TrackRecord page merges both at render time.

export const VERIFIED_REFS = [

  // ─── 1. Indian Navy — 6MW Marine Engine ────────────────────────────────────
  {
    id: 'v-001',
    customerName: 'Indian Navy',
    organisation: 'Ministry of Defence, Government of India',
    segment: 'Government',
    segmentId: 'government',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',

    // Installation
    kwRating: 6000,          // 6 MW
    kvaRating: null,
    productLine: 'Special Projects — Medium Speed Marine Diesel Engine',
    quantity: 1,             // prototype + series
    application: 'Main propulsion and power generation on Indian Navy warships and Indian Coast Guard vessels',
    year: 2025,

    // What makes this notable
    highlights: [
      '₹270 crore Make-I defence contract (April 2025)',
      'India\'s first indigenous 6 MW marine diesel engine',
      '50%+ indigenous content — replacing imported Ukrainian/UK engines',
      '70% funded by Government of India',
      'Scalable platform: 3–10 MW range',
      'Delivery: April 2028',
    ],

    // Proof
    source: 'verified',
    status: 'approved',
    sourceLabel: 'PIB Press Release + Business Standard, April 2025',
    sourceUrl: 'https://idrw.org/indian-navy-kirloskar-sign-rs-270-crore-deal-for-6mw-marine-diesel-engine/',

    // Display
    submittedBy: 'KOEL Public Record',
    submittedAt: '2025-04-02T00:00:00.000Z',
    approvedBy: 'KOEL Public Record',
    approvedAt: '2025-04-02T00:00:00.000Z',
  },

  // ─── 2. NPCIL — Nuclear Power Emergency Gensets ────────────────────────────
  {
    id: 'v-002',
    customerName: 'Nuclear Power Corporation of India (NPCIL)',
    organisation: 'Government of India — Department of Atomic Energy',
    segment: 'Government',
    segmentId: 'government',
    city: 'Pan-India',
    state: 'Multiple',
    country: 'India',

    // Installation
    kwRating: null,
    kvaRating: '2,000–5,000 kVA per unit',
    productLine: 'Special Projects — Emergency Medium Speed Diesel Gensets',
    quantity: 20,
    application: 'Emergency backup power for nuclear reactor safety systems — critical life-safety load, seismically qualified',
    year: 2015,

    highlights: [
      '20 emergency gensets delivered to NPCIL nuclear power plants',
      '2–5 MWe per unit — highest capacity class',
      'Only Indian company supplying high-capacity emergency gensets to NPCIL',
      'Seismic qualification certified for nuclear-grade installation',
      'Technology partnership: Rolls-Royce MTU engines',
      'Complies with nuclear safety standards for emergency diesel generators',
    ],

    source: 'verified',
    status: 'approved',
    sourceLabel: 'NS Energy / Business Standard, February 2015',
    sourceUrl: 'https://www.nsenergybusiness.com/news/newsrolls-royce-and-kirloskar-team-up-to-support-indian-nuclear-power-plants-050215-4505380/',

    submittedBy: 'KOEL Public Record',
    submittedAt: '2015-02-04T00:00:00.000Z',
    approvedBy: 'KOEL Public Record',
    approvedAt: '2015-02-04T00:00:00.000Z',
  },

  // ─── 3. India Telecom Network — 45,000+ Tower Gensets ─────────────────────
  {
    id: 'v-003',
    customerName: 'India Telecom Tower Fleet',
    organisation: 'Airtel · Vodafone (Hutch) · Idea Cellular · BPL Mobile · Essar Mobile · ESCOTEL · MTN',
    segment: 'Telecom',
    segmentId: 'telecom',
    city: 'Pan-India',
    state: 'Multiple',
    country: 'India',

    // Installation
    kwRating: null,
    kvaRating: '7.5–25 kVA per site',
    productLine: 'Kirloskar Green — Tower Series',
    quantity: 45000,
    application: 'Cellular tower backup power — ensures 24×7 network uptime across India\'s grid-unreliable zones',
    year: 2010,

    highlights: [
      '45,000+ Kirloskar Green gensets deployed across India',
      'Named operators: Airtel, Vodafone (Hutch), Idea Cellular, BPL, Essar, ESCOTEL',
      'India\'s largest single-brand telecom genset fleet',
      'Compact footprint for standard tower shelter cabinets',
      'Covers Tier-2 and Tier-3 zones where grid reliability is lowest',
    ],

    source: 'verified',
    status: 'approved',
    sourceLabel: 'Power Technology (Contractors/Gensets/Kirloskar)',
    sourceUrl: 'https://www.power-technology.com/contractors/gensets/kirloskar/',

    submittedBy: 'KOEL Public Record',
    submittedAt: '2010-01-01T00:00:00.000Z',
    approvedBy: 'KOEL Public Record',
    approvedAt: '2010-01-01T00:00:00.000Z',
  },
]

// ── Segment filter options for Track Record UI ────────────────────────────────
export const TR_SEGMENTS = [
  { id: 'all',         label: 'All Segments' },
  { id: 'healthcare',  label: 'Healthcare' },
  { id: 'industrial',  label: 'Industrial' },
  { id: 'datacentre',  label: 'Data Centre' },
  { id: 'telecom',     label: 'Telecom' },
  { id: 'realestate',  label: 'Real Estate' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'retail',      label: 'Retail' },
  { id: 'banking',     label: 'Banking' },
  { id: 'education',   label: 'Education' },
  { id: 'coldchain',   label: 'Cold Chain' },
  { id: 'government',  label: 'Government' },
  { id: 'infra',       label: 'Infrastructure' },
]

// ── Ref submission schema (for form validation reference) ─────────────────────
// All user/admin submissions follow this shape before being passed to trackRefs.submit()
// Required: customerName, segmentId, application, year
// Optional: everything else — add what you know, leave the rest blank
export const REF_SCHEMA = {
  customerName:  '',   // required
  organisation:  '',   // optional — parent company / group
  segmentId:     '',   // required — from TR_SEGMENTS
  city:          '',
  state:         '',
  kvaRating:     '',   // e.g. "500 kVA" or "2 × 320 kVA"
  kwRating:      null,
  productLine:   '',   // e.g. "KG Series 500 kVA"
  quantity:      1,
  application:   '',   // required — what it powers
  year:          new Date().getFullYear(),
  highlights:    [],   // bullet points — what's notable
}
