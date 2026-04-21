# SPINE — Kirloskar Intelligence Platform

**Read this first. Every session. No exceptions.**

Owner: Prasad Mali · Last updated: 17 April 2026

---

## 0. How to use this file

If you are a new Claude session on this project, read this file end-to-end before you touch code or write another doc. Then read the two appendix files (paths below). That is the full brief. Prasad should not have to re-explain context.

**Mandatory appendix reading (in this order):**
1. `Kirloskar_Sales_Pro/Landscape/2b2b.md` — competitive triangulation playbook (Vision Lab fuel)
2. `KOEL_Genset_Builder/KOEL_OpportunityTracker_WorkingDoc.md` — opportunity tracker playbook (Opportunities fuel)

Also relevant but not mandatory each time: `CORE.md` (Sales Pro vision) and `TIMELINE.md` (Sales Pro phases).

---

## 1. The three products

One app. Three modules. Do not conflate them.

| Module | URL | Audience | Unit of analysis | Purpose |
|---|---|---|---|---|
| **Sales Pro** | `/sales-pro` | GOEM/KGD field reps | One customer / one pitch | Operational sales toolkit (already built) |
| **Opportunities** | `/opportunities` | BD lead, sales planners | One project (DC, hospital, township) | Where demand meets coverage → gap map |
| **Vision Lab** | `/vision-lab` | BD lead, BU Head, CEO | One segment × one year | Path to 2B2B FY30, grounded in AR data |

The old "Marksight" module is dead. It tried to be both Opportunities and Vision Lab and ended up being neither. `/marksight` now redirects to `/opportunities`.

---

## 2. Numbers-strict architecture (the single most important rule)

This will be presented to a reviewer who is strict on numbers. Therefore:

**Every number shown in the app must be traceable and editable in one place.**

### 2.1 The Entry schema

No component ever hardcodes a number. Every numeric value is an `Entry` object:

```json
{
  "value": 4200,
  "unit": "₹ Cr",
  "source": "KOEL AR FY24-25, p.84 Operational Performance",
  "sourceUrl": "/Landscape/KOEL/Annual Report FY 2024-25.pdf",
  "confidence": "high",
  "lastUpdated": "2026-04-17",
  "notes": "Standalone Power Gen segment revenue. Excludes International."
}
```

Confidence values: `high` · `medium` · `low` · `estimated`.

### 2.2 Rendering rules

- Every Entry renders via a single helper component (to be built): `<Figure entry={...} />`.
- Default render: value + unit + small `ⓘ` tag. Hover/click `ⓘ` → source card with all fields.
- `confidence: estimated` → orange dashed outline around the figure.
- `confidence: low` → small orange dot on the figure.
- Never display a number without an Entry. If an Entry is missing, show a dashed placeholder pill "Needs data" linking to the data file — do NOT invent.

### 2.3 Data file layout

```
src/data/
├── vision/
│   ├── koel_actuals.json           # FY-wise revenue, units, kVA-split. Entry objects.
│   ├── cummins_actuals.json
│   ├── greaves_actuals.json
│   ├── market_size.json            # Segment × year market size Entries
│   ├── kva_bands.json              # LHP/MHP/HHP definitions + typical realization
│   └── vision_targets.json         # KOEL's FY30 target, segment-wise ambition
├── opportunities/
│   ├── data_centers.json
│   ├── real_estate.json
│   ├── healthcare.json
│   ├── telecom.json
│   ├── hospitality.json
│   └── infrastructure.json
└── shared/
    ├── segment_taxonomy.json       # 12 segments + sub-segments, kVA ranges
    ├── goem_territories.json       # Official GOEM → state map (validated w/ Sales Ops)
    └── kirloskar_regions.json
```

Existing `marksightData.js` is legacy — its data gets migrated into the JSONs above, then the file is deleted.

### 2.4 Excel-upload roadmap (future, not this session)

End-state: `/_inputs_template.xlsx` — one sheet per JSON file above, one row per Entry. Prasad populates, uploads via Settings → Data Sources, SheetJS parses, JSONs overwrite, every figure in the app refreshes.

Design consequence today: the JSON shape must be flat and Excel-mappable. No nested objects inside Entry values. No arrays of arrays. Keep each file to a table.

