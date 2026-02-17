import { NextRequest, NextResponse } from 'next/server'

const VAPI_BASE = 'https://api.vapi.ai'

export type VoiceOption = {
  provider: string
  voiceId: string
  label: string
  gender: 'male' | 'female' | 'neutral'
  description: string
  recommended?: boolean
}

export type TranscriberOption = {
  provider: string
  language: string
  model?: string
  label: string
  description: string
  recommended?: boolean
}

export type ModelOption = {
  provider: string
  model: string
  label: string
  description: string
  recommended?: boolean
}

export type VapiOptionsResponse = {
  voices: VoiceOption[]
  transcribers: TranscriberOption[]
  models: ModelOption[]
}

// ── Voice catalog per language ─────────────────────────────────────────────

const VOICE_CATALOG: Record<string, VoiceOption[]> = {
  en: [
    { provider: 'openai', voiceId: 'echo',    label: 'Echo',    gender: 'male',    description: 'Deep, confident • Business-ready', recommended: true },
    { provider: 'openai', voiceId: 'nova',    label: 'Nova',    gender: 'female',  description: 'Warm, friendly • Great for support' },
    { provider: 'openai', voiceId: 'shimmer', label: 'Shimmer', gender: 'female',  description: 'Clear, professional' },
    { provider: 'openai', voiceId: 'alloy',   label: 'Alloy',   gender: 'neutral', description: 'Balanced, natural' },
    { provider: 'openai', voiceId: 'fable',   label: 'Fable',   gender: 'male',    description: 'Expressive, engaging' },
    { provider: 'openai', voiceId: 'onyx',    label: 'Onyx',    gender: 'male',    description: 'Deep, authoritative' },
    { provider: 'azure',  voiceId: 'en-US-JennyNeural', label: 'Jenny',  gender: 'female', description: 'Natural US female (Azure)' },
    { provider: 'azure',  voiceId: 'en-US-GuyNeural',   label: 'Guy',    gender: 'male',   description: 'Natural US male (Azure)' },
    { provider: 'azure',  voiceId: 'en-US-AriaNeural',  label: 'Aria',   gender: 'female', description: 'Conversational US female (Azure)' },
    { provider: 'azure',  voiceId: 'en-US-DavisNeural', label: 'Davis',  gender: 'male',   description: 'Deep US male (Azure)' },
  ],
  hi: [
    { provider: 'azure', voiceId: 'hi-IN-SwaraNeural',  label: 'Swara',  gender: 'female', description: 'Natural Hindi female', recommended: true },
    { provider: 'azure', voiceId: 'hi-IN-MadhurNeural', label: 'Madhur', gender: 'male',   description: 'Natural Hindi male' },
  ],
  ta: [
    { provider: 'azure', voiceId: 'ta-IN-PallaviNeural', label: 'Pallavi', gender: 'female', description: 'Natural Tamil female', recommended: true },
    { provider: 'azure', voiceId: 'ta-IN-ValluvarNeural', label: 'Valluvar', gender: 'male', description: 'Natural Tamil male' },
  ],
  te: [
    { provider: 'azure', voiceId: 'te-IN-ShrutiNeural', label: 'Shruti', gender: 'female', description: 'Natural Telugu female', recommended: true },
    { provider: 'azure', voiceId: 'te-IN-MohanNeural',  label: 'Mohan',  gender: 'male',   description: 'Natural Telugu male' },
  ],
  kn: [
    { provider: 'azure', voiceId: 'kn-IN-SapnaNeural',  label: 'Sapna',  gender: 'female', description: 'Natural Kannada female', recommended: true },
    { provider: 'azure', voiceId: 'kn-IN-GaganNeural',  label: 'Gagan',  gender: 'male',   description: 'Natural Kannada male' },
  ],
  ml: [
    { provider: 'azure', voiceId: 'ml-IN-SobhanaNeural', label: 'Sobhana', gender: 'female', description: 'Natural Malayalam female', recommended: true },
    { provider: 'azure', voiceId: 'ml-IN-MidhunNeural',  label: 'Midhun',  gender: 'male',   description: 'Natural Malayalam male' },
  ],
  bn: [
    { provider: 'azure', voiceId: 'bn-IN-TanishaaNeural', label: 'Tanishaa', gender: 'female', description: 'Natural Bengali female', recommended: true },
    { provider: 'azure', voiceId: 'bn-IN-BashkarNeural',  label: 'Bashkar',  gender: 'male',   description: 'Natural Bengali male' },
  ],
  mr: [
    { provider: 'azure', voiceId: 'mr-IN-AarohiNeural',  label: 'Aarohi',  gender: 'female', description: 'Natural Marathi female', recommended: true },
    { provider: 'azure', voiceId: 'mr-IN-ManoharNeural', label: 'Manohar', gender: 'male',   description: 'Natural Marathi male' },
  ],
  gu: [
    { provider: 'azure', voiceId: 'gu-IN-DhwaniNeural',   label: 'Dhwani',   gender: 'female', description: 'Natural Gujarati female', recommended: true },
    { provider: 'azure', voiceId: 'gu-IN-NiranjanNeural', label: 'Niranjan', gender: 'male',   description: 'Natural Gujarati male' },
  ],
  es: [
    { provider: 'azure', voiceId: 'es-ES-ElviraNeural', label: 'Elvira', gender: 'female', description: 'Spain Spanish female', recommended: true },
    { provider: 'azure', voiceId: 'es-MX-DaliaNeural',  label: 'Dalia',  gender: 'female', description: 'Mexican Spanish female' },
    { provider: 'azure', voiceId: 'es-ES-AlvaroNeural', label: 'Álvaro', gender: 'male',   description: 'Spain Spanish male' },
    { provider: 'openai', voiceId: 'nova',              label: 'Nova',   gender: 'female', description: 'OpenAI • Spanish-capable' },
  ],
  fr: [
    { provider: 'azure', voiceId: 'fr-FR-DeniseNeural', label: 'Denise', gender: 'female', description: 'Natural French female', recommended: true },
    { provider: 'azure', voiceId: 'fr-FR-HenriNeural',  label: 'Henri',  gender: 'male',   description: 'Natural French male' },
    { provider: 'openai', voiceId: 'nova',              label: 'Nova',   gender: 'female', description: 'OpenAI • French-capable' },
  ],
  ar: [
    { provider: 'azure', voiceId: 'ar-SA-ZariyahNeural', label: 'Zariyah', gender: 'female', description: 'Saudi Arabic female', recommended: true },
    { provider: 'azure', voiceId: 'ar-SA-HamedNeural',   label: 'Hamed',   gender: 'male',   description: 'Saudi Arabic male' },
    { provider: 'azure', voiceId: 'ar-EG-SalmaNeural',   label: 'Salma',   gender: 'female', description: 'Egyptian Arabic female' },
  ],
}

