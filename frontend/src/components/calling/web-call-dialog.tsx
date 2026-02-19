'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Mic, MicOff, PhoneOff, Loader2, Globe, Bot, CheckCircle, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { callsApi } from '@/lib/api/calls'
import { agentsApi } from '@/lib/api/agents'
import {
  CallCategory,
  CATEGORY_LIST,
  CALL_CATEGORIES,
  detectIntent,
  buildPrompt,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LIST
} from '@/lib/call-utils'
import type { Lead } from '@/types/lead'
import type { Agent } from '@/types/agent'

interface WebCallDialogProps {
  lead: Lead
  onClose: () => void
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'ended' | 'error'
type Mode = 'agent' | 'custom'

const CATEGORY_LABELS: Record<string, string> = {
  inquiry: '❓', booking: '📅', order_status: '📦',
  support: '🛠', follow_up: '🔄', sales: '💰', general: '💬'
}

export function WebCallDialog({ lead, onClose }: WebCallDialogProps) {
  const [mode, setMode] = useState<Mode>('agent')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  // Custom mode state
  const [selectedCategory, setSelectedCategory] = useState<CallCategory | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en')
  const [details, setDetails] = useState('')
  const [detectedCategory, setDetectedCategory] = useState<CallCategory | null>(null)

  // Call state
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string }>>([])
  const [error, setError] = useState<string | null>(null)

