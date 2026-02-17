import { NextRequest, NextResponse } from 'next/server'

const VAPI_BASE = 'https://api.vapi.ai'
const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// GET /api/agents/[id]/sync
// Fetches the current Vapi assistant state and syncs it back to the local DB.
// This is how changes made directly in the Vapi dashboard (prompt, tools, etc.)
// become visible in the app.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const vapiKey = process.env.VAPI_PRIVATE_KEY
  if (!vapiKey) {
    return NextResponse.json({ error: 'VAPI_PRIVATE_KEY not configured' }, { status: 500 })
  }

  // 1 ── Look up our local record to get the Vapi assistant ID
  const localRes = await fetch(`${BACKEND_BASE}/api/agents/${id}/info`).catch(() => null)
  if (!localRes || !localRes.ok) {
    return NextResponse.json({ error: 'Agent not found in local database' }, { status: 404 })
  }
  const localAgent = await localRes.json()
  const vapiAssistantId: string = localAgent.vapi_assistant_id
  if (!vapiAssistantId) {
    return NextResponse.json({ error: 'Agent has no Vapi assistant ID' }, { status: 400 })
  }

  // 2 ── Fetch live assistant from Vapi
  const vapiRes = await fetch(`${VAPI_BASE}/assistant/${vapiAssistantId}`, {
    headers: { Authorization: `Bearer ${vapiKey}` },
  }).catch(() => null)

  if (!vapiRes || !vapiRes.ok) {
    const errText = vapiRes ? await vapiRes.text() : 'Network error'
    return NextResponse.json({ error: `Vapi error: ${errText}` }, { status: 502 })
  }
  const assistant = await vapiRes.json()

  // 3 ── Extract fields that can be stored locally
  //     (name, first_message, system_prompt — all potentially edited in the Vapi dashboard)
  const updates: Record<string, string | undefined> = {}

  if (assistant.name)            updates.name          = assistant.name
  if (assistant.firstMessage)    updates.first_message = assistant.firstMessage

  // System prompt lives as the first system-role message in model.messages
  const sysMsg = assistant.model?.messages?.find((m: any) => m.role === 'system')
  if (sysMsg?.content) updates.system_prompt = sysMsg.content

  if (Object.keys(updates).length === 0) {
    // Nothing to update — just return current local record
    return NextResponse.json(localAgent)
  }

  // 4 ── Patch the local DB record
  const patchRes = await fetch(`${BACKEND_BASE}/api/agents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  }).catch(() => null)

  if (!patchRes || !patchRes.ok) {
    const errText = patchRes ? await patchRes.text() : 'Network error'
    return NextResponse.json({ error: `DB update failed: ${errText}` }, { status: 500 })
  }

  const updated = await patchRes.json()

  // 5 ── Return updated agent + a summary of what changed
  const changed = Object.keys(updates)
  return NextResponse.json({ agent: updated, synced: changed })
}
