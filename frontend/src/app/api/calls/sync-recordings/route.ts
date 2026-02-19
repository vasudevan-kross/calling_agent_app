import { NextResponse } from 'next/server'

const VAPI_BASE   = 'https://api.vapi.ai'
const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// POST /api/calls/sync-recordings
// Fetches the 100 most recent calls from Vapi, then updates any of our local call
// records that are missing a recording_url or provider_call_id.
export async function POST() {
  const vapiKey = process.env.VAPI_PRIVATE_KEY
  if (!vapiKey) {
    return NextResponse.json({ error: 'VAPI_PRIVATE_KEY not configured' }, { status: 500 })
  }

  // 1. Fetch our local calls that are missing a recording URL
  const localRes = await fetch(`${BACKEND_BASE}/api/calls?limit=100`)
  if (!localRes.ok) {
    return NextResponse.json({ error: 'Could not fetch local calls' }, { status: 500 })
  }
  const localCalls: Array<{
    id: string
    provider_call_id?: string
    recording_url?: string
    start_time?: string
  }> = await localRes.json()

  const missing = localCalls.filter(c => !c.recording_url)
  if (missing.length === 0) {
    return NextResponse.json({ updated: 0, message: 'All calls already have recordings' })
  }

  // 2. Fetch recent calls from Vapi
  const vapiRes = await fetch(`${VAPI_BASE}/call?limit=100`, {
    headers: { Authorization: `Bearer ${vapiKey}` },
  })
  if (!vapiRes.ok) {
    return NextResponse.json({ error: `Vapi error: ${await vapiRes.text()}` }, { status: 502 })
  }
  const vapiCalls: Array<{
    id: string
    recordingUrl?: string
    artifact?: { recordingUrl?: string }
    createdAt?: string
  }> = await vapiRes.json()

  // Build a lookup map: vapiCallId → recordingUrl
  const vapiMap = new Map<string, string>()
  for (const vc of vapiCalls) {
    const url = vc.recordingUrl || vc.artifact?.recordingUrl
    if (vc.id && url) vapiMap.set(vc.id, url)
  }

  // 3. For each local call missing recording, try to match by provider_call_id
  let updated = 0
  const updates: Array<Promise<void>> = []

  for (const call of missing) {
    const provId = call.provider_call_id
    if (!provId) continue

    const recordingUrl = vapiMap.get(provId)
    if (!recordingUrl) continue

    updates.push(
      fetch(`${BACKEND_BASE}/api/calls/${call.id}/recording`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recording_url: recordingUrl }),
      }).then(() => { updated++ }).catch(() => {})
    )
  }

  await Promise.all(updates)

  return NextResponse.json({ updated, checked: missing.length })
}
