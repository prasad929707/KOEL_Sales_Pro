// Segment list for Pitch Builder form
// Each segment has an icon, short label, and default load profile suggestion

export const PITCH_SEGMENTS = [
  { id: 'telecom',     label: 'Telecom',          icon: '📡', defaultLoad: 'mixed',      kvaHint: '25–160 kVA typical' },
  { id: 'healthcare',  label: 'Healthcare',        icon: '🏥', defaultLoad: 'mixed',      kvaHint: '125–500 kVA typical' },
  { id: 'realestate',  label: 'Real Estate',       icon: '🏢', defaultLoad: 'office',     kvaHint: '82–250 kVA typical' },
  { id: 'datacentre',  label: 'Data Centre',       icon: '🖥️', defaultLoad: 'datacentre', kvaHint: '250–750 kVA typical' },
  { id: 'industrial',  label: 'Industrial',        icon: '🏭', defaultLoad: 'motors',     kvaHint: '160–750 kVA typical' },
  { id: 'hospitality', label: 'Hospitality',       icon: '🏨', defaultLoad: 'mixed',      kvaHint: '82–320 kVA typical' },
  { id: 'retail',      label: 'Retail',            icon: '🛒', defaultLoad: 'office',     kvaHint: '40–160 kVA typical' },
  { id: 'education',   label: 'Education',         icon: '🎓', defaultLoad: 'office',     kvaHint: '25–125 kVA typical' },
  { id: 'banking',     label: 'Banking / Finance', icon: '🏦', defaultLoad: 'datacentre', kvaHint: '25–125 kVA typical' },
  { id: 'government',  label: 'Govt / PSU',        icon: '🏛️', defaultLoad: 'mixed',      kvaHint: '82–500 kVA typical' },
  { id: 'infra',       label: 'Infrastructure',    icon: '✈️', defaultLoad: 'motors',     kvaHint: '250–750 kVA typical' },
  { id: 'coldchain',   label: 'Cold Chain',        icon: '❄️', defaultLoad: 'motors',     kvaHint: '40–250 kVA typical' },
]

export const SPACE_CONSTRAINTS = [
  { id: 'none',       label: 'No constraint',               note: '' },
  { id: 'compact',    label: 'Compact footprint required',  note: 'Limited floor space' },
  { id: 'acoustic',   label: 'Noise-sensitive area',        note: 'Acoustic enclosure / silent DG set' },
  { id: 'outdoor',    label: 'Outdoor installation',        note: 'Weatherproof canopy required' },
  { id: 'basement',   label: 'Basement installation',       note: 'Affects exhaust routing and ventilation' },
  { id: 'rooftop',    label: 'Rooftop / terrace',           note: 'Structural load check needed' },
]

export const COMPETITORS = [
  { id: 'cummins',   label: 'Cummins',            country: 'US' },
  { id: 'cat',       label: 'CAT / Perkins',       country: 'US' },
  { id: 'greaves',   label: 'Greaves Cotton',      country: 'IN' },
  { id: 'mahindra',  label: 'Mahindra Powerol',    country: 'IN' },
  { id: 'baudouin',  label: 'Baudouin (Weichai)',   country: 'FR/CN' },
  { id: 'none',      label: 'Not known / None',    country: '' },
]
