import { NextRequest, NextResponse } from 'next/server'

const BACKEND_BASE  = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const GEMINI_KEY    = process.env.GEMINI_API_KEY || ''
// gemini-2.0-flash-lite — cheapest model, ~$0.00001/1K tokens (effectively free for this use)
const GEMINI_MODEL  = 'gemini-2.0-flash-lite'
const GEMINI_URL    = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

// POST /api/calls/[id]/analyze
// Fetches the call transcript from DB, asks Gemini to score + summarise it,
// then saves the result back via the backend PATCH /analysis endpoint.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!GEMINI_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  // 1. Fetch call record
  const callRes = await fetch(`${BACKEND_BASE}/api/calls/${id}`)
  if (!callRes.ok) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 })
  }
  const call = await callRes.json()

  const transcript: Array<{ role: string; content?: string; data?: string }> =
    call.transcript || []
  const purpose: string = call.purpose || 'General inquiry'

  // Need at least a few real messages to score
  const messages = transcript.filter(m => m.role === 'user' || m.role === 'assistant')
  if (messages.length < 2) {
    return NextResponse.json({ skipped: true, reason: 'Not enough transcript to analyse' })
  }

  // 2. Build conversation text for Gemini
  const conversation = messages
    .map(m => `${m.role === 'assistant' ? 'AI' : 'USER'}: ${m.content || m.data || ''}`)
    .join('\n')

  const prompt = `You are a call quality analyser. Analyse this AI voice call transcript and respond with ONLY a valid JSON object — no markdown, no code blocks, no extra text.

Call Purpose: ${purpose}

Transcript:
${conversation}

Respond with exactly this JSON:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence summary of what was discussed and the outcome>",
  "qualification": "<exactly one of: qualified, partial, unqualified>"
}

Scoring:
- 80-100: Purpose fully achieved, lead engaged and interested
- 60-79: Good conversation, some interest shown
- 40-59: Partial engagement, purpose not fully met
- 20-39: Minimal engagement
- 0-19: No real conversation or call failed`

  // 3. Call Gemini
  const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    }),
  })

  if (!geminiRes.ok) {
    const err = await geminiRes.text()
    return NextResponse.json({ error: `Gemini error: ${err}` }, { status: 502 })
  }

  const geminiData = await geminiRes.json()
  let rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // Strip markdown code fences if Gemini wraps the JSON anyway
  rawText = rawText.trim()
  if (rawText.startsWith('```')) {
    rawText = rawText.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim()
  }

  let parsed: { score: number; summary: string; qualification: string }
  try {
    parsed = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ error: 'Gemini returned unparseable JSON', raw: rawText }, { status: 502 })
  }

  const score         = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0)))
  const summary       = String(parsed.summary || '').trim()
  const qualification = ['qualified', 'partial', 'unqualified'].includes(parsed.qualification)
    ? parsed.qualification
    : score >= 70 ? 'qualified' : score >= 40 ? 'partial' : 'unqualified'

  // 4. Save back to DB
  const saveRes = await fetch(`${BACKEND_BASE}/api/calls/${id}/analysis`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary, ai_score: score, qualification }),
  })
  if (!saveRes.ok) {
    return NextResponse.json({ error: `Failed to save analysis: ${await saveRes.text()}` }, { status: 500 })
  }

  return NextResponse.json({ score, summary, qualification })
}
