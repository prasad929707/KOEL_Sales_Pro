// Kirloskar Powergen — OPTIPRIME product line
// Source: "Kirloskar Powergen - Optiprime - CPCB IV+.pdf"
// CPCB IV+ Compliant. All ratings are PRIME (ISO 8528).
//
// KEY CONCEPT: Each Optiprime unit contains TWO engines in a single enclosure.
// The Power Management System (PMS) activates/deactivates one engine based on real-time load,
// reducing fuel consumption and CO2 by up to 40% vs conventional twin-DG setups.
// Ratings shown as "combined" (e.g. 500 kVA = 250 kVA × 2 packs).
//
// Competitor comparison: PENDING — no direct equivalent products confirmed.

export const OPTIPRIME_MODELS = [
  {
    id: 'op-117',
    model: 'Optiprime 117',
    kva: 117,              // Combined: 58.5 × 2
    kvaPerPack: 58.5,
    kw: 93.6,              // 46.8 × 2
    configuration: 'Parallel',
    engineModel: '4R810ETA 4G1',
    cylinders: 4,          // per engine; total 4 × 2
    displacement: 3.24,    // per engine (L)
    fuelConsumption: { at100: 21.6, at75: 16.6, at50: 12.6, at25: 8.9 },
    fuelTank: 330,         // 165 × 2
    weightDry: 2511,
    weightWet: 2561,
    dimensions: { length: 2900, width: 2100, heightNoSil: 1701, heightWithSil: 1701 },
    lubeOilChangePeriod: 500,
    lubeOilSump: 20,       // 10 × 2
    coolantCapacity: 25.4, // 12.70 × 2
    adblueCapacity: null,  // NA for this model
    blockLoadingCapacity: 60,
    alternatorEfficiency: 90.8,
    insulationClass: 'H',
    maxVoltageDip: '<20%',
    noiseLevel: '≤75 dBA @ 1m',
    syncController: 'KG1500',
    datasheet: '/datasheets/Optiprime/optiprime-brochure.pdf',
  },
  {
    id: 'op-400',
    model: 'Optiprime 400',
    kva: 400,              // 200 × 2
    kvaPerPack: 200,
    kw: 320,               // 160 × 2
    configuration: 'Series',
    engineModel: '6K1080ETA 4G2',
    cylinders: 6,
    displacement: 6.48,
    fuelConsumption: { at100: 91.4, at75: 71.1, at50: 50.2, at25: 25.1 },
    fuelTank: 790,
    weightDry: 6000,
    weightWet: 6100,
    dimensions: { length: 7500, width: 1450, heightNoSil: 1900, heightWithSil: 2730 },
    lubeOilChangePeriod: 500,
    lubeOilSump: 50,       // 25 × 2
    coolantCapacity: 57.8, // 28.9 × 2
    adblueCapacity: 90,    // 45 × 2
    blockLoadingCapacity: 50,
    alternatorEfficiency: 92.6,
    insulationClass: 'H',
    maxVoltageDip: '<20%',
    noiseLevel: '≤75 dBA @ 1m',
    syncController: 'KG1500',
    datasheet: '/datasheets/Optiprime/optiprime-brochure.pdf',
  },
  {
    id: 'op-500',
    model: 'Optiprime 500',
    kva: 500,              // 250 × 2
    kvaPerPack: 250,
    kw: 400,               // 200 × 2
    configuration: 'Series',
    engineModel: '6SL90ETA 4G2',
    cylinders: 6,
    displacement: 8.86,
    fuelConsumption: { at100: 106, at75: 80, at50: 58, at25: 30 },
    fuelTank: 1380,        // 690 × 2
    weightDry: 8000,
    weightWet: 8150,
    dimensions: { length: 8500, width: 1700, heightNoSil: 2042, heightWithSil: 2487 },
    lubeOilChangePeriod: 500,
    lubeOilSump: 54,       // 27 × 2
    coolantCapacity: 72.8, // 36.4 × 2
    adblueCapacity: 90,    // 45 × 2
    blockLoadingCapacity: 55,
    alternatorEfficiency: 94,
    insulationClass: 'H',
    maxVoltageDip: '<20%',
    noiseLevel: '≤75 dBA @ 1m',
    syncController: 'KG1500',
    datasheet: '/datasheets/Optiprime/optiprime-brochure.pdf',
  },
  {
    id: 'op-640',
    model: 'Optiprime 640',
    kva: 640,              // 320 × 2
    kvaPerPack: 320,
    kw: 512,               // 256 × 2
    configuration: 'Series',
    engineModel: '6SL90ETA 4G3',
    cylinders: 6,
    displacement: 8.86,
    fuelConsumption: { at100: 133, at75: 102, at50: 69, at25: 35 },
    fuelTank: 1000,        // 500 × 2
    weightDry: 8100,
    weightWet: 8250,
    dimensions: { length: 8500, width: 1700, heightNoSil: 2042, heightWithSil: 2487 },
    lubeOilChangePeriod: 500,
    lubeOilSump: 54,       // 27 × 2
    coolantCapacity: 72.8, // 36.4 × 2
    adblueCapacity: 90,    // 45 × 2
    blockLoadingCapacity: 50,
    alternatorEfficiency: 94.3,
    insulationClass: 'H',
    maxVoltageDip: '<20%',
    noiseLevel: '≤75 dBA @ 1m',
    syncController: 'KG1500',
    datasheet: '/datasheets/Optiprime/optiprime-brochure.pdf',
  },
  {
    id: 'op-1000',
    model: 'Optiprime 1000',
    kva: 1000,             // 500 × 2
    kvaPerPack: 500,
    kw: 800,               // 400 × 2
    configuration: 'Series',
    engineModel: 'DV8 ETA 4G3',
    cylinders: 8,
    displacement: 15.92,
    fuelConsumption: { at100: 207, at75: 158, at50: 111, at25: 56 },
    fuelTank: 1740,        // 870 × 2
    weightDry: 13786,
    weightWet: 14000,
    dimensions: { length: 11200, width: 2125, heightNoSil: 2655, heightWithSil: 3655 },
    lubeOilChangePeriod: 500,
    lubeOilSump: 80,       // 40 × 2
    coolantCapacity: 126.4,// 63.2 × 2
    adblueCapacity: 180,   // 45 × 4
    blockLoadingCapacity: 55,
    alternatorEfficiency: 94.6,
    insulationClass: 'H',
    maxVoltageDip: '<20%',
    noiseLevel: '≤75 dBA @ 1m',
    syncController: 'KG1500',
    datasheet: '/datasheets/Optiprime/optiprime-brochure.pdf',
  },
  {
    id: 'op-1500',
    model: 'Optiprime 1500',
    kva: 1500,             // 750 × 2
    kvaPerPack: 750,
    kw: 1200,              // 600 × 2
    configuration: 'Series',
    engineModel: 'DV12 ETA 4G2',
    cylinders: 12,
    displacement: 23.88,
    fuelConsumption: { at100: 293, at75: 240, at50: 170, at25: 86 },
    fuelTank: 1890,        // 945 × 2
    weightDry: 18500,
    weightWet: 18900,
    dimensions: { length: 12000, width: 2300, heightNoSil: 2713, heightWithSil: 3381 },
    lubeOilChangePeriod: 500,
    lubeOilSump: 146,      // 73 × 2
    coolantCapacity: 347.8,// 173.9 × 2
    adblueCapacity: 180,   // 45 × 4
    blockLoadingCapacity: 53,
    alternatorEfficiency: 94.7,
    insulationClass: 'H',
    maxVoltageDip: '<20%',
    noiseLevel: '≤75 dBA @ 1m',
    syncController: 'KG1500',
    datasheet: '/datasheets/Optiprime/optiprime-brochure.pdf',
  },
  {
    id: 'op-2020',
    model: 'Optiprime 2020',
    kva: 2020,             // 1010 × 2 — Containerised
    kvaPerPack: 1010,
    kw: 1616,              // 808 × 2
    configuration: 'Series (Containerised)',
    engineModel: 'DV16 ETA G3',
    cylinders: 16,
    displacement: 31.84,
    fuelConsumption: { at100: 402.8, at75: 308.4, at50: 215.4, at25: 111.1 },
    fuelTank: 860,         // 430 × 2
    weightDry: 25170,
    weightWet: 26000,
    dimensions: { length: 12192, width: 2438, heightNoSil: 2895, heightWithSil: 4002 },
    lubeOilChangePeriod: 500,
    lubeOilSump: 260,      // 130 × 2
    coolantCapacity: 360,  // 180 × 2
    adblueCapacity: null,  // listed as "-" in brochure
    blockLoadingCapacity: 55,
    alternatorEfficiency: 95.1,
    insulationClass: 'H',
    maxVoltageDip: '<20%',
    noiseLevel: 'Contact KOEL',
    syncController: 'KG1500',
    datasheet: '/datasheets/Optiprime/optiprime-brochure.pdf',
  },
]

export const OPTIPRIME_FEATURES = [
  { label: 'Patented Hybrid Technology', icon: 'patent' },
  { label: 'Up to 40% Lower CO₂ Emissions', icon: 'co2' },
  { label: 'Up to 50% Lower NOₓ Emissions', icon: 'nox' },
  { label: 'Optimised Fuel Consumption at Variable Load', icon: 'fuel' },
  { label: '20% Smaller Footprint vs Equivalent Capacity', icon: 'footprint' },
  { label: 'KG1500 Synchronisation Controller', icon: 'sync' },
  { label: 'Common Rail Direct Injection (CRDi)', icon: 'crdi' },
  { label: 'Remote Monitoring via IoT', icon: 'iot' },
]

export const OPTIPRIME_APPLICATIONS = [
  'Infrastructure', 'Industry', 'IT Sector',
  'Hospitality', 'Healthcare', 'Real Estate',
  'Government', 'Logistics',
]
