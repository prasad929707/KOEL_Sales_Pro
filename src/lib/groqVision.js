// ─────────────────────────────────────────────────────────────────────────────
// groqVision.js  —  Browser-side Groq API client
//
// Used for:
//   1. Visiting card scan  → extract company / name / phone / email / designation
//   2. Photo-to-note       → extract meeting notes from whiteboard/notebook photo
//
// Model: llama-3.2-11b-vision-preview  (Groq free tier, supports images)
// Free tier: ~14,400 requests/day — more than enough for 10 people
//
// API key: VITE_GROQ_API_KEY in .env.local
// Get yours free: https://console.groq.com
// ─────────────────────────────────────────────────────────────────────────────

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'  // replaces decommissioned llama-3.2-11b-vision-preview
const TEXT_MODEL   = 'llama-3.3-70b-versatile'

function getKey() {
  const key = import.meta.env.VITE_GROQ_API_KEY
  if (!key) throw new Error('VITE_GROQ_API_KEY not set in .env.local')
  return key
}

// ── Convert File/Blob to base64 data URL ─────────────────────────────────────
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result) // "data:image/jpeg;base64,..."
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Core Groq chat call ───────────────────────────────────────────────────────
async function groqChat(messages, model = TEXT_MODEL, maxTokens = 800) {
  const res = await fetch(GROQ_API_URL, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${getKey()}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens:  maxTokens,
      temperature: 0.1,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Groq API error ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ── 1. Scan visiting card → extract contact fields ────────────────────────────
//
// Returns: { company, contact, phone, email, designation, website }
// Any field it can't find → empty string
//
export async function scanVisitingCard(imageFile) {
  const base64 = await fileToBase64(imageFile)

  const prompt = `You are extracting contact details from a visiting card image.
Return ONLY a JSON object with these exact keys (empty string if not found):
{
  "company":     "company or organisation name",
  "contact":     "person's full name",
  "designation": "job title / designation",
  "phone":       "mobile or phone number (prefer mobile)",
  "email":       "email address",
  "website":     "website if present"
}
No explanation. No markdown. Only the JSON object.`

  const text = await groqChat(
    [{
      role: 'user',
      content: [
        { type: 'text',      text: prompt },
        { type: 'image_url', image_url: { url: base64 } },
      ],
    }],
    VISION_MODEL,
    400,
  )

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON in response')
    return JSON.parse(match[0])
  } catch {
    throw new Error('Could not parse card details. Try a clearer photo.')
  }
}


// ── 2. Extract notes from a photo (notebook, whiteboard, screenshot) ──────────
//
// Returns: { notes: string }  — clean paragraph text
//
export async function extractNotesFromPhoto(imageFile) {
  const base64 = await fileToBase64(imageFile)

  const prompt = `Extract all text and notes visible in this image.
This could be a notebook page, whiteboard, screenshot, or handwritten notes from a business meeting.
Return the extracted content as clean, readable text — preserve structure where possible.
If this is meeting notes, output them as bullet points.
Return ONLY the extracted text content. No preamble.`

  const text = await groqChat(
    [{
      role: 'user',
      content: [
        { type: 'text',      text: prompt },
        { type: 'image_url', image_url: { url: base64 } },
      ],
    }],
    VISION_MODEL,
    1000,
  )

  return text.trim()
}


// ── 3. Quick text chat (for future use — AI assistant on lead context) ─────────
export async function askAboutLead(question, leadContext) {
  const system = `You are a sales assistant for KOEL (Kirloskar Oil Engines), helping a BD team member.
Context about this lead:
Company: ${leadContext.company}
Segment: ${leadContext.segment}
City: ${leadContext.city}, ${leadContext.state}
Stage: ${leadContext.stage}
kVA: ${leadContext.kvaEstimate || 'unknown'}
Notes: ${leadContext.notes || 'none'}

Be concise and practical. Answer in 2-3 sentences max.`

  return groqChat(
    [{ role: 'user', content: question }],
    TEXT_MODEL,
    300,
  )
}


// ── Health check — call this on mount to verify key works ─────────────────────
export async function checkGroqKey() {
  try {
    await groqChat([{ role: 'user', content: 'hi' }], TEXT_MODEL, 5)
    return true
  } catch {
    return false
  }
}
