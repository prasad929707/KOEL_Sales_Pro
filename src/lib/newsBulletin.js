// ─────────────────────────────────────────────────────────────────────────────
// newsBulletin.js  —  Live Market Pulse bulletin
//
// Flow:
//   1. Tavily /extract → scrape the segment's source URLs for fresh content
//   2. Groq llama-3.3-70b → synthesise a KOEL-angle bulletin from that content
//   3. Store bulletin + timestamp in localStorage
//   4. Track "mark as read" per bulletin ID in localStorage
//
// API keys: VITE_TAVILY_API_KEY, VITE_GROQ_API_KEY (both from .env.local)
// ─────────────────────────────────────────────────────────────────────────────

const TAVILY_EXTRACT_URL = 'https://api.tavily.com/extract'
const GROQ_API_URL       = 'https://api.groq.com/openai/v1/chat/completions'
const TEXT_MODEL         = 'llama-3.3-70b-versatile'

function getTavilyKey() {
  const key = import.meta.env.VITE_TAVILY_API_KEY
  if (!key) throw new Error('VITE_TAVILY_API_KEY not set in .env.local')
  return key
}

function getGroqKey() {
  const key = import.meta.env.VITE_GROQ_API_KEY
  if (!key) throw new Error('VITE_GROQ_API_KEY not set in .env.local')
  return key
}

// ── LocalStorage keys ─────────────────────────────────────────────────────────
const bulletinKey = (segmentId) => `koel_pulse_bulletin_${segmentId}`
const readKey     = (segmentId) => `koel_pulse_read_${segmentId}`

// ── Tavily: scrape source URLs ────────────────────────────────────────────────
async function extractFromSources(sources) {
  const urls = sources
    .filter(s => s.url && s.url.trim() !== '')
    .map(s => s.url)

  if (urls.length === 0) throw new Error('No valid source URLs found')

  const res = await fetch(TAVILY_EXTRACT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getTavilyKey()}`,
    },
    body: JSON.stringify({
      urls,
      include_raw_content: false, // clean extracted text only
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Tavily extract failed: ${err}`)
  }

  const data = await res.json()
  // data.results = [{ url, raw_content, ... }]
  return data.results || []
}

// ── Groq: synthesise bulletin from extracted content ──────────────────────────
async function synthesiseBulletin(extractedResults, segmentLabel, sources) {
  // Build context block — one section per successfully extracted URL
  const sourceSummaries = extractedResults
    .filter(r => r.raw_content || r.content)
    .map(r => {
      const src = sources.find(s => s.url === r.url)
      const name = src ? src.name : r.url
      const content = (r.raw_content || r.content || '').slice(0, 1500) // cap per source
      return `SOURCE: ${name}\nURL: ${r.url}\nCONTENT:\n${content}`
    })
    .join('\n\n---\n\n')

  if (!sourceSummaries.trim()) {
    throw new Error('No extractable content from sources — may be paywalled or unavailable')
  }

  const prompt = `You are a market analyst working for Kirloskar Oil Engines Ltd (KOEL), a leading Indian genset manufacturer. You are researching the "${segmentLabel}" segment to help KOEL's business development team identify sales opportunities.

Below is freshly scraped content from KOEL's curated research sources for this segment. Your job is to extract the most recent and significant developments, trends, and news — and frame each one from KOEL's business perspective.

---
${sourceSummaries}
---

Generate a market bulletin with exactly 4 to 6 points. Each point must:
- Be based ONLY on information found in the sources above (do not invent or hallucinate)
- Have a short headline (under 12 words)
- Have a 2–3 sentence summary of the finding
- Identify the source name it came from
- Have a "KOEL Angle" — 1–2 sentences on what this means for KOEL's BD team specifically (opportunity, threat, action to take)
- Be tagged as one of: opportunity | trend | competitor | policy | announcement

Respond ONLY with valid JSON in this exact format:
{
  "points": [
    {
      "headline": "...",
      "summary": "...",
      "source": "...",
      "tag": "opportunity",
      "koel_angle": "..."
    }
  ]
}`

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getGroqKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1800,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq synthesis failed: ${err}`)
  }

  const data = await res.json()
  const raw  = data.choices?.[0]?.message?.content || '{}'
  const parsed = JSON.parse(raw)

  if (!parsed.points || parsed.points.length === 0) {
    throw new Error('Groq returned no bulletin points')
  }

  return parsed.points
}

// ── Public: refresh bulletin (Tavily → Groq → store) ─────────────────────────
export async function refreshBulletin(sources, segmentLabel, segmentId) {
  const extractedResults = await extractFromSources(sources)
  const points           = await synthesiseBulletin(extractedResults, segmentLabel, sources)

  const bulletin = {
    id:           `${segmentId}_${Date.now()}`,
    segment_id:   segmentId,
    segment_label: segmentLabel,
    generated_at: new Date().toISOString(),
    points,
    source_count: extractedResults.filter(r => r.raw_content || r.content).length,
  }

  localStorage.setItem(bulletinKey(segmentId), JSON.stringify(bulletin))
  return bulletin
}

// ── Public: get stored bulletin ───────────────────────────────────────────────
export function getStoredBulletin(segmentId) {
  try {
    const raw = localStorage.getItem(bulletinKey(segmentId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ── Public: mark as read ──────────────────────────────────────────────────────
export function markAsRead(bulletinId, segmentId) {
  const record = { bulletin_id: bulletinId, read_at: new Date().toISOString() }
  localStorage.setItem(readKey(segmentId), JSON.stringify(record))
}

// ── Public: get read state ────────────────────────────────────────────────────
export function getReadState(segmentId) {
  try {
    const raw = localStorage.getItem(readKey(segmentId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ── Public: is this bulletin already read? ────────────────────────────────────
export function isBulletinRead(bulletin, segmentId) {
  if (!bulletin) return false
  const state = getReadState(segmentId)
  return state?.bulletin_id === bulletin.id
}
