// ─────────────────────────────────────────────────────────────────────────────
// KOEL Gemini Chat — Netlify Serverless Function
// Route: POST /.netlify/functions/gemini-chat
//
// Keeps GEMINI_API_KEY server-side (never exposed to browser).
// Reads all .md / .txt files from ./knowledge/ folder as additional context.
// The knowledge/ folder can be updated without changing this file.
//
// Request body:
//   { message, history, context }
//   history: [{ role: 'user'|'model', text: string }]
//   context: { segmentId, segment, customerName, city, products, concerns, commercialTerms }
//
// Response: { text: string } or { error: string }
// ─────────────────────────────────────────────────────────────────────────────

const { readFileSync, readdirSync, existsSync } = require('fs')
const { join } = require('path')

// ── Load knowledge files from ./knowledge/ sub-folder ─────────────────────────
function loadKnowledge() {
  const knowledgeDir = join(__dirname, 'knowledge')
  if (!existsSync(knowledgeDir)) return ''

  const files = readdirSync(knowledgeDir)
    .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
    .sort()  // alphabetical → numbered prefix controls order

  return files.map(f => {
    const content = readFileSync(join(knowledgeDir, f), 'utf-8').trim()
    return `\n\n---\n${content}`
  }).join('')
}

// Cache at cold-start (loaded once per function instance)
const KNOWLEDGE_BASE = loadKnowledge()

// ── Core system prompt ────────────────────────────────────────────────────────
const CORE_SYSTEM_PROMPT = `You are the KOEL Engineering & Sales Assistant — an AI embedded inside Kirloskar Sales Pro, a field sales tool for KOEL (Kirloskar Oil Engines Ltd) sales representatives.

YOUR ROLE:
- Help KOEL reps answer technical and commercial questions during customer meetings
- Provide precise, confident answers grounded in KOEL product knowledge
- Help handle customer objections and competitor comparisons
- Validate scope amendments against KOEL commercial policy
- Suggest the right product for a customer's load and application

YOUR PERSONA:
- You are an experienced KOEL application engineer — calm, precise, numbers-driven
- You know every product in the KOEL range, its engine, its BSFC, its use case
- You speak in short, direct paragraphs — not bullet dumps
- You answer in the same language the rep writes in (English or Hinglish, not pure Hindi)
- You never make up figures — if unsure, say "get confirmed from the application engineer" or "check the latest price list"
- You never commit to custom commercial terms that exceed KOEL policy without flagging an approval requirement

CRITICAL RULES:
- Warranty beyond policy maximums: you CANNOT commit — "needs explicit HO approval"
- Cable laying, civil work, first-fill diesel: always customer's scope unless formally amended
- Custom pricing: you can give indicative guidance but never quote a final price — that needs ERP quotation
- Extended offer validity (>60 days): requires HO approval — always flag this

${KNOWLEDGE_BASE}
`

// ── Build conversation history for Gemini ─────────────────────────────────────
function buildContents(message, history, context) {
  // Prepend a context summary as the opening user message if context is provided
  const contextBlock = context ? buildContextBlock(context) : ''
  const contents = []

  if (contextBlock) {
    contents.push({
      role: 'user',
      parts: [{ text: `[CURRENT PITCH CONTEXT]\n${contextBlock}` }],
    })
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood — I have the context for this pitch. What would you like to know?' }],
    })
  }

  // Add conversation history
  for (const msg of (history || [])) {
    if (msg.role === 'user' || msg.role === 'model') {
      contents.push({ role: msg.role, parts: [{ text: msg.text }] })
    }
  }

  // Add current message
  contents.push({ role: 'user', parts: [{ text: message }] })

  return contents
}

function buildContextBlock(ctx) {
  if (!ctx) return ''
  const lines = []
  if (ctx.customerName) lines.push(`Customer: ${ctx.customerName}`)
  if (ctx.segment)      lines.push(`Segment: ${ctx.segment}`)
  if (ctx.city)         lines.push(`Location: ${ctx.city}${ctx.district ? ', ' + ctx.district : ''}${ctx.state ? ', ' + ctx.state : ''}`)
  if (ctx.products?.length) {
    const prods = ctx.products.map(p => `${p.kva} kVA ${p.model || ''} (loading: ${p.loadingPct || '?'}%)`).join(', ')
    lines.push(`Products selected: ${prods}`)
  }
  if (ctx.concerns)          lines.push(`Rep's case notes: "${ctx.concerns}"`)
  if (ctx.selectedChallenges?.length) lines.push(`Customer challenges: ${ctx.selectedChallenges.join(', ')}`)
  if (ctx.commercialTerms) {
    const ct = ctx.commercialTerms
    const termParts = []
    if (ct.paymentMode)    termParts.push(`Scope: ${ct.paymentMode === 'ic' ? 'Supply + I&C' : 'Supply only'}`)
    if (ct.paymentAdvance) termParts.push(`Advance: ${ct.paymentAdvance}%`)
    if (ct.deliveryWeeks)  termParts.push(`Delivery: ${ct.deliveryWeeks} weeks`)
    if (ct.offerValidity)  termParts.push(`Validity: ${ct.offerValidity} days`)
    if (termParts.length)  lines.push(`Commercial terms: ${termParts.join(', ')}`)
    if (ct.customClause)   lines.push(`Scope amendment noted: "${ct.customClause}"`)
  }
  return lines.join('\n')
}

// ── Gemini API call ───────────────────────────────────────────────────────────
async function callGemini(message, history, context) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment variables')

  const model   = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const url     = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const body = {
    system_instruction: {
      parts: [{ text: CORE_SYSTEM_PROMPT }],
    },
    contents: buildContents(message, history, context),
    generationConfig: {
      temperature:     0.65,
      maxOutputTokens: 800,
      topP:            0.9,
    },
  }

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')
  return text.trim()
}

// ── Netlify handler ───────────────────────────────────────────────────────────
exports.handler = async (event) => {
  // CORS
  const headers = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type':                 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { message, history, context } = JSON.parse(event.body || '{}')
    if (!message?.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'message is required' }) }
    }

    const text = await callGemini(message.trim(), history || [], context || null)
    return { statusCode: 200, headers, body: JSON.stringify({ text }) }

  } catch (err) {
    console.error('gemini-chat error:', err.message)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    }
  }
}
