import { NextRequest, NextResponse } from 'next/server'

const VAPI_BASE = 'https://api.vapi.ai'
const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function vapiHeaders() {
  return {
    'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY || ''}`,
    'Content-Type': 'application/json',
  }
}

// ── PATCH /api/agents/[id] ────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { name, description, category, language, system_prompt, first_message, vapi_assistant_id } = body

  // Only push name and firstMessage to Vapi — never overwrite voice/transcriber/model
  // that the user may have configured directly in the Vapi dashboard.
  const vapiPayload: Record<string, unknown> = {}
  if (name)          vapiPayload.name         = name
  if (first_message) vapiPayload.firstMessage = first_message

  // For system_prompt: fetch the live Vapi assistant first so we can preserve
  // its existing model provider, model type, tools, toolIds, etc.
  // We only replace the messages array.
  if (system_prompt && vapi_assistant_id) {
    const liveRes = await fetch(`${VAPI_BASE}/assistant/${vapi_assistant_id}`, {
      headers: vapiHeaders(),
    })
    if (liveRes.ok) {
      const live = await liveRes.json()
      // Deep-clone the existing model config and only swap out messages
      const existingModel = live.model ?? {}
      vapiPayload.model = {
        ...existingModel,
        messages: [{ role: 'system', content: system_prompt }],
      }
    } else {
      // Fallback: if we can't fetch the live assistant just update messages
      vapiPayload.model = {
        messages: [{ role: 'system', content: system_prompt }],
      }
    }
  }

  if (Object.keys(vapiPayload).length > 0 && vapi_assistant_id) {
    const vapiRes = await fetch(`${VAPI_BASE}/assistant/${vapi_assistant_id}`, {
      method: 'PATCH',
      headers: vapiHeaders(),
      body: JSON.stringify(vapiPayload),
    })
    if (!vapiRes.ok) {
      const errText = await vapiRes.text()
      return NextResponse.json(
        { error: `Vapi error (${vapiRes.status}): ${errText}` },
        { status: vapiRes.status }
      )
    }
  }

  const dbRes = await fetch(`${BACKEND_BASE}/api/agents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, category, language, system_prompt, first_message }),
  })
  if (!dbRes.ok) {
    return NextResponse.json({ error: `DB update failed: ${await dbRes.text()}` }, { status: 500 })
  }
  return NextResponse.json(await dbRes.json())
}

// ── DELETE /api/agents/[id] ───────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const infoRes = await fetch(`${BACKEND_BASE}/api/agents/${id}/info`)
  if (!infoRes.ok) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  const info = await infoRes.json()
  const vapiAssistantId = info.vapi_assistant_id

  if (vapiAssistantId) {
    await fetch(`${VAPI_BASE}/assistant/${vapiAssistantId}`, {
      method: 'DELETE',
      headers: vapiHeaders(),
    }).catch(() => null)
  }

  const delRes = await fetch(`${BACKEND_BASE}/api/agents/${id}`, { method: 'DELETE' })
  if (!delRes.ok) {
    return NextResponse.json({ error: 'Failed to delete from database' }, { status: 500 })
  }
  return NextResponse.json({ message: 'Agent deleted' })
}
