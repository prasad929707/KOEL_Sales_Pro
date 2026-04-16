# KOEL Segment Intelligence

## Healthcare
- Decision maker: Hospital Administrator / CEO. Small clinic: owner directly.
- Technical influencer: Chief Biomedical Engineer or MEP Consultant
- Key pain points:
  - NABH accreditation requires documented power backup compliance (AMF test cert, service logs)
  - AMF transfer <10s mandatory for OT/ICU. Ventilators/ECMO need UPS bridge for zero-gap.
  - Acoustic: <72 dB(A) @ 1m required near patient areas
  - Wet stacking risk from low-load running during grid-reliable hours
- Typical sizing: 20–50 beds: 62.5–125 kVA. 100–200 beds: 200–320 kVA. 300–500 beds: 500–750 kVA.
- KOEL value: Medical-grade silent gensets, NABH documentation package, N+1 configuration support
- References: Apollo Hospitals (multi-site), Fortis Healthcare, AIIMS New Delhi

## Data Centre
- Decision maker: DC Head / CTO / Facilities VP. Construction phase: MEP consultant is the key influencer.
- Key standards: Tier III requires N+1 (two identical sets, each rated for 100% load). Tier IV: 2N.
- Key pain points: Single point of failure, PUE impact, UPS battery run-time bridge, fuel storage limits
- Typical sizing: Small DC: 250–500 kVA. Hyperscale: multiple Optiprime sets
- KOEL value: Optiprime series/parallel intelligent load management, 40% fuel saving at part-load, KRM monitoring
- Load profile: Near-unity PF (0.90) — UPS presents clean load to DG

## Industrial
- Decision maker: Plant Manager / Head of Engineering. Production downtime cost drives the decision.
- Key pain points:
  - DOL motor starting: 5–6× rated current inrush — undersize causes voltage dip and AMF re-transfer fail
  - Motor restart sequencing on power restore: simultaneous restart overloads the genset
  - Wet stacking at low load (shift patterns with light production)
- Typical sizing: 50–750 kVA depending on motor count and rating
- KOEL value: Conservative 50% loading standard absorbs DOL start surge, prime-rated gensets for daily running
- Load profile: Motors/compressors PF 0.72 — always use Pumps & Motors sizing profile

## Cold Chain / Refrigeration
- Key concern: Compressor restart on grid restore — all compressors starting simultaneously overloads DG
- Solution: Staggered restart timer via AMF panel (not simultaneous) or VFD-controlled
- Pharma cold chain: temperature logging, uninterrupted power, regulatory compliance (FDA/CDSCO)
- KOEL value: Reliable prime-power operation, fast AMF transfer, compressor-load sizing expertise

## Telecom / Tower
- Operating mode: Prime power in rural/remote (grid unreliable). Standby in urban.
- Key requirement: Compact footprint for tower shelter cabinet. 7.5–25 kVA range.
- Fleet deployment: 45,000+ Kirloskar Green gensets deployed across India (Airtel, Vodafone, Idea, BPL, Essar)
- Remote monitoring via KRM/SCADA is often a contractual requirement
- KOEL value: India's largest telecom genset fleet, proven reliability, Tier-2/3 coverage

## Real Estate / Commercial Buildings
- Decision maker: Project Director / PMC / MEP consultant during construction
- Spec-in window: Before electrical contractor finalises vendor list (early construction phase)
- Key pain points: CPCB/OC compliance, acoustic certification, distributed vs centralised DG plant
- Typical: One centralised plant room for large towers. Distributed for spread-out townships.

## Hospitality (Hotels)
- Key constraint: DG room to nearest guest area — <20m requires strict acoustic treatment
- Guest experience: <65 dB(A) in corridors — double-wall canopy or acoustic room needed
- F&B load: Kitchen + cold store on critical circuit — compressor starting must be accounted for
- Chain hotels: Fleet potential across properties — framework deal opportunity

## Banking / Financial
- Application types: Retail branch (15–62.5 kVA), Core banking DC/server room (125–500 kVA), ATM clusters
- IT security restrictions: Some banks do not allow internet-connected monitoring devices
- Fleet AMC: Bank with 20+ branches = framework AMC contract opportunity

## Government / PSU
- Procurement routes: GeM portal, Open tender, Limited tender / direct nomination
- Key requirements: CPCB IV+ certificate verified at commissioning, Performance bond (bank guarantee)
- Pricing reference: GeM rate contract pricing often used as benchmark

## Education
- Exam centres: Board/university exam centres require CPCB-compliant certified backup
- Government-aided: GeM/GFR procurement route. Private: direct purchase.
- Solar hybrid: Increasingly common — DG as backup to rooftop solar

## Infrastructure (Airports, Metro, Highways)
- Procurement: EPC contractor spec-in is the critical stage. MEPF sub-contractor influences product choice.
- DGCA compliance for airports. Metro: IEC 60909 fault-level compliance.
- Large projects: Multiple Optiprime sets, parallel synchronising panels

## Retail / Supermarkets
- Grid: unreliable in Tier-2/3 towns — DG runs daily (prime power)
- Refrigerated load: 20–50% for supermarkets, >50% for hypermarkets
- Rollout: Framework deals for 20+ outlets are high-value
