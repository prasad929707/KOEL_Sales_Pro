// Sales Intelligence - "Remarks" column
// Format: factual, brief. No instructive tone. Sales team adds wisdom over time.
// Key: `{koelRangeId}_vs_{competitorBrand}_{competitorRangeId}`

export const REMARKS = {

  // ── KOEL 82.5–160 kVA vs Cummins QSB4.5 (82.5–140 kVA) ──────────
  '82-160_vs_Cummins_c-82-185': {
    noiseLevel:           'KOEL: <75 dBA at 100% load. Cummins: 75 dBA at 75% load - different load benchmark.',
    engineModel:          'KOEL: 4R/4K series (Kirloskar-manufactured). Cummins: QSB4.5 (Cummins-manufactured). Both 4-cylinder platforms.',
    engineMake:           'KOEL engine is Kirloskar-manufactured. Cummins engine is sourced from Cummins Inc.',
    cylinders:            'Both 4-cylinder for 82.5–125 kVA range.',
    displacement:         'KOEL 82.5 kVA: 4.76L. Cummins QSB4.5: 4.5L. KOEL has 5.7% more displacement at same rated output.',
    lubeOilChangePeriod:  'Both 500 hrs. KOEL includes first-service oil change at 50 hrs in warranty scope.',
    adblueCapacity:       'Both use SCR + AdBlue (DEF) for CPCB IV+. KOEL uses independent DEF control module; Cummins uses integrated EATS module.',
    fuelTank:             'KOEL 82.5 kVA: 200L standard tank. Cummins: verify from GA drawing.',
    serviceInterval:      'Both 500 hrs / 12 months. KOEL has declared AMC pricing for 5 years. Cummins post-warranty service terms vary by location.',
    governingClass:       'Both G3.',
    alternatorEfficiency: 'KOEL alternator efficiency: 91.1–92.4%. Cummins uses Stamford alternator - ask for declared efficiency at 75% load.',
    dimensions:           'KOEL 82.5 kVA: 3200×1350×1595mm. Cummins QSB4.5: 1035×950×1250mm (coolpac dimensions - verify full genset GA).',
    weight:               'KOEL 82.5 kVA: 1800 kg dry. Cummins QSB4.5: 535 kg wet (engine+radiator only - genset weight will be higher).',
  },

  // ── KOEL 200–250 kVA vs Cummins QSB6.7 (160–250 kVA) ────────────
  '200-250_vs_Cummins_c-160-250': {
    noiseLevel:           'KOEL: <75 dBA at 100% load. Cummins QSB6.7: 75 dBA at 75% load.',
    engineModel:          'KOEL 250 kVA: 6SL90ETA - 8.86L, 6-cyl. Cummins 250 kVA: QSB6.7 - 6.7L, 6-cyl. KOEL has 32% more displacement for the same output.',
    displacement:         'KOEL 250 kVA: 8.86L vs Cummins 250: 6.7L. Same rated output from larger engine - lower specific load, lower wear per hour.',
    fuelTank:             'KOEL 250 kVA: 600L standard tank. Cummins 250 kVA: verify from datasheet.',
    adblueCapacity:       'KOEL: 45L AdBlue tank. Cummins QSB6.7: ~22L DEF tank - verify. Larger tank means fewer top-ups on extended runs.',
    coolantCapacity:      'KOEL 250 kVA: ~30L. Cummins QSB6.7: 20.3–21.3L.',
    lubeOilChangePeriod:  'Both 500 hrs. KOEL declared AMC pricing; Cummins post-warranty rates vary.',
    alternatorEfficiency: 'KOEL 200 kVA: 92.6%. KOEL 250 kVA: 94%.',
    serviceInterval:      'Both 500 hrs / 12 months.',
    weight:               'KOEL 250 kVA: ~2600 kg dry. Cummins QSB6.7 250 kVA: 844 kg wet engine+radiator - verify full genset weight.',
  },

  // ── KOEL 82.5–160 kVA vs Mahindra Powerol L/M-Series ─────────────
  '82-160_vs_Mahindra Powerol_m-100-200': {
    engineMake:           'KOEL: Kirloskar-manufactured engine. Mahindra Powerol: Mahindra-manufactured engine (H-series for M-range).',
    alternatorEfficiency: 'KOEL alternator: Kirloskar-manufactured. Mahindra: CG/LS/Equivalent - sourced alternator, not own.',
    serviceInterval:      'Both 500 hrs / 12 months. KOEL has declared 5-year AMC pricing.',
    noiseLevel:           'Both <75 dBA. Load point not declared for Mahindra - verify.',
    price:                'Mahindra sometimes ₹50K–1L cheaper ex-works at equivalent kVA. KOEL brand equity allows a premium in the market.',
    serviceNetwork:       'KOEL: 9 GOEMs, pan-India. Mahindra: verify service depth at customer location.',
    warranty:             'KOEL standard 2-year / 3000-hour warranty. Mahindra: 2-year / 5000-hour warranty on engine.',
  },

  // ── KOEL 82.5–160 kVA vs Greaves Cotton ──────────────────────────
  '82-160_vs_Greaves Cotton_g-100-200': {
    engineModel:          'Greaves uses a mix of in-house and sourced engines. Engine model and BHP should be obtained from GA drawing.',
    alternatorEfficiency: 'Greaves alternator sourcing - verify make and class in their spec sheet.',
    serviceNetwork:       'Greaves: 120+ dealers, good tier-1 coverage. Tier-2/below - verify independently.',
    noiseLevel:           'Both declare <75 dBA. Load point not declared for Greaves.',
    price:                'KOEL carries brand premium - customers accept up to ₹1L premium for Kirloskar vs Greaves at comparable kVA.',
    warranty:             'Compare warranty scope in writing.',
  },

  // ── KOEL 320–750 kVA vs Cummins QSM15 (380–500 kVA) ─────────────
  '320-750_vs_Cummins_c-380-500': {
    engineModel:          'KOEL 500 kVA: DV8ETA - 8-cyl, 15.92L. Cummins 500 kVA: QSM15 - 6-cyl, 14.5L. KOEL has more cylinders and more displacement.',
    cylinders:            'KOEL 500 kVA: 8 cylinders. Cummins 500 kVA: 6 cylinders. More cylinders = smoother torque, lower stress per cylinder.',
    displacement:         'KOEL 500 kVA: 15.92L. Cummins QSM15: 14.5L.',
    serviceInterval:      'KOEL: 500 hrs / 12 months. Cummins QSM15: 750 hrs / 12 months. Longer interval - but verify scope vs KOEL AMC package.',
    fuelTank:             'KOEL 500 kVA: 850L standard tank. Cummins 500 kVA: verify.',
    adblueCapacity:       'KOEL 400–750 kVA: dual AdBlue tanks (45L × 2 = 90L). Cummins QSM15: ~45L single tank.',
    alternatorEfficiency: 'KOEL 500 kVA: 94.8%. KOEL 625 kVA: 95.7%.',
    weight:               'Cummins QSM15 500 kVA: 1460 kg wet (engine+radiator). KOEL 500 kVA: verify full genset weight from GA.',
    noiseLevel:           'Both declare <75 dBA. KOEL at 100% load; Cummins at 75% load.',
  },

  // ── Generic fallback - used when no specific matchup exists ───────
  _generic: {
    tco:            'Purchase price is one number. 5-year TCO - purchase + fuel + oil + maintenance - is the real comparison. Use the TCO calculator.',
    serviceNetwork: 'KOEL: 9 GOEMs, pan-India dealer network with SLA commitments.',
    noiseLevel:     'KOEL declares <75 dBA at 100% load. Check the load point in competitor\'s spec - many declare at 75% load.',
    fuelEfficiency: 'Ask for BSFC at 75% load specifically. Real-world sites run at 50–75% load, not 100%.',
  },
}

export const getRemarks = (koelRangeId, competitorBrand, competitorRangeId) => {
  const key = `${koelRangeId}_vs_${competitorBrand}_${competitorRangeId}`
  return REMARKS[key] || REMARKS._generic
}