// ── Transcriber catalog per language ──────────────────────────────────────

const TRANSCRIBER_CATALOG: Record<string, TranscriberOption[]> = {
  en: [
    { provider: 'google',    language: 'English', model: 'gemini-2.0-flash-lite', label: 'Gemini Flash Lite', description: 'Fast & accurate • Free tier', recommended: true },
    { provider: 'google',    language: 'English', model: 'gemini-2.0-flash',      label: 'Gemini Flash',      description: 'Higher accuracy' },
    { provider: 'deepgram',  language: 'en',      model: 'nova-2',                label: 'Deepgram Nova-2',   description: 'Low latency • Industry standard' },
  ],
  hi: [
    { provider: 'deepgram',    language: 'hi',    model: 'nova-2', label: 'Deepgram Nova-2',   description: 'Hindi support', recommended: true },
    { provider: 'talkscriber', language: 'hi',                     label: 'Talkscriber Hindi', description: 'Specialized Hindi ASR' },
  ],
  ta: [
    { provider: 'azure',       language: 'ta-IN', label: 'Azure Tamil',       description: 'Best for Tamil', recommended: true },
    { provider: 'talkscriber', language: 'ta-IN', label: 'Talkscriber Tamil', description: 'Specialized Tamil ASR' },
  ],
  te: [
    { provider: 'azure',       language: 'te-IN', label: 'Azure Telugu',       description: 'Best for Telugu', recommended: true },
    { provider: 'talkscriber', language: 'te-IN', label: 'Talkscriber Telugu', description: 'Specialized Telugu ASR' },
  ],
  kn: [
    { provider: 'azure',       language: 'kn-IN', label: 'Azure Kannada',       description: 'Best for Kannada', recommended: true },
    { provider: 'talkscriber', language: 'kn-IN', label: 'Talkscriber Kannada', description: 'Specialized Kannada ASR' },
  ],
  ml: [
    { provider: 'azure',       language: 'ml-IN', label: 'Azure Malayalam',       description: 'Best for Malayalam', recommended: true },
    { provider: 'talkscriber', language: 'ml-IN', label: 'Talkscriber Malayalam', description: 'Specialized Malayalam ASR' },
  ],
  bn: [
    { provider: 'azure',       language: 'bn-IN', label: 'Azure Bengali',       description: 'Best for Bengali', recommended: true },
    { provider: 'talkscriber', language: 'bn-IN', label: 'Talkscriber Bengali', description: 'Specialized Bengali ASR' },
  ],
  mr: [
    { provider: 'azure',       language: 'mr-IN', label: 'Azure Marathi',       description: 'Best for Marathi', recommended: true },
    { provider: 'talkscriber', language: 'mr-IN', label: 'Talkscriber Marathi', description: 'Specialized Marathi ASR' },
  ],
  gu: [
    { provider: 'azure',       language: 'gu-IN', label: 'Azure Gujarati',       description: 'Best for Gujarati', recommended: true },
    { provider: 'talkscriber', language: 'gu-IN', label: 'Talkscriber Gujarati', description: 'Specialized Gujarati ASR' },
  ],
  es: [
    { provider: 'deepgram',    language: 'es', model: 'nova-2', label: 'Deepgram Nova-2', description: 'Spanish support', recommended: true },
    { provider: 'talkscriber', language: 'es',                  label: 'Talkscriber ES',  description: 'Spanish ASR' },
  ],
  fr: [
    { provider: 'deepgram',    language: 'fr', model: 'nova-2', label: 'Deepgram Nova-2', description: 'French support', recommended: true },
    { provider: 'talkscriber', language: 'fr',                  label: 'Talkscriber FR',  description: 'French ASR' },
  ],
  ar: [
    { provider: 'azure',       language: 'ar-SA', label: 'Azure Arabic',       description: 'Best for Arabic', recommended: true },
    { provider: 'talkscriber', language: 'ar',    label: 'Talkscriber Arabic', description: 'Arabic ASR' },
  ],
}

