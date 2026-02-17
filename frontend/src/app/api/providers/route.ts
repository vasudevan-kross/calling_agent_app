import { NextResponse } from 'next/server'

const VAPI_BASE = 'https://api.vapi.ai'

// Free Vapi providers — included in Vapi base pricing, no extra API key required.
// Keyed by language code.
const FREE_PROVIDERS = {
  voice: {
    en: [
      { provider: 'openai', voiceId: 'nova',                label: 'OpenAI Nova' },
      { provider: 'azure',  voiceId: 'en-US-JennyNeural',   label: 'Azure Jenny' },
      { provider: 'lmnt',   voiceId: 'lily',                label: 'LMNT Lily' },
    ],
    hi: [
      { provider: 'azure', voiceId: 'hi-IN-SwaraNeural',    label: 'Azure Swara (hi)' },
      { provider: 'azure', voiceId: 'hi-IN-MadhurNeural',   label: 'Azure Madhur (hi)' },
    ],
    ta: [
      { provider: 'azure', voiceId: 'ta-IN-PallaviNeural',  label: 'Azure Pallavi (ta)' },
      { provider: 'azure', voiceId: 'ta-IN-ValluvarNeural', label: 'Azure Valluvar (ta)' },
    ],
    te: [
      { provider: 'azure', voiceId: 'te-IN-ShrutiNeural',   label: 'Azure Shruti (te)' },
      { provider: 'azure', voiceId: 'te-IN-MohanNeural',    label: 'Azure Mohan (te)' },
    ],
    kn: [
      { provider: 'azure', voiceId: 'kn-IN-SapnaNeural',    label: 'Azure Sapna (kn)' },
      { provider: 'azure', voiceId: 'kn-IN-GaganNeural',    label: 'Azure Gagan (kn)' },
    ],
    ml: [
      { provider: 'azure', voiceId: 'ml-IN-SobhanaNeural',  label: 'Azure Sobhana (ml)' },
      { provider: 'azure', voiceId: 'ml-IN-MidhunNeural',   label: 'Azure Midhun (ml)' },
    ],
    bn: [
      { provider: 'azure', voiceId: 'bn-IN-TanishaaNeural', label: 'Azure Tanishaa (bn)' },
      { provider: 'azure', voiceId: 'bn-IN-BashkarNeural',  label: 'Azure Bashkar (bn)' },
    ],
    mr: [
      { provider: 'azure', voiceId: 'mr-IN-AarohiNeural',   label: 'Azure Aarohi (mr)' },
      { provider: 'azure', voiceId: 'mr-IN-ManoharNeural',  label: 'Azure Manohar (mr)' },
    ],
    gu: [
      { provider: 'azure', voiceId: 'gu-IN-DhwaniNeural',   label: 'Azure Dhwani (gu)' },
      { provider: 'azure', voiceId: 'gu-IN-NiranjanNeural', label: 'Azure Niranjan (gu)' },
    ],
    es: [
      { provider: 'azure',  voiceId: 'es-ES-ElviraNeural',  label: 'Azure Elvira (es)' },
      { provider: 'openai', voiceId: 'nova',                label: 'OpenAI Nova' },
    ],
    fr: [
      { provider: 'azure',  voiceId: 'fr-FR-DeniseNeural',  label: 'Azure Denise (fr)' },
      { provider: 'openai', voiceId: 'nova',                label: 'OpenAI Nova' },
    ],
    ar: [
      { provider: 'azure', voiceId: 'ar-SA-ZariyahNeural',  label: 'Azure Zariyah (ar)' },
      { provider: 'azure', voiceId: 'ar-SA-HamedNeural',    label: 'Azure Hamed (ar)' },
    ],
  },
  transcriber: {
    en: [
      { provider: 'deepgram',    model: 'nova-2', language: 'en',    label: 'Deepgram Nova-2' },
      { provider: 'talkscriber',                  language: 'en',    label: 'Talkscriber' },
    ],
    hi: [
      { provider: 'deepgram',    model: 'nova-2', language: 'hi',    label: 'Deepgram Nova-2 (hi)' },
      { provider: 'talkscriber',                  language: 'hi',    label: 'Talkscriber' },
    ],
    ta: [
      { provider: 'azure',       language: 'ta-IN', label: 'Azure ta-IN' },
      { provider: 'talkscriber', language: 'ta-IN', label: 'Talkscriber' },
    ],
    te: [
      { provider: 'azure',       language: 'te-IN', label: 'Azure te-IN' },
      { provider: 'talkscriber', language: 'te-IN', label: 'Talkscriber' },
    ],
    kn: [
      { provider: 'azure',       language: 'kn-IN', label: 'Azure kn-IN' },
      { provider: 'talkscriber', language: 'kn-IN', label: 'Talkscriber' },
    ],
    ml: [
      { provider: 'azure',       language: 'ml-IN', label: 'Azure ml-IN' },
      { provider: 'talkscriber', language: 'ml-IN', label: 'Talkscriber' },
    ],
    bn: [
      { provider: 'azure',       language: 'bn-IN', label: 'Azure bn-IN' },
      { provider: 'talkscriber', language: 'bn-IN', label: 'Talkscriber' },
    ],
    mr: [
      { provider: 'azure',       language: 'mr-IN', label: 'Azure mr-IN' },
      { provider: 'talkscriber', language: 'mr-IN', label: 'Talkscriber' },
    ],
    gu: [
      { provider: 'azure',       language: 'gu-IN', label: 'Azure gu-IN' },
      { provider: 'talkscriber', language: 'gu-IN', label: 'Talkscriber' },
    ],
    es: [
      { provider: 'deepgram',    model: 'nova-2', language: 'es',    label: 'Deepgram Nova-2 (es)' },
      { provider: 'talkscriber',                  language: 'es',    label: 'Talkscriber' },
    ],
    fr: [
      { provider: 'deepgram',    model: 'nova-2', language: 'fr',    label: 'Deepgram Nova-2 (fr)' },
      { provider: 'talkscriber',                  language: 'fr',    label: 'Talkscriber' },
    ],
    ar: [
      { provider: 'azure',       language: 'ar-SA', label: 'Azure ar-SA' },
      { provider: 'talkscriber', language: 'ar',    label: 'Talkscriber' },
    ],
  },
}

export async function GET() {
  const vapiKey = process.env.VAPI_PRIVATE_KEY
  if (!vapiKey) {
    return NextResponse.json({ error: 'VAPI_PRIVATE_KEY not configured' }, { status: 401 })
  }

  // Verify key is valid by pinging Vapi
  const ping = await fetch(`${VAPI_BASE}/assistant?limit=1`, {
    headers: { Authorization: `Bearer ${vapiKey}` },
  })

  if (!ping.ok) {
    return NextResponse.json(
      { error: `Vapi key invalid or unreachable (${ping.status})` },
      { status: ping.status }
    )
  }

  return NextResponse.json(FREE_PROVIDERS)
}
