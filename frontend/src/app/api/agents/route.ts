import { NextRequest, NextResponse } from 'next/server'

const VAPI_BASE = 'https://api.vapi.ai'
const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function vapiHeaders() {
  return {
    'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY || ''}`,
    'Content-Type': 'application/json',
  }
}

// ── Voice & Transcriber maps ────────────────────────────────────────────────

type VoiceEntry      = { provider: string; voiceId: string; model?: string }
type TranscriberEntry = { provider: string; language: string; model?: string }

const VOICE_MAP: Record<string, { primary: VoiceEntry; fallbacks: VoiceEntry[] }> = {
  en: { primary: { provider: 'openai', voiceId: 'echo' }, fallbacks: [{ provider: 'azure', voiceId: 'en-US-JennyNeural' }, { provider: 'lmnt', voiceId: 'lily' }] },
  hi: { primary: { provider: 'azure', voiceId: 'hi-IN-SwaraNeural' },     fallbacks: [{ provider: 'azure', voiceId: 'hi-IN-MadhurNeural' }] },
  ta: { primary: { provider: 'azure', voiceId: 'ta-IN-PallaviNeural' },   fallbacks: [{ provider: 'azure', voiceId: 'ta-IN-ValluvarNeural' }] },
  te: { primary: { provider: 'azure', voiceId: 'te-IN-ShrutiNeural' },    fallbacks: [{ provider: 'azure', voiceId: 'te-IN-MohanNeural' }] },
  kn: { primary: { provider: 'azure', voiceId: 'kn-IN-SapnaNeural' },     fallbacks: [{ provider: 'azure', voiceId: 'kn-IN-GaganNeural' }] },
  ml: { primary: { provider: 'azure', voiceId: 'ml-IN-SobhanaNeural' },   fallbacks: [{ provider: 'azure', voiceId: 'ml-IN-MidhunNeural' }] },
  bn: { primary: { provider: 'azure', voiceId: 'bn-IN-TanishaaNeural' },  fallbacks: [{ provider: 'azure', voiceId: 'bn-IN-BashkarNeural' }] },
  mr: { primary: { provider: 'azure', voiceId: 'mr-IN-AarohiNeural' },    fallbacks: [{ provider: 'azure', voiceId: 'mr-IN-ManoharNeural' }] },
  gu: { primary: { provider: 'azure', voiceId: 'gu-IN-DhwaniNeural' },    fallbacks: [{ provider: 'azure', voiceId: 'gu-IN-NiranjanNeural' }] },
  es: { primary: { provider: 'azure', voiceId: 'es-ES-ElviraNeural' },    fallbacks: [{ provider: 'openai', voiceId: 'nova' }] },
  fr: { primary: { provider: 'azure', voiceId: 'fr-FR-DeniseNeural' },    fallbacks: [{ provider: 'openai', voiceId: 'nova' }] },
  ar: { primary: { provider: 'azure', voiceId: 'ar-SA-ZariyahNeural' },   fallbacks: [{ provider: 'azure', voiceId: 'ar-SA-HamedNeural' }] },
}

const TRANSCRIBER_MAP: Record<string, { primary: TranscriberEntry; fallbacks: TranscriberEntry[] }> = {
  en: { primary: { provider: 'google',      language: 'English', model: 'gemini-2.0-flash-lite' }, fallbacks: [{ provider: 'deepgram', language: 'en', model: 'nova-2' }] },
  hi: { primary: { provider: 'deepgram',    language: 'hi',    model: 'nova-2' }, fallbacks: [{ provider: 'talkscriber', language: 'hi' }] },
  ta: { primary: { provider: 'azure',       language: 'ta-IN'                  }, fallbacks: [{ provider: 'talkscriber', language: 'ta-IN' }] },
  te: { primary: { provider: 'azure',       language: 'te-IN'                  }, fallbacks: [{ provider: 'talkscriber', language: 'te-IN' }] },
  kn: { primary: { provider: 'azure',       language: 'kn-IN'                  }, fallbacks: [{ provider: 'talkscriber', language: 'kn-IN' }] },
  ml: { primary: { provider: 'azure',       language: 'ml-IN'                  }, fallbacks: [{ provider: 'talkscriber', language: 'ml-IN' }] },
  bn: { primary: { provider: 'azure',       language: 'bn-IN'                  }, fallbacks: [{ provider: 'talkscriber', language: 'bn-IN' }] },
  mr: { primary: { provider: 'azure',       language: 'mr-IN'                  }, fallbacks: [{ provider: 'talkscriber', language: 'mr-IN' }] },
  gu: { primary: { provider: 'azure',       language: 'gu-IN'                  }, fallbacks: [{ provider: 'talkscriber', language: 'gu-IN' }] },
  es: { primary: { provider: 'deepgram',    language: 'es',    model: 'nova-2' }, fallbacks: [{ provider: 'talkscriber', language: 'es' }] },
  fr: { primary: { provider: 'deepgram',    language: 'fr',    model: 'nova-2' }, fallbacks: [{ provider: 'talkscriber', language: 'fr' }] },
  ar: { primary: { provider: 'azure',       language: 'ar-SA'                  }, fallbacks: [{ provider: 'talkscriber', language: 'ar' }] },
}

// ── POST /api/agents ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, category, language, system_prompt, first_message, voice, transcriber, llm } = body

  const vapiKey = process.env.VAPI_PRIVATE_KEY
  if (!vapiKey) {
    return NextResponse.json({ error: 'VAPI_PRIVATE_KEY not configured' }, { status: 500 })
  }

  // User-selected voice: use as primary, keep language fallbacks
  const voiceCfg = (() => {
    const langCfg = (VOICE_MAP[language] ?? VOICE_MAP['en'])!
    const primary = voice ?? langCfg.primary
    return {
      provider: primary.provider,
      voiceId: primary.voiceId,
      fallbackPlan: {
        voices: langCfg.fallbacks.filter(f => f.voiceId !== primary.voiceId),
      },
    }
  })()

  // User-selected transcriber: use as primary, keep language fallbacks
  const transcriberCfg = (() => {
    const langCfg = (TRANSCRIBER_MAP[language] ?? TRANSCRIBER_MAP['en'])!
    const primary = transcriber ?? langCfg.primary
    return {
      provider: primary.provider,
      language: primary.language,
      ...(primary.model ? { model: primary.model } : {}),
      fallbackPlan: {
        transcribers: langCfg.fallbacks.filter(f => f.language !== primary.language),
      },
    }
  })()

  // User-selected LLM model
  const llmProvider = llm?.provider ?? 'google'
  const llmModel    = llm?.model    ?? 'gemini-2.0-flash-lite'

  const vapiPayload = {
    name,
    firstMessage: first_message,
    transcriber: transcriberCfg,
    model: {
      provider: llmProvider,
      model: llmModel,
      messages: [{ role: 'system', content: system_prompt }],
    },
    voice: voiceCfg,
  }

  const vapiRes = await fetch(`${VAPI_BASE}/assistant`, {
    method: 'POST',
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

  const vapiData = await vapiRes.json()

  const backendRes = await fetch(`${BACKEND_BASE}/api/agents/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vapi_assistant_id: vapiData.id,
      name,
      description,
      category,
      language,
      system_prompt,
      first_message,
    }),
  })

  if (!backendRes.ok) {
    const errText = await backendRes.text()
    return NextResponse.json({ error: `DB save failed: ${errText}` }, { status: 500 })
  }

  const saved = await backendRes.json()
  return NextResponse.json(saved, { status: 201 })
}