// ── LLM model catalog (global, not language-specific) ─────────────────────

const MODEL_CATALOG: ModelOption[] = [
  { provider: 'google', model: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', description: 'Fastest • Free • Great for most agents', recommended: true },
  { provider: 'google', model: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash',      description: 'Balanced speed & quality' },
  { provider: 'google', model: 'gemini-1.5-flash',      label: 'Gemini 1.5 Flash',      description: 'Stable & reliable' },
  { provider: 'openai', model: 'gpt-4o-mini',           label: 'GPT-4o Mini',           description: 'OpenAI • Fast & capable' },
  { provider: 'openai', model: 'gpt-4o',                label: 'GPT-4o',                description: 'OpenAI • Best reasoning quality' },
]

// ── GET /api/vapi/options?language=en ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const vapiKey = process.env.VAPI_PRIVATE_KEY
  if (!vapiKey) {
    return NextResponse.json({ error: 'VAPI_PRIVATE_KEY not configured' }, { status: 401 })
  }

  // Verify key is valid by making a lightweight call to Vapi
  const check = await fetch(`${VAPI_BASE}/assistant?limit=1`, {
    headers: { Authorization: `Bearer ${vapiKey}` },
  }).catch(() => null)

  if (!check || !check.ok) {
    return NextResponse.json({ error: 'Vapi API key is invalid or unreachable' }, { status: 401 })
  }

  const language = req.nextUrl.searchParams.get('language') || 'en'
  const voices      = VOICE_CATALOG[language]      ?? VOICE_CATALOG['en']
  const transcribers = TRANSCRIBER_CATALOG[language] ?? TRANSCRIBER_CATALOG['en']

  return NextResponse.json({
    voices,
    transcribers,
    models: MODEL_CATALOG,
  } satisfies VapiOptionsResponse)
}