---

## 3. Folder map (what is where)

### Project root: `KOEL_Genset_Builder/`

```
KOEL_Genset_Builder/
├── Kirloskar_Sales_Pro/    ← THE live app. All future work here.
│   ├── SPINE.md            ← This file.
│   ├── CORE.md             ← Sales Pro vision (still valid).
│   ├── TIMELINE.md         ← Sales Pro phase tracker.
│   ├── src/
│   ├── public/
│   ├── Landscape/          ← Competitor AR PDFs + 2b2b.md.
│   └── ...
├── KOEL_OpportunityTracker_WorkingDoc.md   ← Opportunities playbook (appendix).
├── Datasheets/             ← Product datasheet PDFs.
├── Segments/               ← Research & reference material.
├── _archive/               ← Old builds + superseded projects. Do not touch.
└── assets/                 ← Shared images / brand assets.
```

### Inside `Kirloskar_Sales_Pro/src/`

```
src/
├── App.jsx                 ← Routes. Touch carefully.
├── main.jsx
├── index.css               ← Design tokens (teal, orange, slate, etc.)
├── pages/
│   ├── PlatformHome.jsx    ← 3-tile launcher
│   ├── Home.jsx            ← Sales Pro home (at /sales-pro)
│   ├── Opportunities.jsx   ← Scaffold → to be built out
│   ├── VisionLab.jsx       ← Scaffold → to be built out
│   ├── Marksight.jsx       ← LEGACY, unrouted. Delete after map fix lands.
│   └── ... (existing Sales Pro pages — do not touch)
├── components/
│   ├── Navbar.jsx
│   ├── IndiaMap.jsx        ← Shared by Opportunities + Vision Lab
│   └── ...
├── data/
│   ├── vision/             ← To be created
│   ├── opportunities/      ← To be created
│   ├── shared/             ← To be created
│   └── marksightData.js    ← LEGACY, to migrate + delete
└── lib/
    └── dataUtils.js        ← To be created: loadEntry(), <Figure>, etc.
```

---

## 4. Netlify deploy flow

The Sales Pro app is already deployed on Netlify (Prasad set it up earlier). It is the SAME site going forward — we don't create a new deploy.

**To push an update:**

1. `cd Kirloskar_Sales_Pro`
2. `npm run build` — outputs to `dist_v<N>/` (version auto-increments — see note below).
3. Drag the latest `dist_v<N>/` folder onto the existing Netlify deploy page, OR use `netlify deploy --prod --dir=dist_v<N>`.
4. The live URL does not change.

**Note on dist versioning:** `vite.config.js` is set up to create a new `dist_v<N>/` each build. That is why there are ~20 `dist_v*` folders. The intent was version snapshots; the reality is clutter. Decision pending: either (a) keep only latest 3, or (b) revert to plain `dist/`. Flag this when user is ready to decide.

---

## 5. India map — DONE (2026-04-17)

**What shipped:**
- `public/india-states.geojson` is now Survey-of-India-compliant via Datameet (`maps-master/States/Admin2.shp` converted with pyshp + shapely `simplify(0.01, preserve_topology=True)`, coords rounded to 3 decimals).
- 36 features, **310 KB** (down from 23 MB GADM v2).
- Modern names: `Odisha`, `Uttarakhand`, `Ladakh` (separate from `Jammu & Kashmir`), `Dadra and Nagar Haveli and Daman and Diu`.
- Full Indian claim: PoK included in `Jammu & Kashmir` (lat to 35.12°N), Aksai Chin included in `Ladakh` (lat to 37.08°N).
- Old GADM file archived at `public/india-states-gadm-old.geojson.bak`.

**Property schema change:** new file uses `ST_NM`, old one used `NAME_1`. `IndiaMap.jsx` now reads via a `featureName(geo)` helper that tries `ST_NM` first, falls back to `NAME_1` — works with either.

**Legacy-data compat:** `STATE_NAME_ALIASES` in `IndiaMap.jsx` translates old→canonical (Orissa→Odisha, Uttaranchal→Uttarakhand, Jammu and Kashmir→Jammu & Kashmir, Andaman and Nicobar→Andaman & Nicobar, Dadra…→merged UT). Legacy `marksightData.js` keeps working until we write the new `goem_territories.json`.

