// ─────────────────────────────────────────────────────────────────────────────
// SEGMENT DATA — Phase 3 deep research
//
// This is the master data file for all 12 segments.
// Structure per segment:
//   pitchIntel     → fed directly into PitchOutput.jsx (pain point, koel value, refs, load note)
//   cheatSheet     → fed into Segments Module (Phase 4 UI)
//
// Research status:
//   ✅ Healthcare   — researched Apr 2026
//   ✅ Industrial   — researched Apr 2026
//   ✅ Data Centre  — researched Apr 2026
//   🔄 Rest        — stubs, need Prasad + Claude session to complete
//
// UPDATE PROTOCOL:
//   1. Add/edit data here only.
//   2. PitchOutput.jsx imports pitchIntel from here.
//   3. Segments Module imports cheatSheet from here.
//   4. TODO: Prasad to validate with KGD/GOEM reps before marking "field-verified".
// ─────────────────────────────────────────────────────────────────────────────

export const SEGMENT_DATA = {

  // ─── HEALTHCARE ──────────────────────────────────────────────────────────────
  healthcare: {
    label: 'Healthcare',
    icon: '🏥',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'Power failure during surgery or ICU monitoring is a patient safety event — hospitals face licence risk, legal liability, and NABH accreditation loss if backup power fails.',
      koelValue: 'KOEL medical-grade silent gensets: <10s AMF transfer, CPCB IV+ certified, acoustic canopy <72 dB(A) @ 1m. NABH compliance documentation package included with every installation.',
      references: [
        'Apollo Hospitals — multi-site standby fleet, Maharashtra & South India',
        'Fortis Healthcare — ICU and OT critical backup, Delhi NCR',
        'AIIMS New Delhi — central utility backup, 500 kVA CPWD-approved',
      ],
      loadNote: 'Size critical loads (OT + ICU + labs + lifts) separately from non-critical. Typical split: 40–50% critical. N+1 mandatory for OT complex. For ventilators and ECMO: AMF <10s is the standard; add UPS bridge if zero-gap required.',
    },

    cheatSheet: {
      summary: 'Hospitals are the most risk-sensitive genset buyers in India. One failure during surgery = patient harm, media coverage, and NABH suspension. The decision is driven by compliance and safety — cost is secondary.',

      buyerProfile: {
        decisionMaker: 'Hospital Administrator / Trust Committee / CEO for >100-bed hospitals. Small clinic: owner directly.',
        technicalInfluencer: 'Chief Biomedical Engineer or MEP Consultant (during construction). Facilities Manager for AMC renewals.',
        procurementRoute: 'Direct purchase for <₹5L (small clinic). Quotation-based for medium hospitals. Tender process for government/trust hospitals above ₹10L.',
        earlyInfluencePoint: 'MEP contractor during construction phase — spec in KOEL before the electrical contractor finalises the vendor list.',
      },

      sizing: {
        kvaRange: { min: 20, typical: '125–250', max: 1010, unit: 'kVA' },
        byBedCount: [
          { beds: '30–50', kva: '62.5–125 kVA', notes: 'Critical loads only — OT, ICU, emergency. Non-critical on grid.' },
          { beds: '100–200', kva: '200–320 kVA', notes: 'N+1 recommended for OT complex. Often 2 × 160 kVA or 2 × 200 kVA.' },
          { beds: '300–500', kva: '500–750 kVA', notes: '2 sets minimum. Critical on Set 1, non-critical on Set 2.' },
          { beds: '500+', kva: '750–1010+ kVA', notes: 'Multi-set. Parallel operation with synchronisation panel.' },
        ],
        redundancy: 'N+1 for OT complex is the de facto standard. Hospitals getting NABH accreditation must demonstrate N+1 for life-safety loads.',
        loadType: 'Mixed: UPS loads (ICU monitors, ventilators) at near-unity PF, motor loads (HVAC, medical air, lifts) at 0.72–0.80 PF. Size on the motor-heavy side.',
        criticalNote: 'DOL motor starts on HVAC compressors and medical air compressors: plan for 5–6× rated current inrush. KOEL 50% loading standard provides this headroom.',
      },

      painPoints: [
        {
          id: 'nabh',
          headline: 'NABH accreditation requires documented power backup compliance',
          detail: 'The NABH infrastructure standards explicitly require reliable backup power with documented test records. The NABH auditor will ask for: (a) AMF panel test certificate, (b) monthly load bank test log, (c) maintenance/service records. Hospitals without these fail the infrastructure audit — which delays or suspends accreditation.',
          salesAngle: 'KOEL provides the NABH documentation package with installation: AMF test certificate, commissioning report, recommended test schedule. No extra paperwork for the biomedical team.',
        },
        {
          id: 'amf_transfer',
          headline: 'AMF transfer time gap during power failure',
          detail: 'Standard AMF: <10 seconds. But ventilators and ECMO machines cannot tolerate even a 3–5 second gap. Most hospitals manage this with a UPS bridging the critical branch. The DG must start and reach load within 10s — and must reliably do so every single time, including on cold starts in winter.',
          salesAngle: 'KOEL AMF panels detect mains failure in <1s, engine starts in 3–5s, load transfer completes in <10s total. Cold-start tested. For zero-gap: pair with UPS on the critical branch — KOEL\'s application engineers spec this out.',
        },
        {
          id: 'acoustic',
          headline: 'Acoustic noise from patient wards and OPD areas',
          detail: 'Open-type DG sets run at 85–90 dB(A) at 1m — easily audible in adjacent wards. NABH infrastructure standards require noise levels within acceptable limits for patient recovery. Acoustic complaints can delay Occupation Certificate (OC) for new hospital wings.',
          salesAngle: 'KOEL acoustic canopy: verified <72 dB(A) @ 1m. Double-wall canopy available for <65 dB(A). Acoustic test certificate issued. Specific to patient-zone proximity installations.',
        },
        {
          id: 'aging_dg',
          headline: 'Ageing DG that has tripped multiple times in recent months',
          detail: 'An out-of-warranty DG that has tripped twice in 6 months is a known risk. The hospital administration is aware but capital budget is tied up. The next trip — if it happens during a surgery — is not a maintenance problem, it is a patient safety incident.',
          salesAngle: 'KOEL can supply within 6–8 weeks. For genuinely urgent replacements (hospital is at-risk), escalate to KOEL service for priority scheduling. Lead with the liability angle: "One incident = clinical and legal consequences far larger than the capex."',
        },
        {
          id: 'capex_constraint',
          headline: 'Board approved budget for one set; N+1 medically required',
          detail: 'Hospital trust boards often approve capex in silos — "one DG set" is in the approved list, but N+1 doubles the outlay. Facilities and biomedical team knows they need two units but can\'t push through the budget in one cycle.',
          salesAngle: 'Offer phased approach: Set 1 now sized for critical loads only. Frame agreement for Set 2 at the same price, to be executed in next FY. Hospital gets the set it needs today, board doesn\'t see a doubled capex line this year.',
        },
      ],

      talkingPoints: [
        'CPCB IV+ certification is included with delivery — your NABH auditor and pollution board inspector both need this. We hand it over with the product.',
        'No AdBlue required on KOEL sub-250 kVA range. One less consumable your biomedical team needs to stock and track.',
        'AMF transfer in <10 seconds, every time — tested at factory, re-tested at commissioning. We provide the test certificate.',
        'Silent canopy: <72 dB(A) @ 1m. Patient ward-side noise is measurable and certifiable. We\'ve done acoustic certifications for hospital accreditation audits before.',
        '600+ KOEL service touchpoints nationwide. In a medical emergency, 4-hour response time in metro cities. We don\'t staff a call centre — your nearest GOEM has an engineer nearby.',
      ],

      objections: [
        {
          objection: 'We use Cummins / always have',
          counter: 'KOEL is 10–15% below Cummins on price at equivalent kVA. More importantly: KOEL sub-250 kVA does not require AdBlue (Cummins QSB series does). AdBlue at ₹45/litre, sourced every 3 months, is an ongoing consumable your team has to manage. In a hospital, one missed AdBlue top-up → DG derate → risk during the next outage. KOEL removes that dependency entirely.',
        },
        {
          objection: 'Price is too high',
          counter: 'Show the TCO calculation. At 8 hours/day run time over 5 years, the fuel + AMC cost dwarfs the purchase price delta between KOEL and a cheaper brand. The relevant question is: which DG costs less over its life, not which has a lower sticker price. KOEL BSFC at 75% load: 0.26–0.28 L/kWh.',
        },
        {
          objection: 'Our existing DG is fine, no budget this year',
          counter: 'When was it last load-bank tested? If it hasn\'t been tested under full load in the last 6 months, you don\'t know if it will start reliably. The risk isn\'t the capital cost — it\'s the liability when it doesn\'t start. Ask to look at the AMF test log together.',
        },
      ],

      proofPoints: [
        'Apollo Hospitals, Fortis, and AIIMS New Delhi all run KOEL sets — the top three hospital chains in India.',
        'NABH documentation package: KOEL is the only genset OEM (among Indian brands) that provides a ready NABH documentation package at installation.',
        'Acoustic certifications issued for hospital-proximity installations — ask the nearest GOEM for a sample certificate.',
      ],

      leadTriggers: [
        { trigger: 'New hospital construction permit filed', source: 'Local municipal corporation, BMRDA/HMDA/DDA new building permits' },
        { trigger: 'NABH accreditation application submitted', source: 'NABH website — accreditation pipeline list is public' },
        { trigger: 'Hospital chain announcing new campus', source: 'Company press releases, LinkedIn, health ministry announcements' },
        { trigger: 'Existing DG out-of-warranty breakdown', source: 'KOEL service engineer network — they get breakdown calls first' },
        { trigger: 'OT complex expansion / new ICU wing', source: 'Hospital\'s own website, local press' },
      ],

      seasonality: 'Budget approvals in April–June (new financial year). Construction completions peak Oct–Dec. No strong seasonal pattern for breakdown-driven replacement — those are year-round.',

      competitorWatch: 'Cummins (QSB series with AdBlue — exploit the consumable angle for hospitals). Kirloskar Green (separate company; CPCB IV+ range not complete on larger kVAs). CAT (premium price, global brand — reposition on local service network density).',
    },
  },

  // ─── INDUSTRIAL / MANUFACTURING ─────────────────────────────────────────────
  industrial: {
    label: 'Industrial',
    icon: '🏭',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'Every hour of production downtime costs ₹5–50L in lost output — and multiple DOL motors restarting simultaneously after a grid restore event routinely trips undersized DG sets.',
      koelValue: 'KOEL industrial gensets are sized on the 50% loading standard — motor start headroom is built in. CPCB IV+ certified. KRM remote monitoring raises the alarm before the next power cut becomes a production stoppage.',
      references: [
        'Bajaj Auto — Chakan plant standby power, 320 kVA CPCB IV+',
        'L&T — critical process backup, Hazira complex',
        'Tata Steel — utility backup fleet, Jamshedpur',
      ],
      loadNote: 'Motor-heavy loads: PF 0.72. DOL starting draws 5–6× rated current — the genset must absorb this without voltage collapse. KOEL 50% standard: genset runs at 50% of rated load in steady state, leaving the other 50% as starting headroom. Never size an industrial genset at 80%+ steady-state load.',
    },

    cheatSheet: {
      summary: 'Industrial is KOEL\'s highest-volume segment in units sold. The buyer is practical: downtime cost is the argument that lands, not features. The competition is often a cheaper local brand or an older out-of-warranty set they\'re reluctant to replace.',

      buyerProfile: {
        decisionMaker: 'Plant Manager or Factory GM for purchases <₹25L. Plant Director or CFO for larger. In MSME: owner directly.',
        technicalInfluencer: 'Electrical Engineer or Maintenance Head (technical spec). In new factories: electrical contractor or MEP consultant who spec the genset early in construction.',
        procurementRoute: 'Direct from GOEM/dealer for MSME. Purchase order through finance for medium industry. GEM portal or tender for government/PSU facilities.',
        earlyInfluencePoint: 'Catch the electrical contractor before they finalise the switchboard/panel spec. Once they\'ve designed around a competitor brand, displacing them is hard.',
      },

      sizing: {
        kvaRange: { min: 40, typical: '160–320', max: 1010, unit: 'kVA' },
        byPlantSize: [
          { type: 'Small MSME workshop (30–80 employees)', kva: '40–82.5 kVA', notes: 'Light motor loads, basic backup. Single shift.' },
          { type: 'Mid-size factory (100–500 employees)', kva: '125–320 kVA', notes: 'Multiple DOL motors. PF 0.72 dominant. 2 shifts.' },
          { type: 'Large manufacturing plant', kva: '500–1010 kVA', notes: 'Often HT supply. Synchronisation with HT/LT transformer needed.' },
          { type: 'Pharma / food processing (critical)', kva: '200–500 kVA', notes: 'Prime power or near-prime. High run hours (12–18 hr/day).' },
        ],
        redundancy: 'Standby (N) in most manufacturing. N+1 only in pharma, food, and auto assembly where line stoppage cost is extreme.',
        loadType: 'Motor-dominated: PF 0.72–0.80. DOL start inrush: 5–6× full load current. Critical to account for simultaneous restart scenario — all motors restart at once after grid restore.',
        criticalNote: 'Overloaded DG (running at >85% steady-state load) will trip the moment multiple motors restart simultaneously. This is the #1 genset complaint in Indian industrial plants. KOEL 50% standard directly solves this.',
      },

      painPoints: [
        {
          id: 'dol_trip',
          headline: 'Multiple DOL motors restart simultaneously — DG trips every time',
          detail: 'When grid power returns after an outage, all motors that were running restart simultaneously. Each DOL motor draws 5–6× its full load current at start. Three 15 kW motors starting together create a momentary demand of 270–300 kW — triple the steady-state load. An undersized or heavily loaded genset collapses under this and trips on undervoltage.',
          salesAngle: 'KOEL 50% loading standard: if block load is 150 kW steady-state, we size a 320 kVA (256 kW) genset. At 50% steady state, we have 128 kW of headroom for start surge. We verify the calculation at the site visit — if there\'s a specific DOL starting problem, KOEL application engineers can also specify a controlled restart relay sequence.',
        },
        {
          id: 'downtime_cost',
          headline: 'Production downtime cost calculation',
          detail: 'Typical manufacturing downtime cost: ₹5–50L/hr depending on industry. Auto assembly: ₹20–50L/hr. FMCG: ₹5–15L/hr. Pharma (batch spoilage): ₹10–30L per batch. The purchase price of a genset is recovered in 1–3 downtime incidents.',
          salesAngle: 'Ask the maintenance head or plant manager: "What does one hour of production stoppage cost you?" Get the number. Then show it against the KOEL purchase price. The TCO argument writes itself.',
        },
        {
          id: 'cpcb_compliance',
          headline: 'CPCB IV+ emission compliance audit',
          detail: 'CPCB inspectors visit large industrial facilities with DG sets. They check: (a) CPCB Type Approval Certificate number, (b) stack emission test records, (c) DG logbook. Plants running pre-CPCB-IV+ sets without the right documentation face fines and shutdown notices.',
          salesAngle: 'KOEL provides the full CPCB IV+ documentation file at delivery. For replacement: we issue the Type Approval certificate number immediately. No waiting for paperwork.',
        },
        {
          id: 'overloaded',
          headline: 'Existing DG running at >85% load, frequent trips during peak shift',
          detail: 'When a plant adds a new machine or production line, the existing DG gets pushed to its limit. Running at 85–95% load means zero headroom for any transient. The DG trips on overload at the worst possible time — peak production.',
          salesAngle: 'This is a displacement sale. Show the customer their current DG\'s loading vs. the new block load. The existing set is now undersized. Offer a trade-in or a parallel installation discussion.',
        },
        {
          id: 'solar_hybrid',
          headline: 'Solar PV installation planned — anti-islanding concern',
          detail: 'Plants adding rooftop solar must deal with anti-islanding: when the DG is running as an island (no grid), the solar inverter must detect this and shut down to prevent feeding into the DG. If this is not configured correctly, the DG and solar inverter can fight for voltage control, causing faults.',
          salesAngle: 'KOEL application engineers spec the anti-islanding relay and inverter interlock as part of the installation scope. This is not an extra cost — it\'s included in the site survey and commissioning.',
        },
      ],

      talkingPoints: [
        'The 50% loading standard is not conservative sizing — it\'s the only way to guarantee your DOL motors start without tripping the set. Show the calculation on a napkin if needed.',
        'CPCB IV+ certification + emission compliance file: ready for your next inspector visit. We include it with the delivery note.',
        'KOEL engines: 0.26–0.31 L/kWh at 75% load. At your 8 hours/day, 250 days/year profile, that\'s X litres/year — here\'s the 5-year fuel cost vs. the competition.',
        'KRM remote monitoring: your maintenance team gets an SMS if fuel runs below 30%, battery is weak, or the engine throws a fault code. No more surprises during the next grid failure.',
        'Indian-made engine and alternator. Spares are in stock at your nearest KOEL GOEM. No import wait time for a critical part.',
      ],

      objections: [
        {
          objection: 'Kirloskar Green / local brand is cheaper',
          counter: 'Kirloskar Green and KOEL are separate companies (different parent group). KOEL (Kirloskar Oil Engines Ltd) is CPCB IV+ across the full range up to 1010 kVA. Green\'s CPCB IV+ coverage is not complete at larger kVAs. For compliance, KOEL is the safer choice. On TCO: cheaper upfront price often means higher BSFC (fuel cost) over the life of the set.',
        },
        {
          objection: 'We\'ll manage with the existing DG / no capex budget this year',
          counter: 'Ask when the last load bank test was done. If the set hasn\'t been tested under full load in the last 6 months, its actual starting capability is unknown. For a plant where one downtime incident costs ₹X lakhs, is it worth that risk to save the capex this year?',
        },
        {
          objection: 'We\'re adding solar — DG will be less needed',
          counter: 'Solar reduces run hours — it doesn\'t eliminate the DG requirement. The DG is the fallback for when the grid fails at night, or during cloudy periods, or when the battery (if any) is depleted. If anything, a hybrid setup means your DG will be starting from cold more often — exactly when reliable AMF start performance matters most.',
        },
      ],

      proofPoints: [
        'Bajaj Auto (Chakan), L&T (Hazira), Tata Steel (Jamshedpur) — credible names in manufacturing that use KOEL.',
        '50% loading standard with documented motor start calculations — no competitor provides this level of application engineering at the dealer level.',
        'KRM case: plant at [X] was getting nuisance trips on Friday nights when no maintenance staff were present. KRM alert system flagged low coolant, rep called before the weekend — avoided a breakdown.',
      ],

      leadTriggers: [
        { trigger: 'New factory construction or MIDC/GIDC allotment', source: 'Government gazette, industrial estate development authority notifications' },
        { trigger: 'Production expansion announcement', source: 'Company LinkedIn, press releases, local business news' },
        { trigger: 'Environmental compliance notice or CPCB inspection', source: 'CPCB regional office notifications, plant manager mentions' },
        { trigger: 'Existing DG breakdown or service refusal (out-of-warranty)', source: 'KOEL service engineer network — breakdown calls are lead indicators' },
        { trigger: 'New production line addition (load increase)', source: 'Plant manager conversation, machinery dealer who supplied the new line' },
      ],

      seasonality: 'New FY capex approvals: April–June. Large investments often planned Q3 (Oct–Dec) for commissioning before summer when grid is weakest. Textile: post-monsoon. Auto ancillary: tied to OEM model year cycle.',

      competitorWatch: 'Kirloskar Green (separate company — clarify this clearly), Cummins (AdBlue angle), Mahindra Powerol (weaker service network Tier-2/3), CAT (premium price, justifiable only for very large plants with CAT loyalty).',
    },
  },

  // ─── DATA CENTRE ────────────────────────────────────────────────────────────
  datacentre: {
    label: 'Data Centre',
    icon: '🖥️',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'Any power outage means SLA breach, tenant penalty clauses, and reputational damage. Tier III requires N+1 redundancy — and the genset must start within 10 seconds, every time, to stay within the UPS battery window.',
      koelValue: 'KOEL Optiprime HHP delivers 40% fuel saving at part-load — the dominant DC duty profile — directly improving PUE. N+1 matched-pair supply with synchronised AMF panels. KRM monitoring with NOC integration.',
      references: [
        'NTT Data Centres — Tier III+, Mumbai, 2N configuration (2 × 750 kVA Optiprime HHP)',
        'Tata Communications — mission-critical DC infrastructure, Chennai',
        'CtrlS Datacenters — multi-MW installation, Hyderabad',
      ],
      loadNote: 'UPS presents near-unity PF (0.90–0.95). Size for UPS recharge surge on utility restore (adds ~15–20% transient load). N+1 for Tier III; 2N for Tier IV. Optiprime HHP recommended for 500+ kVA DC applications where PUE is a KPI.',
    },

    cheatSheet: {
      summary: 'Data centre buyers are the most technically demanding genset buyers. They run reliability simulations, read whitepapers, and have infrastructure architects who will spot a weak application. The commercial argument (Optiprime, PUE, TCO) is as important as the technical compliance argument.',

      buyerProfile: {
        decisionMaker: 'CTO / Head of Infrastructure for enterprise DC. COO or Infra Director for colocation DC. Large hyperscale: committee procurement with strict RFQ.',
        technicalInfluencer: 'Data Centre Infrastructure Manager (DCIM), MEP consultant, EPC contractor. In many Indian DCs, a global consulting firm (Schneider, Vertiv, Siemens) specs the electrical infrastructure.',
        procurementRoute: 'RFQ/tender with technical specification for large DCs. Direct purchase for enterprise (internal IT) DC. KOEL must get spec-in before the EPC contractor finalises the electrical design.',
        earlyInfluencePoint: 'The infra architect and MEP consultant. Get KOEL\'s Optiprime HHP into the specification early — once a CAT or Cummins set is spec\'d in, displacing it requires a formal substitution approval with performance data.',
      },

      sizing: {
        kvaRange: { min: 125, typical: '500–1010', max: 4000, unit: 'kVA (multiple parallel sets for hyperscale)' },
        byDcType: [
          { type: 'Enterprise edge DC (branch / office)', kva: '40–125 kVA', notes: 'UPS room backup. Single set.' },
          { type: 'Enterprise DC (100–500 kW IT load)', kva: '250–750 kVA N+1', notes: 'Two sets. Synchronised AMF. Optiprime for part-load efficiency.' },
          { type: 'Colocation / Tier III', kva: '750–1010 kVA N+1 or 2N', notes: 'Parallel sets with load sharing panel. KRM integration to NOC.' },
          { type: 'Hyperscale', kva: '1010 kVA × multiple', notes: 'Paralleled sets in N+1 or 2N. PUE optimisation critical.' },
        ],
        redundancy: 'Tier III: N+1. Tier IV: 2N. Most India colocation DCs target Tier III. KOEL supplies matched-model pairs for N+1 — same commissioning, same AMC, same spare parts.',
        loadType: 'UPS-fed server load: near-unity PF (0.90–0.95). HVAC compressors: PF 0.72–0.80 motor load. Blend both when sizing. UPS recharge surge on restore: allow for 15–20% above steady-state.',
        criticalNote: 'DC gensets typically run at 30–50% of rated capacity in steady state. At this part-load, conventional gensets have poor BSFC — wet stacking and inefficiency. Optiprime HHP is purpose-designed for this profile: twin-pack technology with one cylinder bank active at low load.',
      },

      painPoints: [
        {
          id: 'sla_breach',
          headline: 'Tenant SLA breach if power fails',
          detail: 'Colocation DCs have contractual SLA with tenants (cloud providers, enterprises): 99.999% uptime = <5 minutes of downtime per year. One genset failure that allows a power gap = SLA breach = penalty invoice + tenant churn. The cost of one failure dwarfs the cost of premium infrastructure.',
          salesAngle: 'KOEL AMF: <10s start-to-load-transfer. Factory-tested. Re-tested at commissioning with a witnessed start. Certificate issued. This is the documentation your tenant SLA audit requires.',
        },
        {
          id: 'ups_window',
          headline: 'Genset must start within UPS battery autonomy window',
          detail: 'UPS batteries in DCs are typically sized for 10–15 minutes at full load. The genset must start and reach stable output before the UPS exhausts its battery. If the genset takes 15 seconds vs. 10 seconds, it\'s still within window — but a marginal set that takes 25–30 seconds (possible when cold, or when battery is weak) is catastrophic.',
          salesAngle: 'KOEL genset start time to rated voltage: 5–7 seconds from crank, load transfer within 10 seconds total. Cold-start tested at factory. Battery condition is monitored by KRM — your NOC gets an alert if the start battery voltage degrades below threshold.',
        },
        {
          id: 'pue_impact',
          headline: 'PUE optimisation is a board-level KPI',
          detail: 'DCs publish PUE (Power Usage Effectiveness) in sustainability reports. PUE = Total DC power / IT load power. A genset running at 30% load with BSFC of 0.35 L/kWh vs. Optiprime at 0.22 L/kWh = material difference in energy consumed per kWh of IT load = worse PUE. For a DC targeting PUE 1.4 or below, this matters.',
          salesAngle: 'Optiprime HHP at 30% load: ~0.22 L/kWh vs. conventional genset ~0.34 L/kWh. At 500 kVA running 8,760 hours/year at 35% load: ~₹48L/year fuel saving. Over 5 years: ₹2.4 Cr. The Optiprime premium pays back in <18 months at DC run profiles.',
        },
        {
          id: 'fuel_storage',
          headline: 'Limited on-site fuel storage',
          detail: 'Many urban DCs can store only 2,000–4,000 litres of diesel on-site due to fire regulations (NFPA/NBC) and space constraints. A 500 kVA set at 50% load burns ~80 L/hr. 4,000L = 50 hours of runtime. For a DC expected to sustain through a 48–72 hour grid outage, this is insufficient without a fuel delivery arrangement.',
          salesAngle: 'KRM fuel level monitoring: when tank drops below a set threshold, KRM sends an alert to the facility team and can trigger an automated fuel ordering workflow. KOEL\'s application engineers can spec a day tank + bulk tank arrangement to meet the NBC fuel storage limits while ensuring extended runtime.',
        },
        {
          id: 'tier_documentation',
          headline: 'Uptime Institute Tier III / ISO 22237 documentation trail',
          detail: 'Tier III certification by the Uptime Institute requires documented evidence of concurrent maintainability — including the genset starting capability, fuel logistics, and service SLA. The auditor will request start test logs, AMF test records, and service contract terms.',
          salesAngle: 'KOEL provides the complete documentation package: AMF test certificate, commissioning report, start-time test log (witnessed), CPCB IV+ Type Approval, and AMC terms with response SLA. Everything needed for the Tier III certification trail in one binder.',
        },
      ],

      talkingPoints: [
        'Optiprime HHP: twin-pack technology specifically for the 30–50% part-load DC profile. 40% fuel saving vs. conventional genset. No other Indian OEM offers this.',
        'N+1 matched-pair supply — same model, same AMC, same spare parts inventory. Reduces your operational complexity vs. running two different brands.',
        'KRM monitoring integrates with standard DCIM protocols. Fuel level, battery voltage, run hours, fault codes — visible on your NOC screen. We can spec the data integration as part of commissioning.',
        'CPCB IV+ documentation for the full certification trail. Your Tier III auditor will see a clean file.',
        'KOEL service SLA: 4-hour response in metros. This goes into your DC\'s critical supplier documentation.',
      ],

      objections: [
        {
          objection: 'Our DC spec calls for CAT / Cummins — they\'re the standard in data centres globally',
          counter: 'NTT, Tata Communications, and CtrlS — all credible DC operators — run KOEL Optiprime. The key differentiator is part-load efficiency: CAT and Cummins do not have an equivalent to Optiprime HHP at this price point for the Indian market. If PUE is a KPI, do a side-by-side BSFC comparison at 30% load profile.',
        },
        {
          objection: 'We haven\'t finalised our N+1 vs. 2N decision yet',
          counter: 'Start with N+1 configuration, place a framework order for the second set. KOEL guarantees model availability for 7 years after initial supply — if you decide to go 2N in 18 months, you get a matched unit at the same spec. No need to let the infrastructure decision hold up the procurement.',
        },
        {
          objection: 'Our UPS vendor (Vertiv / Schneider) recommends CAT for compatibility',
          counter: 'UPS-genset compatibility is about transfer time and voltage regulation — not brand. KOEL\'s AMF panel is fully compatible with Vertiv and Schneider UPS systems. We can provide the compatibility test data. Your UPS vendor is recommending what they\'re familiar with — a joint commissioning test will demonstrate compatibility.',
        },
      ],

      proofPoints: [
        'NTT Data Centres (Mumbai) and CtrlS (Hyderabad) are publicly known large DC operators using KOEL. Both are credible references for a DC buyer.',
        'Optiprime HHP BSFC data at 30% load: available on request from KOEL. This is the number that settles the PUE argument.',
        'Tier III documentation binder — we can show a sample to the infra architect before the RFQ closes.',
      ],

      leadTriggers: [
        { trigger: 'New DC construction permit in Hyderabad, Mumbai, Bengaluru, Chennai, Pune, Delhi NCR', source: 'DatacenterDynamics India news, NASSCOM DC tracker, local building permit databases' },
        { trigger: 'Cloud provider announcing new India AZ or region (AWS, Azure, GCP, Oracle)', source: 'Tech press — cloud capacity announcements drive colocation DC expansion within 18–24 months' },
        { trigger: 'Enterprise company announcing IT consolidation or new office campus', source: 'Corporate press releases, LinkedIn, real estate leasing news' },
        { trigger: 'Existing DC going for Uptime Institute Tier III certification', source: 'Uptime Institute certification pipeline (sometimes announced by the DC)' },
        { trigger: 'DC operator publishing poor PUE in sustainability report', source: 'Company sustainability reports — a high PUE (>1.6) signals need for infrastructure review' },
      ],

      seasonality: 'DC investments are tied to IT budget cycles (typically Q4 of calendar year = Oct–Dec). Hyperscale expansions are driven by cloud growth and have no strong seasonality. Enterprise DC: April–June (new FY capex unlocked).',

      competitorWatch: 'CAT (global standard, strong brand, no Indian-specific part-load advantage). Cummins HHP series (comparable to Optiprime but more expensive, requires AdBlue on larger kVAs). Aggreko (rental model — relevant if the DC is phasing capacity and doesn\'t want capex).',
    },
  },

  // ─── TELECOM ─────────────────────────────────────────────────────────────────
  telecom: {
    label: 'Telecom',
    icon: '📡',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'Tower downtime triggers SLA breach and revenue penalties — operators track uptime to the second. Grid outages in rural and semi-urban zones can last 6–12 hours, and a flat battery ends in a downed tower.',
      koelValue: 'KOEL tower-rated gensets: <10s AMF, CPCB IV+ certified, compact footprint for tower shelter cabinets. 24×7 service with GOEMs covering Tier-2/3 geographies where most tower downtime occurs.',
      references: [
        'Reliance Jio — 1,200+ tower sites, Maharashtra',
        'Indus Towers — critical site backup fleet, pan-India',
        'BSNL — rural tower infrastructure, northern India',
      ],
      loadNote: 'Typical BTS tower: 3–8 kW running load. 5G small cells: 1–3 kW each. Size for future BTS expansion (plan for 2× current load). Prime power mode for off-grid sites: duty cycle matters for BSFC.',
    },

    cheatSheet: {
      summary: 'Telecom is a volume + fleet play. Individual tower sets are small (7.5–25 kVA) but operators buy in batches of 50–500 units. Win the pilot → win the fleet order. The key buyer is the infrastructure team at the tower company (Indus, ATC, Summit) or the operator\'s operations team.',
      buyerProfile: {
        decisionMaker: 'Infrastructure Director / Head of Network Operations at tower company. For operators: VP Engineering or Infra head.',
        technicalInfluencer: 'Site acquisition team, regional infra managers.',
        procurementRoute: 'Framework/rate contract procurement for large operators. Single-site purchase for ISPs and smaller operators.',
        earlyInfluencePoint: 'National-level framework contract with Indus Towers or ATC India unlocks hundreds of sites. Pilot one region, then reference it for the national rate contract.',
      },
      sizing: { kvaRange: { min: 7.5, typical: '7.5–25', max: 62.5, unit: 'kVA' }, criticalNote: 'Prime power sets for off-grid sites must be rated for continuous duty — not standby-rated.' },
      painPoints: [
        { id: 'sla', headline: 'Tower downtime = SLA penalty', detail: 'Operators pay penalty per minute of tower downtime to enterprise customers. A 2-hour outage in a cluster can cost ₹5–10L in SLA deductions.' },
        { id: 'remote', headline: 'Remote site servicing cost', detail: 'Engineer visits to remote tower sites cost ₹3,000–8,000 per visit including travel. An unreliable genset requiring frequent visits erodes the entire margin on that site.' },
        { id: 'bess', headline: 'Battery storage (BESS) being evaluated as DG alternative', detail: 'Tower companies are evaluating BESS to reduce diesel cost and capex. DG remains the fallback but the sales case must now include a hybrid or TCO argument against BESS.' },
      ],
      talkingPoints: [
        'KOEL 7.5–25 kVA range is CPCB IV+ certified — compliant for any state pollution board.',
        'Compact footprint: fits standard tower shelter space without civil modification.',
        'KRM monitoring can be integrated into tower NOC via API — fuel level and run-hour data visible centrally.',
        'KOEL has 600+ service touchpoints — more Tier-2/3 city coverage than any competitor. Remote site breakdown response is faster.',
      ],
      objections: [{ objection: 'BESS is better for our sustainability target', counter: 'BESS needs grid or solar to charge. In deep rural where grid reliability is below 12 hours/day, BESS alone fails — DG is still needed as the fallback. Hybrid: BESS + smaller DG (for recharge + emergency) is the right model, and KOEL can spec it.' }],
      leadTriggers: [
        { trigger: '5G rollout site announcements by DoT', source: 'DoT spectrum auction results, tower company investor presentations' },
        { trigger: 'Tower company capex budget cycle (Q1 planning)', source: 'Annual reports, investor calls' },
      ],
      seasonality: 'Tower deployments peak ahead of monsoon (Feb–April) and post-monsoon (Oct–Nov). Summer = grid stress = more tower outages = genset need more visible.',
      competitorWatch: 'Cummins (strong in telecom nationally, main competitor). Kirloskar Green (active in tower segment). Price war common — differentiate on service density and KRM integration.',
    },
  },

  // ─── REAL ESTATE ─────────────────────────────────────────────────────────────
  realestate: {
    label: 'Real Estate',
    icon: '🏢',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'Lift, water pump, and common area power failures during grid outages directly hurt resident experience scores — and in premium projects, a single viral complaint can damage the developer\'s brand.',
      koelValue: "KOEL's compact CPCB IV+ range fits standard basement equipment rooms. Low-noise acoustic canopy ensures resident comfort. RERA-compliant cost and delivery documentation provided.",
      references: [
        'Godrej Properties — residential township, Pune',
        'Brigade Cornerstone Utopia — 3-tower configuration, Bengaluru',
        'Prestige Group — mixed-use developments',
      ],
      loadNote: 'Common area load = 40–60% of total installed kVA (lifts, pumps, corridor lighting, security). Size correctly — oversizing leads to wet stacking at <25% load, which causes engine damage.',
    },

    cheatSheet: {
      summary: 'Real estate is a developer-driven sale during construction, and an RWA/facility-driven sale post-possession. The construction phase is where KOEL gets spec\'d in — after that, the facility team runs AMC. Win the developer, keep the AMC.',
      buyerProfile: {
        decisionMaker: 'Project Manager / Electrical contractor during construction. Facility Manager for AMC after possession.',
        technicalInfluencer: 'MEP consultant who designs the electrical system. RERA documentation requirements sometimes force the developer to specify genset details in cost breakup.',
        procurementRoute: 'Direct from electrical contractor (who specs and buys). For large township: developer floats RFQ.',
        earlyInfluencePoint: 'MEP consultant and electrical contractor — catch them at project design stage.',
      },
      sizing: { kvaRange: { min: 62.5, typical: '125–320', max: 750, unit: 'kVA' }, criticalNote: 'Avoid wet stacking: don\'t size a set for <25% steady-state load. Common error is oversizing for future load that never materialises.' },
      painPoints: [
        { id: 'noise', headline: 'RWA noise objection — OC at risk', detail: 'Residents\' Welfare Associations frequently raise noise objections to DG sets placed near residential blocks. If the OC is pending, one noise complaint to the local civic authority can delay it by months.' },
        { id: 'rera', headline: 'RERA cost breakup requires genset details', detail: 'Under RERA, developer must include DG set cost and delivery schedule in the approved cost structure document. Any deviation requires amendment — which delays approvals.' },
      ],
      talkingPoints: [
        'KOEL acoustic canopy: <72 dB(A) @ 1m. RWA noise objection pre-empted with a certifiable number.',
        'RERA cost and delivery schedule document issued with purchase order — builder can directly file it with the RERA authority.',
        'Compact footprint: standard basement equipment room accommodates KOEL silent canopy without additional civil work.',
      ],
      objections: [{ objection: 'Contractor has already specified a cheaper brand', counter: 'Ask for the noise level spec in the competitor\'s quotation. If it\'s not certified below 72 dB(A), the RWA objection risk is not mitigated. KOEL canopy has the certification on paper.' }],
      leadTriggers: [
        { trigger: 'New residential project RERA registration', source: 'RERA state portals — new project registrations are public' },
        { trigger: 'Construction reaching electrical/MEP stage (60–70% complete)', source: 'Site visit / electrical contractor network' },
      ],
      seasonality: 'Possession deadlines drive purchases: Q4 (Jan–Mar) and Q2 (Jul–Sep) are common possession months — genset orders arrive 3–4 months before.',
      competitorWatch: 'Kirloskar Green (active in real estate). Cummins (premium end). Mahindra Powerol (price aggressive). Differentiate on acoustic certification, RERA documentation, and CPCB IV+.',
    },
  },

  // ─── HOSPITALITY ──────────────────────────────────────────────────────────────
  hospitality: {
    label: 'Hospitality',
    icon: '🏨',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'A power cut during a guest\'s stay results in complaints, compensation claims, and review-platform damage that is disproportionate to the actual downtime. A 5-star property cannot afford a visible or audible generator.',
      koelValue: 'KOEL acoustic canopy gensets: <72 dB(A) @ 1m, seamless AMF transfer. Silent operation in guest-facing locations. CPCB IV+ for heritage conservation zone compliance.',
      references: [
        'ITC Hotels — 8 flagship properties, acoustic canopy installations',
        'Marriott India — standby fleet with noise-certified canopy',
        'Taj Hotels — heritage property backup, visual screening enclosure',
      ],
      loadNote: 'F&B refrigeration (cold kitchen, wine cellar, ice machines) must not lose power even momentarily — wire these on the critical AMF branch. Account for EV charger load in new-build hotels (this is now a planning requirement in several states).',
    },

    cheatSheet: {
      summary: 'Hospitality buyers care most about guest experience — noise, aesthetics, and seamless power transfer. Technical specs come second. The GM is the key contact; the Chief Engineer is the technical validator.',
      buyerProfile: {
        decisionMaker: 'Hotel GM or Group Head of Engineering for hotel chains. For standalone properties: owner/promoter.',
        technicalInfluencer: 'Chief Engineer (decides technical spec). For new builds: MEP consultant and architect (visual screening requirements).',
        procurementRoute: 'Direct purchase for standalone. Hotel chain: centralised procurement with technical approval from group engineering head.',
        earlyInfluencePoint: 'Group Engineering head for chains — one approval unlocks the entire property portfolio.',
      },
      sizing: { kvaRange: { min: 62.5, typical: '125–250', max: 500, unit: 'kVA' }, criticalNote: 'Heritage conservation zones have strict appearance requirements for external equipment. Acoustic canopy must be screened or aesthetically treated.' },
      painPoints: [
        { id: 'noise', headline: 'Guest-audible noise from DG set', detail: 'A 5-star guest complaining about generator noise on a booking platform (TripAdvisor, Google) causes brand damage that lasts for years. The GM wants a written noise guarantee.' },
        { id: 'fb_refrigeration', headline: 'F&B refrigeration losing power during transfer', detail: 'Cold kitchen, wine cellar, ice machines cannot tolerate even a 2–3 second gap. A spoiled wine cellar is a ₹5–15L loss. Wire this on the critical AMF branch with UPS bridge.' },
      ],
      talkingPoints: [
        'KOEL acoustic canopy: <72 dB(A) @ 1m with certificate. Your GM can show this to a guest who complains — it\'s a documented specification, not a verbal assurance.',
        'Seamless AMF: guest experiences no flicker or interruption. Lifts, corridor lighting, and F&B refrigeration stay powered throughout.',
        'Heritage zone: we have experience with visual screening enclosures fabricated to conservation guidelines. Our application engineer can meet the conservation committee.',
      ],
      objections: [{ objection: 'CAT is the brand we use across the group', counter: 'CAT is strong globally. On acoustic performance at this kVA range, KOEL\'s canopy spec is equivalent — with a local service network that responds faster for a hotel that cannot afford unplanned downtime. Also: no AdBlue on KOEL sub-250 kVA — one less item for your chief engineer to manage.' }],
      leadTriggers: [
        { trigger: 'New hotel construction or renovation project', source: 'Municipal building permits, hospitality news portals (HospitalityBiz India)' },
        { trigger: 'Hotel chain announcing new property opening', source: 'Company press releases, LinkedIn' },
      ],
      seasonality: 'Hotel properties tend to prepare for major events or tourist seasons. Pre-summer (Feb–Mar) and pre-New Year (Oct–Nov) are when facility upgrades happen.',
      competitorWatch: 'CAT (global brand preference in 5-star). Cummins (strong in hospitality segment). Differentiate on Indian service density, acoustic certification, and no-AdBlue simplicity.',
    },
  },

  // ─── RETAIL ──────────────────────────────────────────────────────────────────
  retail: {
    label: 'Retail',
    icon: '🛒',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'POS failure, dark refrigeration aisles, and non-functioning AC during a grid outage drives customers out of the store in under 5 minutes — and retail chains track every lost transaction.',
      koelValue: "KOEL's 40–160 kVA compact range suits retail backrooms. AMF keeps POS counters live. CPCB IV+ certified. For store rollouts, framework AMC agreements cover multiple outlets under one contract.",
      references: [
        'Reliance Retail — 50+ outlets, West zone, framework AMC',
        'D-Mart — standardised backup power across distribution centres',
        'BigBazaar — store power management, prime power mode at select locations',
      ],
      loadNote: 'Refrigerated display aisles have PFC (power factor correction) capacitors on the bus — reactive power interaction with the DG must be addressed with a capacitor-switching relay. Some stores run on DG prime power mode (no grid) — size for 12–16 hr/day duty cycle.',
    },

    cheatSheet: {
      summary: 'Retail is a rollout play. A chain pilot-tests KOEL at 2–3 outlets; if satisfied, the framework agreement for the next 50 outlets follows. Win the pilot carefully — this is the real prize.',
      buyerProfile: {
        decisionMaker: 'Head of Facilities / VP Operations for chains. Store owner for standalone retail.',
        technicalInfluencer: 'Electrical contractor (who wires the store). Facilities head is the key internal champion for the framework agreement.',
        procurementRoute: 'Centralised for chains (procurement team with facilities head). Direct for standalone stores.',
        earlyInfluencePoint: 'Facilities head — build the relationship before the rollout announcement.',
      },
      sizing: { kvaRange: { min: 20, typical: '40–82.5', max: 160, unit: 'kVA' }, criticalNote: 'Check for PFC capacitors on the bus — reactive power interaction requires a capacitor-switching relay in the AMF panel.' },
      painPoints: [
        { id: 'rollout', headline: 'Chain wants consistent spec across all outlets', detail: 'A retail chain procurement head wants one model, one AMC rate, one point of contact across all stores in a city or zone. A patchwork of brands is operationally unmanageable.' },
        { id: 'prime_power', headline: 'Store runs on DG-only supply in some markets', detail: 'In Tier-3 towns with poor grid quality, some stores run the DG 12–16 hours/day. This is prime power, not standby — the DG must be rated for continuous duty, not just standby kVA rating.' },
      ],
      talkingPoints: [
        'Framework AMC across all your city outlets — one AMC contract, one point of contact, one service SLA.',
        'KOEL sub-250 kVA: no AdBlue. Your store maintenance staff doesn\'t need to manage AdBlue stocks.',
        'Pilot 3 outlets → verify performance → framework agreement for remaining rollout at guaranteed price.',
      ],
      objections: [{ objection: 'We need 3 competitive quotes as per procurement policy', counter: 'Understood. On TCO: KOEL at 0.27 L/kWh vs. competitor at 0.32 L/kWh. At your 8 hrs/day run-time across 50 outlets, the fuel saving over 5 years is ₹X lakhs. Also: single-brand AMC across all outlets vs. managing multiple OEM relationships. Put this in the quote.' }],
      leadTriggers: [
        { trigger: 'Retail chain announcing new city/zone expansion', source: 'Company announcements, real estate leasing news (JLL, CBRE)' },
        { trigger: 'Store renovation / refurbishment cycle', source: 'Facilities head conversation, electrical contractor network' },
      ],
      seasonality: 'Retail capex before festive season (Sep–Oct) and new store openings post-monsoon.',
      competitorWatch: 'Mahindra Powerol (aggressive pricing in retail). Kirloskar Green. Differentiate on framework AMC, no-AdBlue, and CPCB IV+ compliance for chain procurement.',
    },
  },

  // ─── EDUCATION ───────────────────────────────────────────────────────────────
  education: {
    label: 'Education',
    icon: '🎓',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'Exam day power failure at a board exam centre or university puts thousands of students at risk and triggers regulatory investigation — the principal or VC faces personal accountability.',
      koelValue: 'KOEL CPCB IV+ range suits the frequent short-run campus duty cycle. ATS transfer <5s protects exam servers and lab databases. Anti-islanding protection available for campuses with rooftop solar.',
      references: [
        'IIT Bombay — campus standby fleet with anti-islanding for rooftop solar',
        'Manipal University — multi-building campus, centralised AMF',
        'Symbiosis International — exam infrastructure, compliance certificate',
      ],
      loadNote: 'Usage: 4–8 hr/day during working hours with long idle periods. BSFC at 75% load is the right operating point. Anti-islanding protection mandatory if campus has rooftop solar PV.',
    },

    cheatSheet: {
      summary: 'Education buyers are driven by compliance (board exam status, university affiliation) and by a specific fear: exam-day failure. The purchase decision is often reactive — something went wrong or a compliance requirement is due. Budget is constrained (especially government-aided institutions).',
      buyerProfile: {
        decisionMaker: 'Principal or Vice-Chancellor. For government institutions: purchase committee (GFR process above ₹1L).',
        technicalInfluencer: 'Campus Electrical Supervisor / IT Head for server rooms.',
        procurementRoute: 'Government-aided institutions: GFR rules, GeM portal for >₹1L. Private: direct purchase.',
        earlyInfluencePoint: 'Catch before the academic year begins (March–April). Exam season drives urgency.',
      },
      sizing: { kvaRange: { min: 20, typical: '62.5–125', max: 250, unit: 'kVA' }, criticalNote: 'If campus has rooftop solar, anti-islanding protection is mandatory — specify this in the AMF panel design.' },
      painPoints: [
        { id: 'exam_day', headline: 'Board exam day power failure', detail: 'A power failure during a CBSE, ICSE, or university exam triggers a report to the board, possible cancellation, and the principal is called to explain. The fear of this drives the purchase decision.' },
        { id: 'affiliation', headline: 'University affiliation requires certified power backup', detail: 'University affiliation letters for new schools and colleges specify that a certified power backup system must be in place. No compliance = no affiliation = no operations.' },
      ],
      talkingPoints: [
        'ATS transfer <5s: exam servers and lab databases don\'t see a power gap.',
        'CPCB IV+ certification included — your university affiliation compliance file is clean.',
        'Anti-islanding protection for solar PV — campus can run solar and DG without inverter conflict.',
      ],
      objections: [{ objection: 'GeM portal price is lower from another vendor', counter: 'KOEL is also GeM-listed. Compare the CPCB IV+ status, warranty terms, and service SLA alongside the price. A cheaper set that trips during exam day is not a saving — it\'s a liability.' }],
      leadTriggers: [
        { trigger: 'New school or college construction (UGC/AICTE approval)', source: 'State education department approvals' },
        { trigger: 'University affiliation renewal cycle', source: 'State university affiliation calendar' },
      ],
      seasonality: 'Purchases before academic year start (March–May). Exam season urgency: Jan–March (board exams). Q1 FY capex for government institutions.',
      competitorWatch: 'GeM portal has multiple low-price bidders. KOEL must ensure its GeM listing is current and CPCB IV+ certification is uploaded.',
    },
  },

  // ─── BANKING ─────────────────────────────────────────────────────────────────
  banking: {
    label: 'Banking',
    icon: '🏦',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'Core banking system downtime freezes ATMs, trading terminals, and teller operations across the branch network — RBI mandates and SLA with enterprise customers make any downtime a regulatory and reputational event.',
      koelValue: 'KOEL UPS-compatible gensets with optional KRM monitoring (offline logging for security-policy compliance). BCP RTO test certificate issued for core banking audit. City-fleet AMC for multi-branch SLA.',
      references: [
        'State Bank of India — regional data centre backup fleet',
        'HDFC Bank — 87-branch city fleet AMC, 4-hour response SLA',
        'ICICI Bank — trading and core banking infrastructure backup',
      ],
      loadNote: 'UPS + server load: near-unity PF (0.90+). Size for UPS recharge surge on grid restore (adds ~15–20%). KRM monitoring — if bank IT security policy prohibits internet-connected devices on premises, opt for offline data logging with periodic download.',
    },

    cheatSheet: {
      summary: 'Banking is a fleet + AMC play. A bank with 50–200 branches in a city is a large recurring AMC customer. The individual branch DG is small (20–62.5 kVA) but the fleet is the prize. RBI mandates on uptime documentation make the BCP certificate a tangible sales hook.',
      buyerProfile: {
        decisionMaker: 'Head of Branch Operations / Facilities Head for branch fleet. CTO / Head of Infrastructure for DC backup.',
        technicalInfluencer: 'IT Security team (for monitoring device approval). Regional Facilities Manager.',
        procurementRoute: 'Central procurement for large banks. Regional for smaller banks/NBFCs.',
        earlyInfluencePoint: 'Propose city-fleet AMC with a single SLA — operations head can approve this without going to HO if structured as AMC (opex), not capex.',
      },
      sizing: { kvaRange: { min: 20, typical: '25–62.5 (branch) / 320–500 (DC)', max: 750, unit: 'kVA' }, criticalNote: 'IT security policy may block internet-connected KRM — specify offline logging variant.' },
      painPoints: [
        { id: 'rto', headline: 'BCP audit requires documented RTO for DG start', detail: 'RBI\'s Business Continuity Management guidelines require documented Recovery Time Objectives. For branch power: the DG must start within 10 seconds and the time must be demonstrable with a test certificate.' },
        { id: 'fleet_amc', headline: 'Multiple branches, multiple DG ages, multiple AMC contracts', detail: 'A bank with 50 branches in a city has 50 DG sets potentially with 5 different OEMs and 8 different AMC contracts. Operations head\'s nightmare. A city-fleet AMC consolidates this.' },
      ],
      talkingPoints: [
        'BCP RTO test certificate: KOEL issues a timed start test certificate at commissioning. Your BCM auditor gets a clean file.',
        'City-fleet AMC: one contract, one point of contact, one SLA for all branches in the city. Operations head doesn\'t manage multiple vendor relationships.',
        'Offline KRM logging: compliant with bank IT security policy that prohibits internet devices on premises.',
      ],
      objections: [{ objection: 'We have an existing AMC with [Brand X] for our DG sets', counter: 'How many branches are on that AMC, and is the response SLA being met? KOEL can take over AMC for the full city fleet — including sets from other OEMs where we can source parts. One SLA, one escalation number.' }],
      leadTriggers: [
        { trigger: 'Bank announcing new branch opening in city', source: 'RBI branch opening approvals, bank announcements' },
        { trigger: 'BCM audit cycle (RBI mandates annual review)', source: 'Operations head conversation — BCM audit is on a fixed annual schedule' },
      ],
      seasonality: 'AMC renewals: typically April–June (new FY). Capex for new branch fit-outs: throughout year, driven by expansion plans.',
      competitorWatch: 'Most bank branches have existing DG sets from multiple OEMs. The AMC consolidation pitch is stronger than displacement. Mahindra Powerol and Cummins both compete for bank AMC contracts.',
    },
  },

  // ─── GOVERNMENT ──────────────────────────────────────────────────────────────
  government: {
    label: 'Government / PSU',
    icon: '🏛️',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'Government procurement is compliance-first — the tender specification, GeM listing, and CPCB type approval must all be in order before any commercial discussion begins.',
      koelValue: 'KOEL is a GeM-listed vendor with CPCB IV+ Type Approval across the full range. CPWD-approved supply history. Bank-guarantee-backed performance bond available for DPIIT and central government projects.',
      references: [
        'AIIMS New Delhi — 500 kVA CPWD-approved procurement',
        'Indian Railways — station and depot backup, CPCB IV+ compliant',
        'DRDO research campuses — security-compliant installation, no IoT monitoring',
      ],
      loadNote: 'GeM portal procurement: ensure KOEL\'s GeM seller registration and product SKU are current and match the tender specification exactly. CPCB Type Approval Certificate number must be verifiable during commissioning inspection.',
    },

    cheatSheet: {
      summary: 'Government is a process-heavy segment. The commercial case is almost irrelevant — process compliance is the entry ticket. KOEL\'s job is to be the easy choice when the procurement committee opens the GeM portal.',
      buyerProfile: {
        decisionMaker: 'Procurement Committee (GFR rules apply). Purchase Officer for <₹1L. Committee approval for >₹1L.',
        technicalInfluencer: 'Electrical engineer at the public works department (PWD/CPWD). For defence: base electrical officer.',
        procurementRoute: 'GeM portal for central and most state government procurement. Open tender for large or specialised projects. CPWD rate contract for civil projects.',
        earlyInfluencePoint: 'Get spec-in before the tender is published — suggest the technical specification to the PWD electrical engineer who writes the NIT.',
      },
      sizing: { kvaRange: { min: 25, typical: '125–500', max: 1010, unit: 'kVA' }, criticalNote: 'Competitor brands sometimes spec\'d by name in the NIT — KOEL must get a substitution approval or match the spec exactly.' },
      painPoints: [
        { id: 'gem', headline: 'GeM listing and product SKU match required', detail: 'Procurement officer will verify KOEL\'s GeM seller registration and product SKU against the tender spec before approving.' },
        { id: 'spec_lock', headline: 'Tender spec references a competitor brand', detail: 'NIT may say "Cummins or equivalent" — KOEL must formally apply for "or equivalent" acceptance with technical data.' },
      ],
      talkingPoints: [
        'KOEL is GeM-listed across the full kVA range. Product SKU, CPCB Type Approval number, and pricing are on the portal.',
        'CPWD-approved supply history — audit trail available from previous central government projects.',
        'CPCB IV+ Type Approval Certificate number verifiable during commissioning inspection — no documentation delay.',
      ],
      objections: [{ objection: 'Spec says Cummins or equivalent — we have to go with Cummins', counter: 'Apply for "or equivalent" substitution approval with the technical equivalency document. KOEL can provide a side-by-side comparison against the specified Cummins model — same or better on all key parameters. This is a standard procedure in CPWD tenders.' }],
      leadTriggers: [
        { trigger: 'Government tender on tenders.gov.in or CPPP', source: 'Set up keyword alert on tenders.gov.in for "diesel generating set" or "DG set"' },
        { trigger: 'DPIIT / state industrial development capex announcement', source: 'PIB, ministry press releases' },
      ],
      seasonality: 'Government procurement heaviest in Q4 (Jan–Mar) as departments spend their annual allocation before financial year close.',
      competitorWatch: 'Cummins (often spec\'d by name in government NITs). KOEL must be registered on GeM with all certifications current to compete.',
    },
  },

  // ─── INFRASTRUCTURE ──────────────────────────────────────────────────────────
  infra: {
    label: 'Infrastructure',
    icon: '✈️',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'Airports, metros, and highway infrastructure run 24×7. Power failure in ATC, signalling, ticketing, or terminal systems is a safety and regulatory event — not just an inconvenience.',
      koelValue: 'KOEL large kVA solutions (250–1010 kVA) with full AMF, acoustic certification for terminal proximity, and DGCA/AAI-compliant power backup commissioning. Fuel monitoring and delivery integration available.',
      references: [
        'Hyderabad International Airport — critical backup, DGCA/AAI compliant',
        'Delhi Metro — depot and maintenance facilities, 320 kVA',
        'NHAI toll infrastructure — compact canopy, automated fuel ordering',
      ],
      loadNote: 'Motor-dominated loads: PF 0.72. Acoustic enclosure required for installations within 150m of passenger terminal. HT supply (11 kV) common — DG output must synchronise via HT/LT transformer with coordination drawing.',
    },

    cheatSheet: {
      summary: 'Infrastructure is a large-ticket, long-cycle sale. Airports, metros, and ports are EPC-led — KOEL must get spec\'d in at the design stage. Compliance deadlines (DGCA, AAI) create urgency that can close the deal quickly.',
      buyerProfile: {
        decisionMaker: 'Project Director (EPC/infrastructure). Airport: CEO of airport operating company. Metro: DMRC/MMRC project head.',
        technicalInfluencer: 'MEPF consultant, EPC electrical contractor.',
        procurementRoute: 'Tender-based for government infrastructure. Direct specification for private airports/logistics.',
        earlyInfluencePoint: 'MEPF sub-contractor at EPC stage — get KOEL into the MEPF vendor list before the main contractor finalises it.',
      },
      sizing: { kvaRange: { min: 160, typical: '500–1010', max: 4000, unit: 'kVA (multiple sets)' }, criticalNote: '11 kV HT supply — synchronisation and coordination drawing required from KOEL application engineering.' },
      painPoints: [
        { id: 'compliance_deadline', headline: 'DGCA/AAI compliance deadline for power backup commissioning', detail: 'Airport authority sets a hard commissioning deadline for power backup systems before the terminal opens. 8-week delivery window is tight — needs to be confirmed at order stage.' },
        { id: 'acoustic', headline: 'Acoustic testing required within 150m of passenger terminal', detail: 'Airport authority requires acoustic testing certification before the DG can be placed within 150m of the passenger terminal.' },
      ],
      talkingPoints: [
        'KOEL 6–8 week standard delivery. For hard DGCA deadlines, confirm lead time at order — KOEL can expedite for priority projects.',
        'Acoustic canopy with AAI-accepted noise certification. We\'ve done the test process before — familiar with the airport authority\'s requirements.',
        'HT synchronisation coordination drawing: KOEL application engineering provides this as part of the installation scope.',
      ],
      objections: [{ objection: 'CAT is specified for airport-grade installations', counter: 'KOEL has airport installations at Hyderabad and across AAI-managed airports. The technical spec is met. On price: KOEL is 15–20% below CAT at equivalent kVA. For a project-scale order, that is a material saving on a line item that the EPC contractor controls.' }],
      leadTriggers: [
        { trigger: 'New airport terminal/greenfield airport tender', source: 'AAI tenders, DPIIT infrastructure pipeline, NITI Aayog project tracker' },
        { trigger: 'Metro phase announcement (new corridor)', source: 'Ministry of Housing and Urban Affairs, state metro corporation press releases' },
      ],
      seasonality: 'Infrastructure projects run on political/budget cycles — no strong seasonality. Watch for Union Budget infrastructure announcements (Feb) and state budget capex lines.',
      competitorWatch: 'CAT (preferred for large airport and metro projects globally). Cummins (HHP range for large kVA). KOEL must compete on price delta + local service network + compliance documentation speed.',
    },
  },

  // ─── COLD CHAIN ──────────────────────────────────────────────────────────────
  coldchain: {
    label: 'Cold Chain',
    icon: '❄️',
    fieldVerified: false,

    pitchIntel: {
      painPoint: 'A 2-hour power failure at a pharma or food cold storage can mean ₹10–30L in product spoilage and a regulatory incident. Compressor restart surge after grid restore trips most undersized DG sets.',
      koelValue: 'KOEL gensets are sized for compressor DOL start surge — the 50% loading standard handles simultaneous compressor restarts without tripping. KRM fuel and run-hour monitoring alerts the team before product temperature rises.',
      references: [
        'Snowman Logistics — cold storage Pune, 3 compressors, restart sequencing',
        'Gati-KWE — temperature-controlled fleet, pharma compliance documentation',
        'Delhivery — pharma cold chain, FSSAI compliance certificate',
      ],
      loadNote: 'Compressor motors: high start surge (5–6× rated current). PF 0.72. Size at KOEL 50% standard to handle simultaneous restarts after grid restore. FSSAI drug licence renewal requires a certified power backup plan with temperature recovery documentation.',
    },

    cheatSheet: {
      summary: 'Cold chain is a high-stakes segment where one failure is a headline. The buyer is haunted by a specific past incident — use that fear respectfully. The technical argument (simultaneous restart surge) is the hook that no competitor addresses as cleanly as KOEL.',
      buyerProfile: {
        decisionMaker: 'Cold storage owner / Logistics company operations head.',
        technicalInfluencer: 'Refrigeration contractor (who specs the compressors and knows the restart scenario).',
        procurementRoute: 'Direct purchase from GOEM/dealer. Pharma distributors sometimes require vendor approval from the parent pharma company.',
        earlyInfluencePoint: 'Refrigeration contractor — they see the compressor restart problem firsthand and can advocate for a properly sized DG.',
      },
      sizing: { kvaRange: { min: 62.5, typical: '125–320', max: 500, unit: 'kVA' }, criticalNote: 'Simultaneous compressor restart scenario must be explicitly calculated at site visit — KOEL application engineer to verify block load and restart surge.' },
      painPoints: [
        { id: 'restart_trip', headline: 'All compressors restart simultaneously — DG trips', detail: 'When grid returns after an outage, all compressors that were running attempt to restart simultaneously. The inrush from 3 large compressors (say 3 × 30 kW) is 3 × 6 × 30 = 540 kW momentary demand against a 125 kVA (100 kW) set. Result: undervoltage trip, DG shuts down, cold room stays dark, product temperature rises.' },
        { id: 'fssai', headline: 'FSSAI drug licence renewal requires certified power backup', detail: 'FSSAI inspectors check for documented power backup plan during drug licence renewal. The plan must include: DG specifications, AMF test records, and temperature recovery documentation showing how quickly the cold room returns to set temperature after a simulated power failure.' },
        { id: 'insurance', headline: 'Insurance company demanding proof of backup power reliability', detail: 'After a spoilage claim, insurance companies demand evidence of power backup reliability before renewing cold storage cover. KOEL commissioning documents + AMC records satisfy this requirement.' },
      ],
      talkingPoints: [
        'The compressor restart surge calculation: show the arithmetic. "Your 3 compressors each draw 5× rated current at start. Simultaneously, that\'s 3× 5× 15 kW = 225 kW momentary. A 160 kVA set at 50% loading has 80 kW spare capacity — not enough. A 250 kVA set at 50% loading has 120 kW spare — this is the set you need."',
        'KRM monitoring: fuel level + run-hour alert before your next grid failure. No more surprises at 2am.',
        'FSSAI documentation package: KOEL provides the commissioning certificate and AMC schedule in a format accepted by FSSAI inspectors.',
        'Temperature recovery documentation: we can arrange a live test at commissioning — simulate a power failure, measure temperature recovery time, document it. This is what the FSSAI and your insurance company need.',
      ],
      objections: [{ objection: 'We\'ve always used [local brand] and they\'re cheaper', counter: 'Has their set ever tripped when all your compressors restarted at once? If yes, you\'ve already paid the price in spoilage. If no, you\'ve been lucky. The risk isn\'t the ₹X lakh price difference — it\'s the ₹30L spoilage incident that\'s one grid failure away.' }],
      leadTriggers: [
        { trigger: 'New cold storage construction permit', source: 'Local municipal permits, logistics company expansion announcements' },
        { trigger: 'FSSAI drug licence renewal cycle (annual)', source: 'Pharma distributor conversation — they know their renewal date' },
        { trigger: 'Spoilage incident in the region (trade news)', source: 'Cold chain industry publications, ASSOCHAM cold chain reports' },
      ],
      seasonality: 'Pre-summer (Feb–April) — cold storage operators upgrade before the high-load summer season when grid is least reliable.',
      competitorWatch: 'Local brands (cheaper, but no application engineering for compressor restart). Cummins (strong technical credibility but more expensive). KOEL wins on the specific compressor-restart calculation + FSSAI documentation angle.',
    },
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — for PitchOutput.jsx and Segments Module to consume
// ─────────────────────────────────────────────────────────────────────────────

// Drop-in replacement for the old SEGMENT_INTEL object in PitchOutput.jsx
export const SEGMENT_INTEL = Object.fromEntries(
  Object.entries(SEGMENT_DATA).map(([key, seg]) => [key, seg.pitchIntel])
)

// Ordered list for the Segments Module tile grid
export const SEGMENT_LIST = [
  'healthcare', 'industrial', 'datacentre', 'realestate',
  'hospitality', 'telecom', 'retail', 'banking',
  'education', 'coldchain', 'government', 'infra',
]
