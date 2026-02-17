import { NextRequest, NextResponse } from 'next/server'

const VAPI_BASE = 'https://api.vapi.ai'
const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// GET /api/calls/[id]/recording
// Fetches recording URL from Vapi using the provider_call_id, saves to DB, returns it
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const vapiKey = process.env.VAPI_PRIVATE_KEY

  if (!vapiKey) {
    return NextResponse.json({ error: 'VAPI_PRIVATE_KEY not configured' }, { status: 500 })
  }

  // 1. Get the call record from our backend to find provider_call_id
  const callRes = await fetch(`${BACKEND_BASE}/api/calls/${id}`)
  if (!callRes.ok) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 })
  }
  const call = await callRes.json()

  const providerCallId = call.provider_call_id
  if (!providerCallId) {
    return NextResponse.json({ error: 'No Vapi call ID on this record' }, { status: 400 })
  }

  // Already have it — return immediately
  if (call.recording_url) {
    return NextResponse.json({ recording_url: call.recording_url })
  }

  // 2. Fetch from Vapi API
  const vapiRes = await fetch(`${VAPI_BASE}/call/${providerCallId}`, {
    headers: { Authorization: `Bearer ${vapiKey}` },
  })

  if (!vapiRes.ok) {
    const err = await vapiRes.text()
    return NextResponse.json({ error: `Vapi error: ${err}` }, { status: vapiRes.status })
  }

  const vapiCall = await vapiRes.json()
  const recordingUrl: string | undefined = vapiCall.recordingUrl || vapiCall.artifact?.recordingUrl

  if (!recordingUrl) {
    return NextResponse.json({ recording_url: null, message: 'Recording not ready yet' })
  }

  // 3. Save recording URL back to our DB
  await fetch(`${BACKEND_BASE}/api/calls/${id}/recording`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recording_url: recordingUrl }),
  })

  return NextResponse.json({ recording_url: recordingUrl })
}
