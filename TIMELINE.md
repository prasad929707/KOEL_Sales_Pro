# Kirloskar Sales Pro — Development Timeline

> This document exists so that after every context summary, Claude knows exactly where we are and what comes next. Every design decision is recorded here. Do not skip sections.

---

## STATUS TRACKER

| Phase | Module | Status |
|-------|--------|--------|
| 0 | Foundation scaffold | ✅ Done |
| 1 | Products module (copy) | ✅ Done |
| 2 | Competitor Analysis module (copy) | ✅ Done |
| 3 | Segment Research — ALL segments deep dive | 🔄 In progress (Healthcare → Industrial → DC next) |
| 4 | Segments Module — Cheat Sheets | ⬜ Blocked on Phase 3 |
| 5 | India Heatmap | ⬜ Not started |
| 6 | GOEM Intelligence Layer | ⬜ Not started |
| 7 | Pitch Builder — Form Rework | ✅ Done (block load sizing, concerns section, chat analysis) |
| 8 | Pitch Builder — Output (Sales Brief) | ✅ Done (scrollable brief replaces slide deck — intentional pivot) |
| 9 | Track Record Module | ⬜ Seed data exists (REFERENCE_DETAILS), needs UI |
| 10 | Database Layer (Supabase decision) | ⬜ Not started — localStorage for now |
| 11 | AI Architecture + SOP | 🔄 Partial (Ollama/Gemma integration guide written, not wired) |
| 12 | Lead Detection Workflow | ⬜ Not started |

### What is actually built (as of 15 Apr 2026)
- Full React/Vite app, routed, auth-bypassed for dev, Netlify-deployable
- Home page with module tiles
- Products module: all ranges, Optiprime dedicated page, spec pages
- Competitor Compare: KOEL vs 6 competitors, nearest-match logic, PDF export
- Pitch Builder: block load sizing, 4 load profiles, multi-genset, concerns section (free text + segment challenges checkboxes), AI chat analysis gate, form retention on edit
- Pitch Output: scrollable Sales Brief — product card, TCO calculator, segment intel, references, service, Sales AI chat
- Profile page: rep details + brief history with one-click re-open
- localStorage leads store: auto-logs every brief, max 50 entries
- `src/data/segmentChallenges.js`: 5 pre-researched challenges per segment (12 segments)
- `src/lib/storage.js`: auth, starred, leads stores

### What is NOT built yet
- Phase 3 segment data is stub-level — one-liner pain points. Deep research pending.
- Segments Module page (SegmentsPlaceholder routes to a stub)
- Track Record page (TrackRecordPlaceholder routes to a stub)
- India Heatmap
- Real AI integration (chat is mock keyword-matching responses)
- Supabase / any backend

---

## PHASE 0 — Foundation Scaffold

**Goal:** New React + Vite project. Homepage with module tiles. Genset Builder design language.

### Steps
1. Create `/Kirloskar_Sales_Pro/` as a new Vite + React project
2. Copy ALL source files from `KOEL_Genset_Builder/` — every component, every data file, every image
3. Navbar: name to be **"KOEL Sales Pro"** (or "Kirloskar Sales Pro" — confirm with Prasad). Design: same dark navbar as Genset Builder.
4. Tagline: **"Limitless Tomorrow"** — must match Kirloskar's original font weight and style exactly. The Genset Builder didn't match it well enough. Research the exact font (likely a bold condensed — Barlow Condensed ExtraBold or similar).
5. Homepage tiles: one per module (Pitch Builder, Competitor, Products, Segments, Track Record). Design like Genset Builder's homepage cards — not the Sales Intelligence toy design.
6. Footer: same as Genset Builder.
7. Routing: React Router. Each tile links to its module.

### Known decisions
- No auth gate initially (Genset Builder had none)
- localStorage only for now, Supabase later (Phase 10)
- Port: 5173 (Vite default)

---

## PHASE 1 — Products Module

**Goal:** Exact copy of Genset Builder's product pages. No changes initially.

### What to copy
- Full product range pages with photos
- All spec details per product
- **Optiprime** dedicated page — as-is
- Navbar product dropdown element (the one in Genset Builder that was "mast") — copy exactly
- All images from `public/images/` including optiprime folder

