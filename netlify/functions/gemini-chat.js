// ─────────────────────────────────────────────────────────────────────────────
// KOEL AI Chat — Netlify Serverless Function (powered by Groq)
// Route: POST /.netlify/functions/gemini-chat
//
// Keeps GROQ_API_KEY server-side (never exposed to browser).
// Reads all .md / .txt files from ./knowledge/ folder as additional context.
// ─────────────────────────────────────────────────────────────────────────────

const { readFileSync, readdirSync, existsSync } = require('fs')
const { join } = require('path')

// ── Load knowledge files from ./knowledge/ sub-folder ─────────────────────────
function loadKnowledge() {
  const knowledgeDir = join(__dirname, 'knowledge')
  if (!existsSync(knowledgeDir)) return ''

  const files = readdirSync(knowledgeDir)
    .filter(f => f.endsWith('.md') || f.endsWith('.txt'))
    .sort()

  return files.map(f => {
    const content = readFileSync(join(knowledgeDir, f), 'utf-8').trim()
    return `\n\n---\n${content}`
  }).join('')
}

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

// ── Build context block from pitch data ───────────────────────────────────────
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
  if (ctx.concerns)               lines.push(`Rep's case notes: "${ctx.concerns}"`)
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

// ── Build OpenAI-compatible messages array ────────────────────────────────────
function buildMessages(message, history, context) {
  const messages = [
    { role: 'system', content: CORE_SYSTEM_PROMPT }
  ]

  // Inject pitch context as first exchange
  const contextBlock = buildContextBlock(context)
  if (contextBlock) {
    messages.push({ role: 'user',      content: `[CURRENT PITCH CONTEXT]\n${contextBlock}` })
    messages.push({ role: 'assistant', content: 'Understood — I have the context for this pitch. What would you like to know?' })
  }

  // Add conversation history (Gemini uses 'model', OpenAI uses 'assistant')
  for (const msg of (history || [])) {
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.text })
    } else if (msg.role === 'model' || msg.role === 'assistant') {
      messages.push({ role: 'assistant', content: msg.text })
    }
  }

  // Add current user message
  messages.push({ role: 'user', content: message })

  return messages
}

// ── Groq API call ─────────────────────────────────────────────────────────────
async function callGroq(message, history, context) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set in environment variables')

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  const url   = 'https://api.groq.com/openai/v1/chat/completions'

  const body = {
    model,
    messages:    buildMessages(message, history, context),
    temperature: 0.65,
    max_tokens:  800,
    top_p:       0.9,
  }

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Groq API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from Groq')
  return text.trim()
}

// ── Netlify handler ───────────────────────────────────────────────────────────
exports.handler = async (event) => {
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

    const text = await callGroq(message.trim(), history || [], context || null)
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