**Source assets in repo (kept for re-conversion if simplification ever needs a redo):**
- `_map_source/maps-master/` — full Datameet clone (States shapefile, Country outlines, Districts, Survey-of-India index tiles). ~486 MB. Moved OUT of `public/` so Netlify doesn't ship half a gig of raw source.
- `_map_source/india-districts.geojson` (34.5 MB raw) — needs the same simplify pass before any district view gets wired up.
- `_map_source/india-cities.json` (5 MB raw city points) — for future bubble overlays.
- `_map_source/india-states-gadm-old.geojson.bak` — the old 23 MB GADM file, kept for sanity diffs only.

**Still to do:**
- Write new `src/data/shared/goem_territories.json` using canonical SoI names.
- Simplify `india-districts.geojson` (same pipeline) when district view is needed.
- Delete legacy `Marksight.jsx` + `marksightData.js` once `goem_territories.json` is live.

---

## 6. Session log — what is done, what is next

### Done (Session 1 — 17 Apr 2026)
- PlatformHome rebuilt: 3 light-theme tiles (Sales Pro, Opportunities, Vision Lab). No dark cards.
- `/opportunities` and `/vision-lab` pages scaffolded (placeholder content, clean header).
- `App.jsx` routes updated; `/marksight` → redirects to `/opportunities`.
- `Navbar.jsx` updated: old Marksight link replaced by Opportunities + Vision Lab links.
- Build verified: `npm run build` succeeds, 78 modules, no errors.

### Next chunks (in order)
1. **Folder tidy** — move old dist_v* + KOEL_ENTERPRISE_BRAIN + KOEL_Sales_Intelligence into `_archive/`. Remove vite timestamp cache files.
2. **Data scaffolding** — create `src/data/{vision,opportunities,shared}/` with empty-but-shape-correct JSON files. Build `src/lib/dataUtils.js` with `<Figure>` component.
3. **Vision Lab round 1** — extract KOEL / Cummins / Greaves FY25 Power Gen anchors from the AR PDFs in `Landscape/`. Populate `*_actuals.json`. Render the Market Anchors block with real sourced numbers.
4. **India map replacement** — DONE (SoI geojson now in `public/`, see §5).
5. **Opportunities round 1** — seed 10 data-center projects (manual from JLL / operator IR) into `data_centers.json`. Render the Project Pipeline block.
6. **GOEM territory validation** — get the official GOEM → state map from Sales Ops. Populate `goem_territories.json`. Render the GOEM coverage view.
7. **Gap Analysis** — once 5 + 6 are in, render the gap view.
8. **Delete legacy** — remove `Marksight.jsx`, `marksightData.js`.

---

## 7. Hard rules — do not break these

1. **No hardcoded numbers.** If you write `4200` in a component, you are wrong. It goes in a JSON Entry.
2. **No invented data.** If you do not have a source, the cell is `Needs data`, not a guess. The reviewer will catch this.
3. **No new modules without Prasad's consent.** Three modules. That is the scope.
4. **India map must show PoK + Aksai Chin as Indian territory.** Non-negotiable.
5. **No AI filler.** No "I've created an amazing...". Get to the point. Confident and factual.
6. **Small chunks, ask for continue.** Do not try to write 1000-line monolith docs in one go and stall. Short bits, commit visible work, ask to proceed.
7. **No assumptions about missing data.** Flag as a question for the user. Never fill in.
8. **Do not touch Sales Pro pages** (PitchBuilder, Compare, ProductRange, Optiprime, TrackRecord, SegmentsPlaceholder). That app is live. Changes there require explicit ask.

---

## 8. Appendix — Prasad's original founding prompts

These are preserved verbatim because the thinking in them is what drove the product split. Do not lose this.

### Appendix A — The Opportunities prompt (Prasad, 17 Apr 2026)