### Post-copy improvement (later, not now)
- Add more products as KOEL adds to range
- Link from Pitch Builder's product selection back to Products page

---

## PHASE 2 — Competitor Analysis Module

**Goal:** Exact copy of Genset Builder's competitor analysis. No changes initially.

### What to copy
- Competitor selection dropdown
- Product comparison loading behavior (the dropdown loaded smoothly — keep that)
- Side-by-side comparison view
- **PDF download button** — do not miss this
- All competitor data (CAT, Cummins, Greaves, Mahindra, Baudouin, Perkins)
- "Nearest competitor product" logic (Genset Builder found ±25% range and showed closest match)

### Post-copy improvement (later)
- Wire competitor selection into Pitch Builder so the pitch auto-populates competitor talking points
- Use segment intel to emphasize the right comparison points for the customer's segment

---

## PHASE 3 — Segment Research (DEEP WORK — THE CORE)

**Goal:** Every segment and sub-segment studied in enough depth that a sales rep who knows nothing about the segment can walk in and have a credible, specific conversation.

This is not a quick task. Claude and Prasad sit on each segment together.

### The Master Segment List (to be audited and expanded)

Working list — needs verification that these are KOEL's actual target segments:

| # | Segment | Key Sub-segments |
|---|---------|-----------------|
| 1 | Telecom | Tower sites (rural/urban), data transmission hubs, 5G rollout sites |
| 2 | Healthcare | Hospitals (>100 beds), clinics, diagnostic centres, pharmaceutical manufacturing |
| 3 | Real Estate / Construction | Residential complexes, commercial offices, malls under construction |
| 4 | Data Centres | Hyperscale, colocation, enterprise DC, edge DC |
| 5 | Industrial / Manufacturing | Auto ancillary, FMCG plants, textile, chemicals, cement |
| 6 | Hospitality | 5-star hotels, business hotels, resorts, convention centres |
| 7 | Retail | Organised retail chains, supermarkets, large format stores |
| 8 | Education | Schools, colleges, universities, coaching institutes |
| 9 | Banking / Financial | ATMs, bank branches, NBFCs, insurance offices |
| 10 | Government / PSU / Defence | Municipal offices, ONGC, NTPC, defence installations |
| 11 | Infrastructure | Airports, ports, metro stations, toll plazas |
| 12 | Agri / Cold Chain | Cold storage, food processing, agri-processing units |

**Action required:** Prasad to verify with actual KGD/GOEM reps which segments they actually target. Sub-segments may split or merge.

### Per-Segment Research Template

For EVERY segment, we need to document:

```
SEGMENT: [Name]
SUB-SEGMENTS: [List]

BUYER PROFILE
- Who makes the purchase decision? (Facilities manager? CEO? Govt tender committee?)
- Who influences? (Consultant, EPC contractor, AMC provider?)
- Typical organisation size that buys a genset

SIZING
- Typical kVA range purchased (e.g., hospitals usually 125-500 kVA)
- Number of DG sets typically installed
- Redundancy requirements (N+1 common? Only backup?)
- Load type (critical vs. non-critical)
- Why block load matters for this segment specifically

PAIN POINTS (what keeps this buyer up at night)
- Power reliability needs
- Compliance requirements specific to segment
- Capex vs opex sensitivity
- Specific failure scenarios they fear

KEY TALKING POINTS (what lands)
- What does KOEL say that this segment responds to?
- What numbers matter to them? (fuel cost? uptime %? service SLA?)
- What compliance certificate matters? (CPCB? NABH for hospitals? BIS?)

COMMON OBJECTIONS
- Price objection (how to counter)
- "We use Cummins / CAT" (how to counter for this segment)
- "We'll manage with existing DG" (how to counter)

PROOF POINTS THAT WORK
- Type of reference that impresses this buyer
- Specific claims that are credible (e.g., "X hospitals in Maharashtra run KOEL")

LEAD TRIGGERS
- What event means a lead is forming? (new hospital getting licenced? data centre tender? mall commission?)
- Where to watch for these signals (Govt gazette, tenders.gov.in, CBRE reports, etc.)

SEASONALITY
- Does this segment buy more in certain months?

GOEM/DEALER RELEVANCE
- Which GOEMs have the most exposure to this segment by geography?
```