  // Live speaking indicators — updated by speech-start / speech-end / volume-level events
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)

  const vapiRef = useRef<any>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const callStartTimeRef = useRef<string | null>(null)
  const vapiCallIdRef = useRef<string | null>(null)
  const purposeRef = useRef<string>('')
  const hasLoggedRef = useRef(false)
  const recordingUrlRef = useRef<string | null>(null)
  // Mirrors transcript state so call-end handler can read latest without stale closure
  const transcriptRef = useRef<Array<{ role: string; content: string }>>([])
  const selectedAgentRef = useRef<Agent | null>(null)

  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.list(),
  })

  // Use 'auto' (instant) scroll — 'smooth' adds ~300 ms lag on every transcript update
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [transcript])

  useEffect(() => {
    return () => { if (vapiRef.current) vapiRef.current.stop() }
  }, [])

  useEffect(() => {
    if (details.trim() && !selectedCategory) {
      const result = detectIntent(details)
      setDetectedCategory(result.confidence !== 'low' ? result.category : null)
    } else {
      setDetectedCategory(null)
    }
  }, [details, selectedCategory])

  const getActiveCategory = (): CallCategory => selectedCategory || detectedCategory || 'general'
  const isReadyToCall = mode === 'agent' ? !!selectedAgent : !!details.trim()

  useEffect(() => { selectedAgentRef.current = selectedAgent }, [selectedAgent])

  const attachVapiEvents = (vapi: any, purposeLabel: string) => {
    purposeRef.current = purposeLabel
    hasLoggedRef.current = false
    transcriptRef.current = []
    setIsSpeaking(false)
    setIsAgentSpeaking(false)
    setVolumeLevel(0)

    vapi.on('call-start', (callData: any) => {
      callStartTimeRef.current = new Date().toISOString()
      // Try every known location the Web SDK may place the call ID
      vapiCallIdRef.current =
        callData?.id ||
        callData?.call?.id ||
        callData?.callId ||
        null
      setCallStatus('connected')
      setTranscript([{ role: 'system', content: 'Call connected.' }])
    })

    vapi.on('call-end', (callData: any) => {
      if (hasLoggedRef.current) return
      hasLoggedRef.current = true

      // Clear speaking state immediately on hangup
      setIsSpeaking(false)
      setIsAgentSpeaking(false)
      setVolumeLevel(0)

      const endTime = new Date().toISOString()
      const startTime = callStartTimeRef.current
      const durationSeconds = startTime
        ? Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
        : undefined

      const recordingUrl = callData?.recordingUrl || callData?.call?.recordingUrl || recordingUrlRef.current || undefined

      const conversationMessages = transcriptRef.current
      callsApi.logWebCall({
        lead_id: lead.id,
        purpose: purposeRef.current,
        language: mode === 'agent' ? (selectedAgentRef.current?.language || 'en') : selectedLanguage,
        transcript: conversationMessages.map(m => ({ role: m.role, content: m.content, timestamp: new Date().toISOString() })),
        provider_call_id: vapiCallIdRef.current || undefined,
        recording_url: recordingUrl,
        start_time: startTime || undefined,
        end_time: endTime,
        duration_seconds: durationSeconds,
        status: 'completed'
      }).then((res: any) => {
        // Fire Gemini analysis in the background — doesn't block the UI
        const callId = res?.id
        if (callId) {
          fetch(`/api/calls/${callId}/analyze`, { method: 'POST' })
            .catch(err => console.warn('AI analysis skipped:', err))
        }
      }).catch(err => console.error('Failed to log call:', err))

      setCallStatus('ended')
      setTranscript(prev => [...prev, { role: 'system', content: 'Call ended.' }])
    })

    vapi.on('message', (message: any) => {
      // Final transcript entries
      if (message?.type === 'transcript' && message.transcriptType === 'final' && message.transcript) {
        const entry = { role: message.role || 'unknown', content: message.transcript }
        transcriptRef.current = [...transcriptRef.current, entry]
        setTranscript(prev => [...prev, entry])
      }
      // Track agent speaking from message events (redundant with speech-start/end but more reliable)
      if (message?.type === 'speech-update') {
        if (message.role === 'assistant') setIsAgentSpeaking(message.status === 'started')
        if (message.role === 'user') setIsSpeaking(message.status === 'started')
      }
      // Capture call ID from message events — more reliable than call-start payload
      const msgCallId = message?.call?.id || message?.callId
      if (msgCallId && !vapiCallIdRef.current) {
        vapiCallIdRef.current = msgCallId
      }
      // Recording URL delivered via message
      if (message?.type === 'call-update' && message?.call?.recordingUrl) {
        recordingUrlRef.current = message.call.recordingUrl
      }
    })

    // Real-time speaking + volume events — these are the fastest indicators
    vapi.on('speech-start', () => setIsSpeaking(true))
    vapi.on('speech-end', () => { setIsSpeaking(false); setVolumeLevel(0) })
    vapi.on('volume-level', (vol: number) => setVolumeLevel(vol))

    vapi.on('error', (e: any) => {
      const raw = e?.error?.message || e?.message || e?.msg || e?.errorMessage
      const errorMsg = typeof raw === 'string' ? raw
        : typeof e === 'string' ? e
        : JSON.stringify(e)

      const isTransient = (
        errorMsg.includes('revcn') || errorMsg.includes('ably') ||
        errorMsg.includes('not connected') ||
        errorMsg.includes('Meeting has ended') ||
        errorMsg.includes('Meeting ended') ||
        errorMsg.includes('ejection')
      )
      if (isTransient) {
        console.warn('Vapi transient error (ignored):', errorMsg)
        return
      }
      setError(errorMsg)
      setCallStatus('error')
    })
  }

  const startWebCall = async () => {
    if (!isReadyToCall) return
    setCallStatus('connecting')
    setError(null)
    setTranscript([])

    // Check mic permission without acquiring/releasing a stream.
    // The old getUserMedia → stop() pattern briefly locked then released the mic,
    // which could cause Vapi's subsequent getUserMedia to get silence on some systems.
    try {
      const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      if (perm.state === 'denied') {
        setError('Microphone access denied. Please allow microphone in your browser settings.')
        setCallStatus('error')
        return
      }
    } catch {
      // Permissions API not supported — Vapi will request mic access itself
    }

    try {
      const Vapi = (await import('@vapi-ai/web')).default
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
      if (!publicKey || publicKey === 'your-vapi-public-key-here') {
        throw new Error('Vapi public key not configured.')
      }
      const vapi = new Vapi(publicKey)
      vapiRef.current = vapi

      if (mode === 'agent' && selectedAgent) {
        // ── Agent mode ──
        attachVapiEvents(vapi, `[${selectedAgent.name}] ${selectedAgent.description || selectedAgent.category}`)
        // Use the Vapi assistant ID as-is — all model/voice/transcriber/tools/silence
        // settings come directly from the Vapi dashboard with no local overrides.
        await vapi.start(selectedAgent.vapi_assistant_id)

      } else {
        // ── Custom mode ──
        const intentResult = detectIntent(details)
        const activeCategory = selectedCategory || intentResult.category
        const { systemPrompt, firstMessage } = buildPrompt({
          lead,
          category: activeCategory,
          details,
          language: selectedLanguage,
          extractedData: intentResult.extractedData
        })

        attachVapiEvents(vapi, details)

        const langConfig = SUPPORTED_LANGUAGES[selectedLanguage]
        const voiceConfig = langConfig.voiceProvider === 'azure'
          ? { provider: 'azure' as const, voiceId: langConfig.voiceId as 'ta-IN-PallaviNeural' }
          : { provider: 'openai' as const, voiceId: langConfig.voiceId as 'nova' }

        const transcriberConfig = langConfig.transcriberProvider === 'azure'
          ? { provider: 'azure' as const, language: langConfig.transcriberLanguage as 'ta-IN' }
          : { provider: 'deepgram' as const, model: langConfig.transcriberModel || 'nova-2', language: langConfig.transcriberLanguage as 'en' }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await vapi.start({
          name: 'Business Assistant',
          firstMessage,
          transcriber: transcriberConfig,
          model: {
            provider: 'google' as const,
            model: 'gemini-2.0-flash' as const,
            messages: [{ role: 'system' as const, content: systemPrompt }]
          },
          voice: voiceConfig,
          // silenceTimeoutSeconds exists in the Vapi API but is missing from SDK types
          silenceTimeoutSeconds: 90,
        } as any)
      }
    } catch (err: any) {
      console.error('Failed to start web call:', err)
      const msg = typeof err?.message === 'string' ? err.message
        : typeof err?.msg === 'string' ? err.msg
        : 'Failed to start call'
      const isEjection = msg.includes('Meeting ended') || msg.includes('Meeting has ended') || msg.includes('ejection')
      if (isEjection) {
        console.warn('Vapi call ended (catch):', msg)
        setCallStatus('ended')
      } else {
        setError(msg)
        setCallStatus('error')
      }
    }
  }

  const endCall = () => {
    if (vapiRef.current) vapiRef.current.stop()
    setCallStatus('ended')
  }

  const toggleMute = () => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {callStatus === 'idle' ? 'Start AI Call' : 'AI Call in Progress'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {/* Lead Info */}
          <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border border-blue-100 dark:border-slate-600 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-lg flex-shrink-0">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{lead.name}</p>
              {lead.business_name && <p className="text-xs text-gray-500 dark:text-gray-400">{lead.business_name}</p>}
            </div>
          </div>

          {callStatus === 'idle' && (
            <>
              {/* Mode Tabs */}
              <div className="flex rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-1 mb-5">
                <button
                  onClick={() => setMode('agent')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'agent'
                      ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Bot className="h-4 w-4" /> Use Agent
                </button>
                <button
                  onClick={() => setMode('custom')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === 'custom'
                      ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Mic className="h-4 w-4" /> Custom
                </button>
              </div>

              {/* ── AGENT MODE ── */}
              {mode === 'agent' && (
                <div>
                  {agentsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="text-center py-10">
                      <Bot className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No agents created yet.</p>
                      <a href="/agents" className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        <Plus className="h-4 w-4" /> Create an Agent
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-5">
                      {agents.map((agent: Agent) => {
                        const isSelected = selectedAgent?.id === agent.id
                        return (
                          <button
                            key={agent.id}
                            onClick={() => setSelectedAgent(isSelected ? null : agent)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-blue-500' : 'bg-gray-100 dark:bg-slate-700'}`}>
                              <Bot className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">{agent.name}</span>
                                <span className="text-base flex-shrink-0">{CATEGORY_LABELS[agent.category] || '💬'}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                  {agent.language === 'ta' ? 'தமிழ்' : 'EN'}
                                </span>
                              </div>
                              {agent.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{agent.description}</p>
                              )}
                            </div>
                            {isSelected && <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── CUSTOM MODE ── */}
              {mode === 'custom' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Call Type <span className="font-normal text-gray-500">(optional)</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {CATEGORY_LIST.map(cat => {
                        const isSelected = selectedCategory === cat.id
                        const isDetected = detectedCategory === cat.id && !selectedCategory
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all border-2 hover:scale-105 active:scale-95 ${
                              isSelected
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                                : isDetected
                                ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/50 text-blue-600 dark:text-blue-300'
                                : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <span className="text-2xl mb-1">{cat.icon}</span>
                            <span className="text-xs font-medium">{cat.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      <Globe className="inline-block w-4 h-4 mr-1 -mt-0.5" /> Language
                    </label>
                    <div className="flex gap-2">
                      {LANGUAGE_LIST.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setSelectedLanguage(lang.code)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-sm font-medium ${
                            selectedLanguage === lang.code
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-400 text-white shadow-lg'
                              : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>{lang.nativeLabel}</span>
                          {lang.code !== 'en' && (
                            <span className={`text-xs ${selectedLanguage === lang.code ? 'text-purple-200' : 'text-gray-400 dark:text-gray-500'}`}>
                              ({lang.label})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Call Purpose <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      placeholder={CALL_CATEGORIES[selectedCategory || 'general'].placeholder}
                      rows={3}
                      maxLength={500}
                      className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
                    />
                  </div>

                  {details.trim() && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">AI Opening Message</p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-200 italic">
                        "{buildPrompt({ lead, category: getActiveCategory(), details, language: selectedLanguage, extractedData: detectIntent(details).extractedData }).firstMessage}"
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-3 mt-2">
                <Button variant="outline" onClick={onClose} className="flex-1 h-11 border-gray-300 dark:border-slate-600">
                  Cancel
                </Button>
                <Button
                  onClick={startWebCall}
                  disabled={!isReadyToCall}
                  className="flex-1 h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:shadow-none disabled:from-gray-400 disabled:to-gray-500"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  {mode === 'agent' ? (selectedAgent ? `Call with ${selectedAgent.name}` : 'Select an Agent') : 'Start Call'}
                </Button>
              </div>
            </>
          )}

          {callStatus === 'connecting' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-700 dark:text-gray-300">Connecting to AI assistant...</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Please allow microphone access when prompted</p>
            </div>
          )}

          {(callStatus === 'connected' || callStatus === 'ended') && (
            <>
              {/* ── Live speaking indicators ── */}
              {callStatus === 'connected' && (
                <div className="flex items-center justify-center gap-3 mb-3">
                  {/* You */}
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 ${
                    isSpeaking && !isMuted
                      ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-gray-100 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 text-gray-400 dark:text-gray-500'
                  }`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isSpeaking && !isMuted ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-500'
                    }`} />
                    {isMuted ? 'Muted' : 'You'}
                  </div>

                  {/* Volume bar — 5 segments driven by volumeLevel (0–1) */}
                  <div className="flex items-end gap-0.5 h-4">
                    {[0.1, 0.25, 0.45, 0.65, 0.85].map((t, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-sm transition-all duration-75 ${
                          volumeLevel > t
                            ? 'bg-emerald-500'
                            : 'bg-gray-200 dark:bg-slate-600'
                        }`}
                        style={{ height: `${40 + i * 15}%` }}
                      />
                    ))}
                  </div>

                  {/* AI Agent */}
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 ${
                    isAgentSpeaking
                      ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 text-gray-400 dark:text-gray-500'
                  }`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isAgentSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-500'
                    }`} />
                    AI Agent
                  </div>
                </div>
              )}

              {/* Transcript */}
              <div className="flex-1 overflow-y-auto mb-4 min-h-[200px] max-h-[300px] p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                {transcript.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">Waiting for conversation...</p>
                ) : (
                  <div className="space-y-3">
                    {transcript.map((msg, i) => (
                      <div key={i} className={`text-sm p-3 rounded-xl ${
                        msg.role === 'assistant'
                          ? 'bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 ml-4'
                          : msg.role === 'user'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 mr-4'
                          : 'text-center text-gray-500 dark:text-gray-500 text-xs'
                      }`}>
                        {msg.role !== 'system' && (
                          <span className="font-semibold capitalize block mb-1 text-xs text-gray-600 dark:text-gray-400">
                            {msg.role === 'assistant' ? '🤖 AI' : '👤 You'}
                          </span>
                        )}
                        <span className="text-gray-800 dark:text-gray-200">{msg.content}</span>
                      </div>
                    ))}
                    <div ref={transcriptEndRef} />
                  </div>
                )}
              </div>

              {callStatus === 'connected' && (
                <div className="flex justify-center gap-4">
                  {/* Mic button — glows when actively speaking */}
                  <div className="relative">
                    {isSpeaking && !isMuted && (
                      <span className="absolute -inset-1.5 rounded-xl bg-emerald-400/25 animate-pulse pointer-events-none" />
                    )}
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={toggleMute}
                      className={`relative ${isMuted ? 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400' : ''}`}
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                  </div>
                  <Button size="lg" onClick={endCall} className="bg-red-500 hover:bg-red-600 text-white">
                    <PhoneOff className="h-5 w-5 mr-2" /> End Call
                  </Button>
                </div>
              )}
              {callStatus === 'ended' && (
                <Button onClick={onClose} className="w-full h-11">Close</Button>
              )}
            </>
          )}

          {callStatus === 'error' && (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2">
                {error || 'An error occurred'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
                <Button onClick={() => setCallStatus('idle')} className="flex-1">Try Again</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