> KOEL has PULSE CRM and INSIA (Insights for all), they have large amounts of data, but many have complained that it is almost laggy and bad (shitty), why? GOEMs, dealers most likely use their own CRM and pulse me bas closures hone par update karte. INSIA bhi thik tha hai, but 90s style.
>
> So whatever i do, might again go as a recommendation that improve these system like this — but woh validation bhi mushkil hai. I just spoke to an intern who is working under Mr. Mangesh who is AVP and starting a business development and reports to the BU Head and CEO.
>
> What i understood from him is, the PULSE CRM has a scrappy long-ass segment code and numbers i.e. sub-types which is not accurate, has redundancies, so it is unreliable. And today if KOEL sold 1000 units of something, they don't actually know the correct bifurcation of it — konse segments me kitna becha. So he is trying to improve it: pehle woh segments ko shortlist karega like refine, ki 100s nahi, or remove overlaps or whatever, and then decide key segments and for those decide AOP (annual operating plan) something like that for each segment. That is kinda business development — that is what he is doing.
>
> Now i enquired the intern if he has any system that he is building to track this — probably not. He is making these interns research for which they are doing a good job to find actual data but again static hai bhai, this data will be outdated in 2 months. Mujhe andar se aawaz aari mixed in excitement: what if i build this tracker?
>
> For all segments, it tracks the opportunities, builds heat map, shows GOEMs ka exposure — ye inko kitna useful hoga pata nahi, but in the process i will develop this skill, samjh bhi aayega kin chizo ka cluster kaha hai.
>
> But this will be fucking exhaustive. 12-14 kuch segments the, unke andar sub-segments, abh har chiz me kitna deep jayenge? And users don't fill this right. If i now link ki mere app me segment and sub segment choose karo, proposal me uss hisaab se kuch cheezein change hongi — but ye unnecessary hoga kya? Like proposal could be standard. Faltu me complication bhi ho sakta. How do we address that?

### Appendix B — The 2B2B / Vision prompt (Prasad, 17 Apr 2026)

> Aare sunna, i just had a thought — how do these AVP and CEO actually have a market share ka data? Banta kaise hai accurate wala? Would you recommend me top 5 ya 6 players ka saara investor relations pdf save karlu mere folder me? Why?
>
> Cause ek ekdum alag hi level ka thought aaya: why are we doing this market research angle? Opportunity dekhne? Business development? Revenue? Right? Toh iss direction me, if you read the investor relations, AR etc i have saved for KOEL — don't they say 2B2B or here they say 4x5y? Woh aim hai na?
>
> So why not make this some form of uss vision ko dekhne ka tarika? I am skeptical to call it a calculator again cause that makes this sound cheap. But this has to have all the nuances the C-suite cares for — like saaree segments ka industry trend jaanna zaruri hai, but sirf CAGR ke basis par calculations karna is a baby move. Not useful. Has to have stronger grounding. How is that possible?
>
> Koi industry down ja raha then kaunsa, kaise, why. Now kaunsa competitor kis me historically kaise karra — is there a way to identify? Koi source hota hai kya? Khud KOEL is not giving me sales ka data toh karenge kaise ye?
>
> One line vision i thought was: **this tool could show if you wanna achieve 4x5y then how that picture will appear.**
>
> He was talking of how KALA had a sales of 550 something so sagle saal ka AIP would be 650. But ese inputs toh mere paas hain hi nahi. Toh mein kaise use karunga? Investordocks se LHP, MHP, HHP ye data milta? Like i heard KOEL did 42,000 gensets this year, but usme se 39,000 are in sub 320 kVA — ye bhi maanga hai. Kya karu?

---

## 9. Appendix — pointers to the playbooks

Do NOT duplicate these here. Read them from source each time:

- **Vision Lab playbook:** `Kirloskar_Sales_Pro/Landscape/2b2b.md` — competitive triangulation method, what to download from Cummins / Greaves ARs, FY year logic, 1-page synthesis target.
- **Opportunities playbook:** `KOEL_Genset_Builder/KOEL_OpportunityTracker_WorkingDoc.md` — segment-by-segment data sources (JLL, RERA, operator IR), LLM research prompts, kVA translation formulas, sheet structure, GOEM overlay logic.

If you are working on Vision Lab, you must have read 2b2b.md in the current session. If you are working on Opportunities, you must have read the opportunity tracker doc. No exceptions.

---

*End of SPINE. If anything here is wrong or stale, fix it in this file before touching anything else.*