### Research Protocol

Sources Claude will use per segment (in order of reliability):
1. KOEL's own product pages and case studies (if public)
2. Industry association reports (ISHRAE for hospitals/data centres, CII for industrial)
3. Tender portals (tenders.gov.in, GeM, CPPP) for govt segments
4. CBRE/JLL/Knight Frank reports for real estate
5. TRAI reports for telecom
6. LinkedIn job postings (facilities head at hospitals/data centres — reveals what they care about)
7. Competitor case studies (what problems Cummins/CAT claim to solve — reveals segment pain)

### After Research
- Prasad takes drafts to sales reps at KOEL HO for validation
- Reps annotate: which points matter, which are wrong, what's missing
- We update data files based on their feedback
- This is the loop that makes the tool actually credible

---

## PHASE 4 — Segments Module (Cheat Sheets)

**Goal:** A standalone module where any rep can pull up a segment and get a dense, scannable cheat sheet.

### UI Design
- Segment selector (grid of tiles on the left, or tab bar at top)
- Cheat sheet renders on the right — not a wall of text, but structured cards:
  - Buyer Profile card
  - Sizing Range card (with visual — what kVA range, typical units)
  - Top 3 Pain Points
  - Top 3 Talking Points
  - 2-3 Best Proof Points for this segment
  - Lead Triggers (where to watch)
- Print / download as PDF (so rep can carry it)

### Access
- Accessible to GOEMs and KGD reps
- No login required

---

## PHASE 5 — India Heatmap

**Goal:** Visual map of India showing where each segment clusters. Rep can see where the action is for their segment of interest.

### Map Stack (technical)
- Source: GeoJSON/TopoJSON India map with state and district boundaries
- Recommended GitHub repo: `india-maps` by datameet or topojson/world-atlas India extract
  - Option A: https://github.com/geohacker/india (state + district GeoJSON)
  - Option B: https://github.com/deldersveld/topojson (world atlas with India)
  - Prasad to check and share best repo, or Claude fetches directly
- Render with: **D3.js** (already in project dependencies from Genset Builder)
- OR: React-simple-maps if D3 is overkill

### Interaction Design
1. **India view** — whole country, filled by heat intensity per segment
   - Dropdown: select segment
   - States coloured by density of relevant industry (e.g., for Data Centres: Maharashtra, Karnataka, Telangana, NCR are hot)
2. **State view** — click a state, it zooms in with district boundaries
3. **District view** — districts highlighted with hotspot markers
   - Hover/click on marker → name of city/cluster + what's there (e.g., "Pune — auto ancillary cluster, 200+ MSME units")
4. **Hotspot data** — hardcoded initially per segment per district, updated manually as we build

### Hotspot Data Structure (per segment)
```js
{
  segmentId: 'industrial',
  hotspots: [
    { state: 'MH', district: 'Pune', cluster: 'Auto Ancillary', intensity: 'high', note: 'Chakan, Pimpri-Chinchwad MIDC — 200+ tier-2 auto suppliers' },
    { state: 'GJ', district: 'Surat', cluster: 'Textile', intensity: 'high', note: 'Surat textile mills — high DG dependency due to power fluctuations' },
    ...
  ]
}
```

### Lead Detection Workflow Button
- Per-segment button: "Check for new leads"
- Pre-defined workflow: opens a curated set of sources relevant to that segment
  - E.g., for Data Centres: links to NASSCOM tracker, data centre news India, recent tenders
  - E.g., for Hospitals: NABH newly accredited hospitals, health ministry capex announcements
- Initially: opens links in new tabs (simple but useful)
- Later: could trigger a Claude API call to summarise recent news (Phase 11)

