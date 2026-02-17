import { NextResponse } from 'next/server'

const VAPI_BASE = 'https://api.vapi.ai'
const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// GET /api/agents/sync
// Fetches all Vapi assistants, compares with DB, returns ones not yet imported
export async function GET() {
  const vapiKey = process.env.VAPI_PRIVATE_KEY
  if (!vapiKey) {
    return NextResponse.json({ error: 'VAPI_PRIVATE_KEY not configured' }, { status: 500 })
  }

  // Fetch from Vapi
  const vapiRes = await fetch(`${VAPI_BASE}/assistant?limit=100`, {
    headers: { Authorization: `Bearer ${vapiKey}` },
  })
  if (!vapiRes.ok) {
    return NextResponse.json({ error: `Vapi error: ${await vapiRes.text()}` }, { status: 502 })
  }
  const vapiAssistants: any[] = await vapiRes.json()

  // Fetch already-imported IDs from our DB
  const dbRes = await fetch(`${BACKEND_BASE}/api/agents/`)
  const dbAgents: any[] = dbRes.ok ? await dbRes.json() : []
  const importedIds = new Set(dbAgents.map((a: any) => a.vapi_assistant_id))

  // Return Vapi assistants not yet in DB
  const unimported = vapiAssistants.filter((a: any) => !importedIds.has(a.id))
  return NextResponse.json(unimported)
}
