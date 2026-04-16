// ─────────────────────────────────────────────────────────────────────────────
// SEGMENT CHALLENGES — Sales intelligence per industry segment
//
// These are pre-researched, genuine sales scenarios a KOEL rep encounters.
// Rep selects the ones that apply → they become the "customer concerns" section
// in the WHY KOEL pitch slide, making every pitch feel custom-built.
//
// Source: Field sales patterns, industry practices, competitor displacement wins.
// TODO: Prasad to augment with actual KOEL field observations from the team.
// ─────────────────────────────────────────────────────────────────────────────

export const SEGMENT_CHALLENGES = {

  telecom: [
    'Customer comparing KOEL vs Cummins on service network density — needs confirmed touchpoint coverage near their tower clusters',
    'Site is in a remote / semi-urban zone — extended service interval assurance and spare parts availability are must-haves',
    'Customer is evaluating BESS (Battery Energy Storage) as an alternative to diesel DG — needs a TCO comparison at this specific load and run-hour profile',
    'Existing competitor DG is out-of-warranty — competitor approaching for renewal, KOEL needs a displacement pitch with lifecycle cost argument',
    'Customer requires SCADA / API integration for centralised tower management platform — DG must support remote start-stop via protocol',
  ],

  healthcare: [
    'Chief Engineer has concern about AMF transfer time affecting ventilators and ECMO machines during the switchover gap',
    'Hospital is in NABH accreditation process — needs documented power backup compliance evidence for accreditation auditor',
    'Acoustic noise complaint from adjacent patient ward — canopy sound level certification and dB(A) measurement at room wall required',
    'Hospital has an ageing DG set that tripped twice in the last month — urgent replacement within 4 weeks, downtime risk is high',
    'Hospital board wants N+1 redundancy for OT complex but is hesitant on capex — needs a phased approach proposal',
  ],

  realestate: [
    'Township builder needs DG cost included in RERA-approved cost structure — requires official price breakup and delivery schedule document',
    'Residents Welfare Association is raising noise objections — OC may be withheld unless acoustic compliance certificate is provided',
    'Builder is comparing centralised DG for township vs per-building distributed sets — needs a comparative analysis with CAPEX/OPEX figures',
    'Facility team has no trained DG operator — AMC must include quarterly operator training and a 24×7 helpdesk',
    'Builder wants a bank-guarantee-backed performance bond for supply — standard KOEL terms may need adjustment',
  ],

  datacentre: [
    "Customer's SLA with cloud tenant requires ISO 22237 compliant infrastructure — KOEL needs to support the documentation trail",
    'PUE optimization is a board-level KPI — customer wants to quantify DG efficiency impact and idle fuel burn on their PUE score',
    'Generator switchover time must fit within UPS battery autonomy window — UPS battery specs not shared yet, coordination meeting needed',
    'N+1 vs 2N decision is still pending with their infrastructure architect — KOEL needs to stay in the loop and guide the decision',
    'Fuel storage on site is limited to 2,000 litres — an automated fuel ordering trigger or daily top-up delivery arrangement is required',
  ],

  industrial: [
    'Production line has 3 DOL motors that all restart simultaneously after a grid restore event — this has tripped the existing DG twice',
    'CPCB inspector visited last quarter — plant management needs a formal emission compliance file ready for the next audit',
    'Existing DG is overloaded (running at >85% load) — frequent nuisance trips during peak shift are causing production stoppages',
    'Plant is evaluating a solar + battery hybrid to reduce DG run hours and diesel cost — needs a capex/opex model for hybrid vs pure DG',
    'Plant has an HT feeder transformer — synchronisation of DG with the incoming HT supply is a concern for the electrical team',
  ],

  hospitality: [
    'Hotel GM wants a written commitment that DG noise will be inaudible from guest rooms and restaurant — acoustic guarantee required',
    'F&B refrigeration (cold kitchen, wine cellar, ice machines) must not lose power even momentarily — <3s transfer or zero-interruption UPS-backed required',
    'Hotel is in a heritage conservation zone — visual appearance of the canopy enclosure must be screened or aesthetically treated',
    'Corporate sustainability team requires monthly fuel consumption and emissions data for ESG reporting',
    'Hotel chain is standardising backup power across 12 properties — this is a first pilot site; winning here means a fleet order',
  ],

  retail: [
    'Retail chain procurement policy mandates 3 competitive quotes — KOEL needs to differentiate on service response time and TCO, not just price',
    'Store has refrigerated display aisles with PFC (power factor correction) capacitors on the bus — reactive power interaction with DG needs to be addressed',
    'This outlet operates on generator-only supply (no grid) — DG will run in prime power mode, not standby, duty cycle is 12–16 hr/day',
    'Store rollout plan includes 50 outlets over 18 months — this is a 3-outlet pilot, framework agreement for balance quantity is the real prize',
    'Store BMS requires DG fuel consumption and runtime visible on their central dashboard — data integration needed',
  ],

  education: [
    'College has State Board exam centre status — university affiliation letter requires a certified power backup system in place before exam dates',
    'Campus IT insists on ATS transfer within 5 seconds to prevent database corruption on exam servers',
    "Campus has a rooftop solar installation — anti-islanding protection required so DG and solar inverters don't conflict on the same bus",
    'Government-aided institution — procurement must follow GFR rules and GeM portal; direct purchase above ₹1L needs a committee approval',
    'Previous DG set had a major breakdown during board exam week — principal wants an SLA-backed reliability commitment before approving',
  ],

  banking: [
    "Bank's IT security policy prohibits any internet-connected monitoring device on premises — KRM remote monitoring will face approval hurdle",
    'Core banking platform migration is scheduled in 3 months — DG installation must be complete and load-tested before the go-live date',
    "Bank's Business Continuity Management audit requires documented RTO for DG start and load transfer — KOEL needs to provide a timed test certificate",
    'Branch has an existing manual transfer switch (MTS) — customer wants to upgrade to AMF without replacing the MTS panel',
    'Operations head wants one AMC point of contact for all 18 city branches — a city-level fleet AMC agreement structure is needed',
  ],

  government: [
    'Tender specification references a competitor make by name — KOEL needs to get a substitution approval or match the spec exactly',
    'GeM portal listing verification required — procurement officer will check KOEL\'s GeM seller registration and product SKU match before approving',
    'DPIIT nodal project requires a 30% advance payment against a bank guarantee — standard KOEL payment terms need to be checked',
    'Government auditor will verify the CPCB Type Approval Certificate number during commissioning inspection',
    'Tender includes a 2-year comprehensive AMC with a penalty clause for downtime exceeding 4 hours — terms need KOEL service team confirmation',
  ],

  infra: [
    'Project has an EPC main contractor — KOEL must get spec-in approval early, before the MEPF sub-contractor finalises vendor list',
    'Airport authority requires acoustic testing certification before the DG can be placed within 150m of the passenger terminal',
    'Project has a hard DGCA/AAI compliance deadline for power backup commissioning — 8-week delivery window is a constraint',
    'Airport has a very limited on-site fuel storage (1,500 L) — KOEL needs to integrate with their automated fuel delivery system',
    'Utility power is 11 kV HT — DG output must synchronise cleanly with the LT bus through the HT/LT transformer — coordination drawing required',
  ],

  coldchain: [
    'Customer had a power failure 6 months ago that caused ₹14L in pharma product spoilage — they want documented recovery time guarantee',
    'Cold storage has 3 scroll compressors that all restart simultaneously after a power restore — previous DG tripped on this exact scenario',
    'FSSAI drug licence renewal requires a certified power backup plan with temperature recovery documentation',
    'Pharma distributor customer wants temperature logger data to be correlated with DG run logs for regulatory audit trail',
    'Customer\'s insurance company is asking for proof of backup power reliability before renewing the cold storage cover',
  ],
}
