# Kirloskar Sales Pro — Core Vision

> "We will fucking develop this." — Prasad, 15 April 2026

---

## What This Is

**Kirloskar Sales Pro** is an AI-augmented sales intelligence platform for KOEL field reps, KGD reps, and GOEM reps. It lives in a browser. No login friction. It gives a rep everything they need — before they walk into a meeting, during it, and to follow up after.

It is also a demonstration artifact. When this internship ends, this tool should be good enough to show KOEL's IT team and say: *this is what your reps could have. Build this.*

---

## Who Uses It

| User | What they need |
|------|---------------|
| GOEM / KGD sales rep | Segment context, competitor counters, product sizing, a pitch they can walk a customer through |
| KOEL HQ (Sales/Marketing) | Segment intelligence, GOEM exposure map, lead intelligence |
| Prasad (intern) | Evidence that he built something real |

---

## The Five Modules

1. **Pitch Builder** — Rep fills a form (block load → product rating → customer context), gets a structured customer-facing pitch with live TCO, competitor panel, references. This replaces everything in KOEL Sales Intelligence.

2. **Competitor Analysis** — Copied from Genset Builder. Side-by-side product comparison. Rep selects KOEL product and competitor, loads comparison datasheet. PDF download.

3. **Products** — Copied from Genset Builder. Full product range with photos, specs, Optiprime page. Navbar element.

4. **Segments** — The core differentiator. Deep cheat sheets for every segment and sub-segment. What parameters matter, what gets discussed, who the buyer is, what objections come, what proof points land. India heatmap showing where each segment clusters, down to districts. GOEM segment exposure overlay.

5. **Track Record** — KOEL's reference database. Best proof points. Accessible standalone and embedded inside the pitch.

---

## Design Philosophy

- **Genset Builder was the benchmark.** Sales Intelligence was a prototype. This is the real thing.
- Tagline: **"Limitless Tomorrow"** — match the font style exactly (Kirloskar's own brand language)
- Dark navy + teal. No toy UI. No floating cards in a void. Everything fullscreen or intentional.
- No sensationalism. No em-dashes. No AI-speak. Calm, factual, credible.
- Every number must be a real number. Every claim must be checkable.

---

## The Core Principle

**Segment wisdom is the foundation of everything.**

- The pitch changes based on the segment.
- Competitor talking points change based on the segment.
- Proof points change based on the segment.
- Even the product sizing questions change based on the segment.

If the segment intelligence is shallow and generic, every module downstream is weak. This is why the segment research phase is non-negotiable and will not be rushed.

---

## What We Are NOT Building

- A CRM (that's Pulse — KOEL already has it, interns can't access it, and it has bad data anyway)
- A backend API server (static frontend + Supabase or Google Sheets for data)
- A mobile app (browser-first, responsive is nice-to-have)
- Anything that requires KOEL IT approval before a rep can use it (no SSO, no VPN dependencies)

---

## The Real Deadline

Prasad's internship ends approximately mid-June 2026 (~8 weeks from 15 April).

The goal is 80% of this done in 3 weeks of focused work, polished enough to demo to Samir and any sales rep at HO.

The segment research is the one thing that cannot be compressed — it needs Prasad's industry access (sales calls he'll arrange with Samir's KGDs) + Claude's research depth. Every segment gets proper treatment.

---

## High Altitude Project (Parallel)

Samir assigned Prasad as POC for a high altitude genset study — coordinating with tech and commercial teams. This is a separate workstream. Documented separately when briefed.

---

*Last updated: 15 April 2026*