### Who is this for?
- KOEL HQ (Sales/Marketing) primarily — territory planning
- GOEM segment exposure overlay is shown here (which GOEM's territory covers which hotspots)
- Individual reps use it to understand their territory

---

## PHASE 6 — GOEM Intelligence Layer

**Goal:** Map 9 GOEMs to the segments they are geographically exposed to.

### Data needed
- KOEL's 9 GOEMs — names and territories
- Each GOEM's territory (which states / regions they cover)
- Cross-reference with segment hotspot data (Phase 5)
- Output: "GOEM X covers MH + GJ → they are exposed to: Industrial (high), Real Estate (medium), Telecom (high)"

### UI
- On the heatmap (Phase 5): toggle to show GOEM territory overlays
- Separate view: table of 9 GOEMs, each row shows segment exposure

### What we WON'T do (Pulse CRM data is garbage, not correct segments)
- We will NOT use Pulse CRM data to validate GOEM segment exposure
- We rely on geography + our own hotspot research

### Access
- This view is for KOEL HQ only (not for GOEMs themselves, they know their territory)
- Or... accessible to everyone, it's not sensitive. Decide with Prasad.

---

## PHASE 7 — Pitch Builder — Form Rework

**Goal:** The current pitch form is broken (asks for kVA range instead of block load — that's like asking someone their dress size instead of their measurements). Rework it completely.

### New Form Flow

**Step 1: Customer Context**
- Customer name
- Segment (dropdown — these feed into the pitch immediately)
- City
- Meeting date
- Rep name / designation / region

**Step 2: Power Requirement (the real sizing)**
- **Block Load (kW)** — primary input
  - Small tooltip: "Sum of all connected loads that will run simultaneously on the DG"
  - WHY we ask block load: genset sizing is done on kW demand + power factor, not on an arbitrary "range" — asking range is lazy and wrong
- Click **"Show matching products"** button
- Side panel slides in: KOEL products that match the block load
  - Logic: kW_genset >= block_load / 0.8 (standard derating for 80% load rule)
  - Shows product rating (kVA and kW), model name
  - If multiple products match, shows all with recommended one highlighted
  - **Optiprime option**: if block load falls in Optiprime range, show Optiprime as an alternative choice (highlight its advantages for that segment)
- User selects one (or more — see below)

**Multiple gensets**
- "Add another genset" button — for customers who need multiple units
- Each genset has its own block load input → its own product selection
- E.g., a hospital might want: 1x 500 kVA (critical loads) + 1x 200 kVA (non-critical)
- Each gets a space constraint dropdown:
  - "No constraint"
  - "Compact footprint required"
  - "Noise-sensitive location (acoustic enclosure)"
  - "Outdoor installation (weatherproof canopy)"
  - "Basement installation"
  - Space constraint affects product recommendation (canopy options, acoustic options)

**Step 3: Competitor Context (for rep's use)**
- Which competitor is in consideration? (dropdown — same as before)
- Optional — rep can skip if no known competitor

**Step 4: Submit**
- Submit button loads the pitch
- After submit: brief chatbot window (Enterprise Brain mockup) appears
  - Chatbot reads the brief and asks 1-2 clarifying questions specific to the segment
  - E.g., for a hospital: "Does the facility have a mandatory 100% uptime requirement? (affects whether you recommend N+1 redundancy)"
  - E.g., for a data centre: "Is this a Tier III or Tier IV certification target? (affects fuel tank sizing)"
  - If no questions needed: chatbot says "All clear — generating your pitch"
  - Rep answers if needed, then moves on

---

## PHASE 8 — Pitch Builder — Output + Side Panels

**Goal:** The pitch renders fullscreen but with usable side panels. Not a floating card. Not a void.

### Layout
```
+--------------------------------------------------+
|  Toolbar (slide nav + controls)                  |
+------------------+-----------+------------------+
|                  |           |                  |
|   [LEFT PANEL]   |  [SLIDE]  |  [RIGHT PANEL]   |
|   (collapsible)  |           |  (collapsible)   |
|                  |           |                  |
+------------------+-----------+------------------+
|  Nav bar (prev / slide count / next)             |
+--------------------------------------------------+
```

### Left Panel: Competitor Compare
- Matches the Genset Builder's competitor comparison page — that worked
- Select competitor from dropdown (pre-filled from form Step 3)
- Load comparison: KOEL product (auto-selected from form) vs. competitor product (nearest match ±25%)
- Comparison table loads inline in the panel
- "Open full comparison" button opens the full Competitor Analysis page in a new tab
- Panel is collapsible (chevron toggle)

### Right Panel: Rep Notes
- This is what the Genset Builder and Sales Intelligence both had — keep it
- AI-generated talking points for this segment + this competitor
- Not shown to customer
- Collapsible

### Slides (5, same structure as Sales Intelligence but better content and fully fullscreen):
1. Cover — customer name, segment, date, KOEL credentials
2. Recommendation — product photo + full spec table
3. Running Costs — live TCO calculator with sliders (already built in Sales Intelligence, copy it)
4. Track Record — references for this segment near this city (auto-pulled from Track Record module)
5. Next Steps — three-step close with site visit ask

### PDF Export
- Export all 5 slides to PDF (html2pdf.js, already in project)
- File name: `KOEL_[CustomerName]_[Date].pdf`

---

## PHASE 9 — Track Record Module

**Goal:** KOEL's reference database. Proof points reps actually use.

### Data structure (already partially built in Sales Intelligence)
- Reference engine already exists — copy it
- Expand with more references across all segments (not just industrial/telecom)
- Each reference has: segment, sub-segment, state, district, product used, years running, proof point, is_GOEM (institutional/govt flag)

### UI
- Standalone page: searchable/filterable table of references
  - Filter by: segment, state, kVA range, product
  - Each row expandable for detail
- Also embedded in pitch (Slide 4 auto-pulls best references for this segment + city)

### Growing the database
- Phase 3 research will surface new references per segment
- Prasad's sales calls will add real verified references
- Mechanism to add new references (simple form, Supabase write — Phase 10)

---

## PHASE 10 — Database Layer

**Goal:** The app needs persistent data that can be updated without a code deploy.

### Decision: Supabase vs Google Sheets

| Factor | Supabase | Google Sheets |
|--------|----------|---------------|
| Setup complexity | Moderate (need account, schema) | Low (just a spreadsheet) |
| Query flexibility | SQL — very powerful | Limited (VLOOKUP, API) |
| Real-time updates | Yes (Supabase realtime) | No |
| Prasad familiarity | Lower | Higher |
| Free tier | Generous | Unlimited |
| Best for | References, hotspot data, segment data | Quick prototyping |

**Recommendation:** Start with Google Sheets API for speed (Prasad knows it), migrate to Supabase when the schema stabilises.

### Tables needed
1. `references` — all Track Record entries
2. `segment_hotspots` — district-level hotspot data per segment
3. `segment_cheatsheets` — the deep segment research (could be JSON in Supabase or a sheet)
4. `goem_territories` — which GOEM covers which states

### Update protocol
- Segment data: updated by Prasad after sales call sessions
- References: added as reps share new proof points
- Hotspots: updated when new clusters are identified
- All updates through simple admin form (or directly in Google Sheet / Supabase table)

---

## PHASE 11 — AI Architecture + SOP

**Goal:** Every AI call in the app has a defined system prompt, a defined output schema, and a defined fallback. No surprises in front of a customer.

### Current AI usage (from Sales Intelligence)
- Pitch generation: system prompt in `src/lib/ai.js`
- Uses Gemini API (Prasad has key)
- Generates: pitch_opener, why_for_segment, battlecard, rep_notes

### Planned AI usage in Sales Pro
1. **Pitch generation** — same as above but improved system prompt incorporating deep segment knowledge
2. **Chatbot (post-form)** — reads brief, asks 1-2 clarifying questions based on segment-specific rules
3. **Lead detection summary** — (optional, later) fetches recent news for a segment and summarises new leads

### System prompt principles (hardcoded rules for every prompt)
- No em-dashes (—), no exclamation marks, no superlatives ("best", "revolutionary", "game-changing")
- Tone: the way a senior Kirloskar engineer speaks — confident, technical, understated
- All claims must be verifiable — no made-up stats
- Output must be structured JSON (schema defined per call type)
- If input is insufficient, ask for more rather than fabricate

### Gemma 4 (local, on Prasad's Mac)
- Prasad has Gemma 4 loaded via Ollama (or similar)
- Can be used for: offline demos, testing prompts without API costs
- NOT suitable for production quality output — Claude (via Gemini API or Anthropic) does the actual generation
- How to switch: environment variable `VITE_AI_PROVIDER=local|gemini|anthropic`

### Sources for segment updates (per segment)
- Telecom: TRAI quarterly reports, DoT notifications, tower company filings (Indus Towers annual report)
- Healthcare: NABH accreditation list, health ministry capex announcements, hospital chain expansion news
- Data Centres: CRISIL/ICRA DC sector reports, Cushman & Wakefield DC India report, NASSCOM
- Real Estate: CBRE India market reports, PropTiger new launches, RERA approvals
- Industrial: CMIE capex data, CII industrial outlook, DPIIT investment data
- Govt/PSU: tenders.gov.in, GeM portal, CPPP
- Infrastructure: NITI Aayog infra pipeline, AAI/Airports Authority tenders, NHIDCL

### SOP for adding new segment data
1. Identify source → note it in the relevant segment's data file
2. Extract relevant facts → add to segment cheatsheet JSON
3. If a new reference found → add to `references` table via admin form
4. If a new hotspot found → add to `segment_hotspots` with source citation
5. Redeploy (Netlify auto-deploys on git push)

---

## PHASE 12 — Lead Detection Workflow

**Goal:** Per-segment button that tells a rep "here's where to look for new business right now."

### MVP (Phase 12a — simple links)
- Each segment has a curated list of URLs to check for new leads
- Button opens them in new tabs
- Manual process — rep checks them themselves

### V2 (Phase 12b — AI-summarised, later)
- Button triggers an API call (Claude/Gemini) with a search query
- Returns: "3 new hospitals sanctioned in Maharashtra last month, 2 new data centres under construction in Hyderabad..."
- Displays as a brief summary card with links

### What qualifies as a lead trigger per segment?
- **Telecom**: New tower installation tenders, 5G site rollout announcements
- **Healthcare**: Newly licenced hospitals (Ministry of Health list), hospital chains announcing new campuses
- **Data Centres**: New DC project announcements (uptimeinstitutedata, DatacenterDynamics India news)
- **Real Estate**: New RERA project registrations, large residential/commercial projects approaching completion
- **Industrial**: New MIDC/GIDC/industrial park allotments, large factory capex announcements
- **Infrastructure**: New airport tenders, metro phase announcements, port development tenders
- **Education**: New university campuses (UGC approvals), private school chains expanding

---

## OPEN DECISIONS (to resolve with Prasad)

1. **Navbar name**: "KOEL Sales Pro" or "Kirloskar Sales Pro"? Leaning toward KOEL Sales Pro since all users know KOEL.
2. **"Limitless Tomorrow" font**: Need to match Kirloskar's exact brand font — needs investigation (Barlow Condensed? Bebas Neue? custom?)
3. **GOEM segment exposure**: For KOEL HQ only, or visible to GOEMs too? Currently leaning HQ-only.
4. **Database**: Start with Google Sheets (faster) or go straight to Supabase (more robust)?
5. **Chatbot mockup**: Is it framed as "Enterprise Brain" (future vision), or just "AI assistant"? Affects how Prasad presents this to management.
6. **Auth**: None initially (same as Genset Builder). Add later? Who should NOT have access?

---

## BUILD ORDER (recommended)

Given 6-7 weeks and the goal of having something demo-ready:

**Week 1:** Phase 0 (scaffold) + Phase 1 (Products copy) + Phase 2 (Competitor copy)
→ At end of Week 1: a working app with homepage, products, and competitor analysis

**Week 2:** Phase 3 begins (segment research, 2-3 segments per day with Claude)
→ Concurrent: Phase 7 (pitch form rework begins)

**Week 3:** Phase 3 continues (finish all segments) + Phase 4 (Segments module UI)
→ Concurrent: Phase 8 (pitch output + side panels)

**Week 4:** Phase 5 (India Heatmap — technically the hardest, needs D3)
→ Concurrent: Phase 9 (Track Record module)

**Week 5:** Phase 6 (GOEM layer) + Phase 10 (database)
→ Concurrent: Phase 11 (AI architecture, clean up all prompts)

**Week 6:** Phase 12 (lead detection MVP) + polish everything
→ Demo to Samir + HO sales reps → collect feedback → iterate

---

*Last updated: 15 April 2026*
*Author: Prasad + Claude*
